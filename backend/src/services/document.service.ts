import { v4 as uuidv4 } from 'uuid';
import { storageService } from './storage.service.js';
import { classificationService } from './classification.service.js';
import { extractionService } from './extraction.service.js';
import { checklistService } from './checklist.service.js';
import {
  documentRepository,
  documentVersionRepository,
  extractionVersionRepository,
  applicationRepository,
  processingLogRepository,
} from '../database/repositories.js';
import { config } from '../config/index.js';
import type {
  Document,
  ClassificationResult,
  ExtractionResult,
  ExtractedDocumentData,
  DocumentChecklistStatus,
} from '../types/index.js';

export interface UploadResult {
  document: Document;
  classification?: ClassificationResult;
  extraction?: ExtractionResult;
}

export interface ProcessingResult {
  success: boolean;
  documentId: string;
  classification?: ClassificationResult;
  extraction?: ExtractionResult;
  checklistStatus?: DocumentChecklistStatus;
  errors?: string[];
}

export class DocumentService {
  /**
   * Upload a new document for an application
   */
  async uploadDocument(
    applicationId: string,
    cluid: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    processImmediately: boolean = true
  ): Promise<UploadResult> {
    const startTime = Date.now();

    // Validate file
    this.validateFile(fileBuffer, mimeType);

    // Upload to S3
    const { s3Key } = await storageService.uploadDocument(
      cluid,
      applicationId,
      fileName,
      fileBuffer,
      mimeType,
      1 // Initial version
    );

    // Create document record
    const document = documentRepository.create({
      applicationId,
      cluid,
      fileName: this.sanitizeFileName(fileName),
      originalFileName: fileName,
      mimeType,
      fileSize: fileBuffer.length,
      s3Key,
    });

    // Create initial version record
    documentVersionRepository.create({
      documentId: document.id,
      version: 1,
      s3Key,
      changeReason: 'Initial upload',
    });

    // Log upload
    processingLogRepository.log({
      documentId: document.id,
      applicationId,
      action: 'upload',
      status: 'completed',
      durationMs: Date.now() - startTime,
    });

    let result: UploadResult = { document };

    // Process immediately if requested
    if (processImmediately) {
      const processResult = await this.processDocument(document.id);
      result = {
        document: documentRepository.findById(document.id)!,
        classification: processResult.classification,
        extraction: processResult.extraction,
      };
    }

    return result;
  }

