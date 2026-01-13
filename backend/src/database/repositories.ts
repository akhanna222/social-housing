import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './schema.js';
import type {
  Application,
  ApplicationStatus,
  Document,
  DocumentCategory,
  DocumentProcessingStatus,
  ExtractedDocumentData,
  DocumentVersion,
  ExtractionVersion,
  ApplicantData,
  DocumentChecklistStatus,
} from '../types/index.js';

// Application Repository
export class ApplicationRepository {
  /**
   * Generate a unique reference number using a database sequence.
   * Format: SH-YYYY-NNNN where NNNN is a zero-padded sequential number.
   * Uses atomic database operations to prevent race conditions and duplicates.
   */
  private generateReferenceNumber(): string {
    const db = getDatabase();
    const year = new Date().getFullYear();
    const sequenceName = `ref_number_${year}`;

    // Use a transaction to atomically increment and retrieve the sequence
    const getNextSequence = db.transaction(() => {
      // Try to increment existing sequence
      const updateResult = db.prepare(
        'UPDATE sequences SET current_value = current_value + 1 WHERE name = ?'
      ).run(sequenceName);

      if (updateResult.changes === 0) {
        // Sequence doesn't exist for this year, create it starting at 1
        db.prepare(
          'INSERT INTO sequences (name, current_value) VALUES (?, 1)'
        ).run(sequenceName);
        return 1;
      }

      // Get the updated value
      const row = db.prepare(
        'SELECT current_value FROM sequences WHERE name = ?'
      ).get(sequenceName) as { current_value: number };

      return row.current_value;
    });

    const sequenceNumber = getNextSequence();
    return `SH-${year}-${sequenceNumber.toString().padStart(4, '0')}`;
  }

