import { Request, Response, NextFunction } from 'express';
import { documentService } from '../services/document.service.js';
import { storageService } from '../services/storage.service.js';
import {
  documentRepository,
  documentVersionRepository,
  extractionVersionRepository,
  applicationRepository,
} from '../database/repositories.js';
import type { ApiResponse, Document } from '../types/index.js';

export class DocumentController {
  /**
   * Upload a document
   */
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const applicationId = req.params.applicationId as string;
      const file = req.file;
      const processImmediately = req.query.processImmediately as string;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No file uploaded' },
        } as ApiResponse<null>);
      }

      // Get application to retrieve CLUID
      const application = applicationRepository.findById(applicationId);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Application not found' },
        } as ApiResponse<null>);
      }

      const result = await documentService.uploadDocument(
        applicationId,
        application.cluid,
        file.originalname,
        file.buffer,
        file.mimetype,
        processImmediately !== 'false'
      );

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const document = documentRepository.findById(id);

      if (!document) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Document not found' },
        } as ApiResponse<null>);
      }

      return res.json({
        success: true,
        data: document,
      } as ApiResponse<Document>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document with all versions
   */
  async getWithVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await documentService.getDocumentWithVersions(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Document not found' },
        } as ApiResponse<null>);
      }

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get documents by application ID
   */
  async getByApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const applicationId = req.params.applicationId as string;
      const documents = documentRepository.findByApplicationId(applicationId);

      return res.json({
        success: true,
        data: documents,
      } as ApiResponse<Document[]>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process a document (classify and extract)
   */
  async process(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await documentService.processDocument(id);

      return res.json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reprocess a document
   */
  async reprocess(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await documentService.reprocessDocument(id);

      return res.json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload new version of a document
   */
  async uploadVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const file = req.file;
      const { changeReason, createdBy } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'No file uploaded' },
        } as ApiResponse<null>);
      }

      const result = await documentService.updateDocumentVersion(
        id,
        file.buffer,
        file.mimetype,
        changeReason || 'Document updated',
        createdBy
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download document file
   */
  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const version = req.query.version as string | undefined;

      const document = documentRepository.findById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Document not found' },
        } as ApiResponse<null>);
      }

      let s3Key = document.s3Key;

      // If specific version requested
      if (version) {
        const versionRecord = documentVersionRepository
          .findByDocumentId(id)
          .find((v) => v.version === parseInt(version, 10));

        if (versionRecord) {
          s3Key = versionRecord.s3Key;
        }
      }

      const { body, contentType } = await storageService.getDocument(s3Key);

      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${document.originalFileName}"`
      );

      return res.send(body);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get extracted data
   */
  async getExtraction(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const version = req.query.version as string | undefined;

      const document = documentRepository.findById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Document not found' },
        } as ApiResponse<null>);
      }

      let extractedData = document.extractedData;

      // If specific version requested
      if (version) {
        const versionRecord = extractionVersionRepository
          .findByDocumentId(id)
          .find((v) => v.version === parseInt(version, 10));

        if (versionRecord) {
          extractedData = versionRecord.extractedData;
        }
      }

      return res.json({
        success: true,
        data: {
          documentId: id,
          category: document.category,
          completenessScore: document.completenessScore,
          completenessIssues: document.completenessIssues,
          extractedData,
          extractionVersion: document.extractionVersion,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get extraction history
   */
  async getExtractionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const versions = extractionVersionRepository.findByDocumentId(id);

      return res.json({
        success: true,
        data: versions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Override document classification
   */
  async overrideClassification(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { category, reprocess = true } = req.body;

      const document = documentRepository.findById(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Document not found' },
        } as ApiResponse<null>);
      }

      // Update classification manually
      documentRepository.updateClassification(id, category, 1.0); // Manual = 100% confidence

      // Reprocess if requested
      if (reprocess) {
        await documentService.reprocessDocument(id);
      }

      return res.json({
        success: true,
        data: documentRepository.findById(id),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete document
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      await documentService.deleteDocument(id);

      return res.json({
        success: true,
        data: { message: 'Document deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