  /**
   * Process a document (classify and extract)
   */
  async processDocument(documentId: string): Promise<ProcessingResult> {
    const document = documentRepository.findById(documentId);
    if (!document) {
      return {
        success: false,
        documentId,
        errors: ['Document not found'],
      };
    }

    const errors: string[] = [];
    let classification: ClassificationResult | undefined;
    let extraction: ExtractionResult | undefined;

    try {
      // Get document from S3
      const { base64, mimeType } = await storageService.getDocumentAsBase64(document.s3Key);

      // Step 1: Classification
      documentRepository.updateProcessingStatus(documentId, 'classifying');
      const classifyStart = Date.now();

      classification = await classificationService.classifyDocument(base64, mimeType);

      documentRepository.updateClassification(
        documentId,
        classification.category,
        classification.confidence
      );

      processingLogRepository.log({
        documentId,
        applicationId: document.applicationId,
        action: 'classification',
        status: 'completed',
        details: `Category: ${classification.category}, Confidence: ${classification.confidence}`,
        durationMs: Date.now() - classifyStart,
      });

      // Step 2: Extraction
      if (classification.category !== 'unknown' && classification.confidence >= config.documents.classificationThreshold) {
        documentRepository.updateProcessingStatus(documentId, 'extracting');
        const extractStart = Date.now();

        extraction = await extractionService.extractDocument(
          base64,
          mimeType,
          classification.category
        );

        if (extraction.success) {
          const extractedData: ExtractedDocumentData = {
            documentType: extraction.documentType,
            confidence: classification.confidence,
            extractedAt: new Date().toISOString(),
            fields: extraction.fields,
          };

          // Save extraction to database
          documentRepository.updateExtraction(
            documentId,
            extractedData,
            extraction.completenessScore,
            extraction.issues.map((i) => i.message)
          );

          // Get updated document for version tracking
          const updatedDoc = documentRepository.findById(documentId)!;

          // Save extraction version
          extractionVersionRepository.create({
            documentId,
            version: updatedDoc.extractionVersion,
            extractedData,
            modelVersion: config.openai.model,
            promptVersion: '1.0',
          });

          // Upload extraction to S3
          await storageService.uploadExtraction(
            document.cluid,
            document.applicationId,
            documentId,
            extractedData,
            updatedDoc.extractionVersion
          );

          processingLogRepository.log({
            documentId,
            applicationId: document.applicationId,
            action: 'extraction',
            status: 'completed',
            details: `Completeness: ${extraction.completenessScore}%, Issues: ${extraction.issues.length}`,
            durationMs: Date.now() - extractStart,
          });
        } else {
          errors.push('Extraction failed');
          documentRepository.updateProcessingStatus(documentId, 'validation_failed');

          processingLogRepository.log({
            documentId,
            applicationId: document.applicationId,
            action: 'extraction',
            status: 'failed',
            errorMessage: extraction.issues.map((i) => i.message).join('; '),
          });
        }
      } else {
        // Low confidence classification
        documentRepository.updateProcessingStatus(documentId, 'completed');
        processingLogRepository.log({
          documentId,
          applicationId: document.applicationId,
          action: 'extraction',
          status: 'completed',
          details: 'Skipped - low classification confidence or unknown category',
        });
      }

      // Step 3: Update application checklist
      const checklistStatus = await this.updateApplicationChecklist(document.applicationId);

      // Mark as completed
      if (documentRepository.findById(documentId)?.processingStatus !== 'validation_failed') {
        documentRepository.updateProcessingStatus(documentId, 'completed');
      }

      return {
        success: true,
        documentId,
        classification,
        extraction,
        checklistStatus,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      documentRepository.updateProcessingStatus(documentId, 'error');

      processingLogRepository.log({
        documentId,
        applicationId: document.applicationId,
        action: 'processing',
        status: 'failed',
        errorMessage,
      });

      return {
        success: false,
        documentId,
        errors,
      };
    }
  }

  /**
   * Reprocess a document (re-run classification and extraction)
   */
  async reprocessDocument(documentId: string): Promise<ProcessingResult> {
    const document = documentRepository.findById(documentId);
    if (!document) {
      return {
        success: false,
        documentId,
        errors: ['Document not found'],
      };
    }

    // Reset processing status
    documentRepository.updateProcessingStatus(documentId, 'uploaded');

    return this.processDocument(documentId);
  }

  /**
   * Update a document with a new version
   */
  async updateDocumentVersion(
    documentId: string,
    fileBuffer: Buffer,
    mimeType: string,
    changeReason: string,
    createdBy?: string
  ): Promise<UploadResult> {
    const document = documentRepository.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Upload new version to S3
    const newVersion = document.version + 1;
    const { s3Key } = await storageService.uploadDocument(
      document.cluid,
      document.applicationId,
      document.fileName,
      fileBuffer,
      mimeType,
      newVersion
    );

    // Update document record
    documentRepository.incrementVersion(documentId, s3Key);

    // Create version record
    documentVersionRepository.create({
      documentId,
      version: newVersion,
      s3Key,
      changeReason,
      createdBy,
    });

    // Reprocess with new version
    const processResult = await this.processDocument(documentId);

    return {
      document: documentRepository.findById(documentId)!,
      classification: processResult.classification,
      extraction: processResult.extraction,
    };
  }

  /**
   * Update application checklist based on current documents
   */
  async updateApplicationChecklist(applicationId: string): Promise<DocumentChecklistStatus> {
    const application = applicationRepository.findById(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    const documents = documentRepository.findByApplicationId(applicationId);
    const checklistStatus = checklistService.evaluateChecklist(
      documents,
      application.applicantData
    );

    applicationRepository.updateChecklistStatus(applicationId, checklistStatus);

    // Update application status based on checklist
    const completeness = checklistService.calculateOverallCompleteness(checklistStatus);
    const missingDocs = checklistService.getMissingDocuments(checklistStatus);

    if (missingDocs.length > 0) {
      applicationRepository.updateStatus(applicationId, 'documents_pending');
    } else if (completeness < 100) {
      applicationRepository.updateStatus(applicationId, 'documents_review');
    } else {
      applicationRepository.updateStatus(applicationId, 'eligibility_check');
    }

    return checklistStatus;
  }

  /**
   * Get document with all versions
   */
  async getDocumentWithVersions(documentId: string) {
    const document = documentRepository.findById(documentId);
    if (!document) {
      return null;
    }

    const documentVersions = documentVersionRepository.findByDocumentId(documentId);
    const extractionVersions = extractionVersionRepository.findByDocumentId(documentId);

    return {
      document,
      documentVersions,
      extractionVersions,
    };
  }

  /**
   * Get application document summary
   */
  async getApplicationDocumentSummary(applicationId: string) {
    const application = applicationRepository.findById(applicationId);
    if (!application) {
      return null;
    }

    const documents = documentRepository.findByApplicationId(applicationId);
    const checklistStatus = application.documentChecklistStatus ||
      checklistService.evaluateChecklist(documents, application.applicantData);

    const completeness = checklistService.calculateOverallCompleteness(checklistStatus);
    const missingDocs = checklistService.getMissingDocuments(checklistStatus);
    const needsReview = checklistService.getItemsNeedingReview(checklistStatus);

    return {
      application,
      documents,
      checklistStatus,
      summary: {
        totalDocuments: documents.length,
        completenessPercentage: completeness,
        missingDocuments: missingDocs,
        itemsNeedingReview: needsReview,
        processingStatus: {
          uploaded: documents.filter((d) => d.processingStatus === 'uploaded').length,
          processing: documents.filter((d) =>
            ['classifying', 'extracting'].includes(d.processingStatus)
          ).length,
          completed: documents.filter((d) => d.processingStatus === 'completed').length,
          errors: documents.filter((d) =>
            ['error', 'validation_failed'].includes(d.processingStatus)
          ).length,
        },
      },
    };
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    const document = documentRepository.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Delete from S3 (all versions)
    const versions = documentVersionRepository.findByDocumentId(documentId);
    for (const version of versions) {
      await storageService.deleteDocument(version.s3Key);
    }

    // Delete current version
    await storageService.deleteDocument(document.s3Key);

    // Delete from database (cascade will handle versions)
    documentRepository.delete(documentId);

    // Update checklist
    await this.updateApplicationChecklist(document.applicationId);
  }

  /**
   * Validate uploaded file
   */
  private validateFile(fileBuffer: Buffer, mimeType: string): void {
    if (fileBuffer.length > config.documents.maxFileSize) {
      throw new Error(
        `File size exceeds maximum allowed (${config.documents.maxFileSize / 1024 / 1024}MB)`
      );
    }

    if (!config.documents.allowedMimeTypes.includes(mimeType)) {
      throw new Error(
        `File type ${mimeType} is not allowed. Allowed types: ${config.documents.allowedMimeTypes.join(', ')}`
      );
    }
  }

  /**
   * Sanitize file name
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }
}

export const documentService = new DocumentService();