  create(cluid: string, applicantData: ApplicantData): Application {
    const db = getDatabase();
    const id = uuidv4();
    const referenceNumber = this.generateReferenceNumber();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO applications (id, cluid, reference_number, status, applicant_data, created_at, updated_at)
      VALUES (?, ?, ?, 'draft', ?, ?, ?)
    `).run(id, cluid, referenceNumber, JSON.stringify(applicantData), now, now);

    return this.findById(id)!;
  }

  findById(id: string): Application | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as Record<string, unknown> | undefined;

    if (!row) return null;

    return this.rowToApplication(row);
  }

  findByCluid(cluid: string): Application[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM applications WHERE cluid = ? ORDER BY created_at DESC').all(cluid) as Record<string, unknown>[];

    return rows.map((row) => this.rowToApplication(row));
  }

  updateStatus(id: string, status: ApplicationStatus): void {
    const db = getDatabase();
    db.prepare('UPDATE applications SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, new Date().toISOString(), id);
  }

  updateChecklistStatus(id: string, checklistStatus: DocumentChecklistStatus): void {
    const db = getDatabase();
    db.prepare('UPDATE applications SET checklist_status = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify(checklistStatus), new Date().toISOString(), id);
  }

  private rowToApplication(row: Record<string, unknown>): Application {
    return {
      id: row.id as string,
      cluid: row.cluid as string,
      referenceNumber: row.reference_number as string,
      status: row.status as ApplicationStatus,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      applicantData: JSON.parse(row.applicant_data as string),
      documentChecklistStatus: row.checklist_status
        ? JSON.parse(row.checklist_status as string)
        : undefined,
    };
  }
}

// Document Repository
export class DocumentRepository {
  create(data: {
    applicationId: string;
    cluid: string;
    fileName: string;
    originalFileName: string;
    mimeType: string;
    fileSize: number;
    s3Key: string;
  }): Document {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO documents (
        id, application_id, cluid, file_name, original_file_name,
        mime_type, file_size, s3_key, version, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      id,
      data.applicationId,
      data.cluid,
      data.fileName,
      data.originalFileName,
      data.mimeType,
      data.fileSize,
      data.s3Key,
      now,
      now
    );

    return this.findById(id)!;
  }

  findById(id: string): Document | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as Record<string, unknown> | undefined;

    if (!row) return null;

    return this.rowToDocument(row);
  }

  findByApplicationId(applicationId: string): Document[] {
    const db = getDatabase();
    const rows = db.prepare(
      'SELECT * FROM documents WHERE application_id = ? ORDER BY created_at DESC'
    ).all(applicationId) as Record<string, unknown>[];

    return rows.map((row) => this.rowToDocument(row));
  }

  findByCluid(cluid: string): Document[] {
    const db = getDatabase();
    const rows = db.prepare(
      'SELECT * FROM documents WHERE cluid = ? ORDER BY created_at DESC'
    ).all(cluid) as Record<string, unknown>[];

    return rows.map((row) => this.rowToDocument(row));
  }

  updateClassification(
    id: string,
    category: DocumentCategory,
    confidence: number
  ): void {
    const db = getDatabase();
    db.prepare(`
      UPDATE documents
      SET category = ?, classification_confidence = ?,
          processing_status = 'classified', updated_at = ?
      WHERE id = ?
    `).run(category, confidence, new Date().toISOString(), id);
  }

  updateExtraction(
    id: string,
    extractedData: ExtractedDocumentData,
    completenessScore: number,
    completenessIssues: string[]
  ): void {
    const db = getDatabase();

    // Get current extraction version
    const doc = this.findById(id);
    const newVersion = (doc?.extractionVersion || 0) + 1;

    db.prepare(`
      UPDATE documents
      SET extracted_data = ?, extraction_version = ?,
          completeness_score = ?, completeness_issues = ?,
          processing_status = 'extracted', updated_at = ?
      WHERE id = ?
    `).run(
      JSON.stringify(extractedData),
      newVersion,
      completenessScore,
      JSON.stringify(completenessIssues),
      new Date().toISOString(),
      id
    );
  }

  updateProcessingStatus(id: string, status: DocumentProcessingStatus): void {
    const db = getDatabase();
    db.prepare('UPDATE documents SET processing_status = ?, updated_at = ? WHERE id = ?')
      .run(status, new Date().toISOString(), id);
  }

  incrementVersion(id: string, newS3Key: string): number {
    const db = getDatabase();
    const doc = this.findById(id);
    const newVersion = (doc?.version || 0) + 1;

    db.prepare(`
      UPDATE documents
      SET version = ?, s3_key = ?, updated_at = ?
      WHERE id = ?
    `).run(newVersion, newS3Key, new Date().toISOString(), id);

    return newVersion;
  }

  delete(id: string): void {
    const db = getDatabase();
    db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  }

  private rowToDocument(row: Record<string, unknown>): Document {
    return {
      id: row.id as string,
      applicationId: row.application_id as string,
      cluid: row.cluid as string,
      fileName: row.file_name as string,
      originalFileName: row.original_file_name as string,
      mimeType: row.mime_type as string,
      fileSize: row.file_size as number,
      s3Key: row.s3_key as string,
      version: row.version as number,
      category: row.category as DocumentCategory,
      classificationConfidence: row.classification_confidence as number,
      processingStatus: row.processing_status as DocumentProcessingStatus,
      extractedData: row.extracted_data
        ? JSON.parse(row.extracted_data as string)
        : undefined,
      extractionVersion: row.extraction_version as number,
      completenessScore: row.completeness_score as number,
      completenessIssues: row.completeness_issues
        ? JSON.parse(row.completeness_issues as string)
        : [],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

// Document Version Repository
export class DocumentVersionRepository {
  create(data: {
    documentId: string;
    version: number;
    s3Key: string;
    extractedData?: ExtractedDocumentData;
    changeReason?: string;
    createdBy?: string;
  }): DocumentVersion {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO document_versions (
        id, document_id, version, s3_key, extracted_data,
        change_reason, created_by, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.documentId,
      data.version,
      data.s3Key,
      data.extractedData ? JSON.stringify(data.extractedData) : null,
      data.changeReason,
      data.createdBy,
      now
    );

    return this.findById(id)!;
  }

  findById(id: string): DocumentVersion | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM document_versions WHERE id = ?').get(id) as Record<string, unknown> | undefined;

    if (!row) return null;

    return this.rowToDocumentVersion(row);
  }

  findByDocumentId(documentId: string): DocumentVersion[] {
    const db = getDatabase();
    const rows = db.prepare(
      'SELECT * FROM document_versions WHERE document_id = ? ORDER BY version DESC'
    ).all(documentId) as Record<string, unknown>[];

    return rows.map((row) => this.rowToDocumentVersion(row));
  }

  private rowToDocumentVersion(row: Record<string, unknown>): DocumentVersion {
    return {
      id: row.id as string,
      documentId: row.document_id as string,
      version: row.version as number,
      s3Key: row.s3_key as string,
      extractedData: row.extracted_data
        ? JSON.parse(row.extracted_data as string)
        : undefined,
      createdAt: row.created_at as string,
      createdBy: row.created_by as string | undefined,
      changeReason: row.change_reason as string | undefined,
    };
  }
}

// Extraction Version Repository
export class ExtractionVersionRepository {
  create(data: {
    documentId: string;
    version: number;
    extractedData: ExtractedDocumentData;
    modelVersion?: string;
    promptVersion?: string;
    s3Key?: string;
  }): ExtractionVersion {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO extraction_versions (
        id, document_id, version, extracted_data,
        model_version, prompt_version, s3_key, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.documentId,
      data.version,
      JSON.stringify(data.extractedData),
      data.modelVersion,
      data.promptVersion,
      data.s3Key,
      now
    );

    return this.findById(id)!;
  }

  findById(id: string): ExtractionVersion | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM extraction_versions WHERE id = ?').get(id) as Record<string, unknown> | undefined;

    if (!row) return null;

    return this.rowToExtractionVersion(row);
  }

  findByDocumentId(documentId: string): ExtractionVersion[] {
    const db = getDatabase();
    const rows = db.prepare(
      'SELECT * FROM extraction_versions WHERE document_id = ? ORDER BY version DESC'
    ).all(documentId) as Record<string, unknown>[];

    return rows.map((row) => this.rowToExtractionVersion(row));
  }

  getLatestVersion(documentId: string): ExtractionVersion | null {
    const db = getDatabase();
    const row = db.prepare(
      'SELECT * FROM extraction_versions WHERE document_id = ? ORDER BY version DESC LIMIT 1'
    ).get(documentId) as Record<string, unknown> | undefined;

    if (!row) return null;

    return this.rowToExtractionVersion(row);
  }

  private rowToExtractionVersion(row: Record<string, unknown>): ExtractionVersion {
    return {
      id: row.id as string,
      documentId: row.document_id as string,
      version: row.version as number,
      extractedData: JSON.parse(row.extracted_data as string),
      modelVersion: row.model_version as string,
      promptVersion: row.prompt_version as string,
      createdAt: row.created_at as string,
    };
  }
}

// Processing Log Repository
export class ProcessingLogRepository {
  log(data: {
    documentId: string;
    applicationId: string;
    action: string;
    status: 'started' | 'completed' | 'failed';
    details?: string;
    errorMessage?: string;
    durationMs?: number;
  }): void {
    const db = getDatabase();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO processing_log (
        id, document_id, application_id, action, status,
        details, error_message, duration_ms, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.documentId,
      data.applicationId,
      data.action,
      data.status,
      data.details,
      data.errorMessage,
      data.durationMs,
      new Date().toISOString()
    );
  }

  findByDocumentId(documentId: string): unknown[] {
    const db = getDatabase();
    return db.prepare(
      'SELECT * FROM processing_log WHERE document_id = ? ORDER BY created_at DESC'
    ).all(documentId);
  }

  findByApplicationId(applicationId: string): unknown[] {
    const db = getDatabase();
    return db.prepare(
      'SELECT * FROM processing_log WHERE application_id = ? ORDER BY created_at DESC'
    ).all(applicationId);
  }
}

// Export singleton instances
export const applicationRepository = new ApplicationRepository();
export const documentRepository = new DocumentRepository();
export const documentVersionRepository = new DocumentVersionRepository();
export const extractionVersionRepository = new ExtractionVersionRepository();
export const processingLogRepository = new ProcessingLogRepository();
