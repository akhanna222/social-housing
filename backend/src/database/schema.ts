import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    // Ensure directory exists
    const dbDir = path.dirname(config.database.path);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(config.database.path);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initializeDatabase(): void {
  const db = getDatabase();

  // Applications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      cluid TEXT NOT NULL,
      reference_number TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      applicant_data TEXT NOT NULL,
      checklist_status TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_applications_cluid ON applications(cluid);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
  `);

  // Documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      cluid TEXT NOT NULL,
      file_name TEXT NOT NULL,
      original_file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      s3_key TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      category TEXT NOT NULL DEFAULT 'unknown',
      classification_confidence REAL DEFAULT 0,
      processing_status TEXT NOT NULL DEFAULT 'uploaded',
      extracted_data TEXT,
      extraction_version INTEGER DEFAULT 0,
      completeness_score INTEGER DEFAULT 0,
      completeness_issues TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_documents_application ON documents(application_id);
    CREATE INDEX IF NOT EXISTS idx_documents_cluid ON documents(cluid);
    CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
    CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(processing_status);
  `);

  // Document versions table (for version history)
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_versions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      s3_key TEXT NOT NULL,
      extracted_data TEXT,
      change_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_by TEXT,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_doc_versions_document ON document_versions(document_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_doc_versions_unique ON document_versions(document_id, version);
  `);

  // Extraction versions table (for JSON output versioning)
  db.exec(`
    CREATE TABLE IF NOT EXISTS extraction_versions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      extracted_data TEXT NOT NULL,
      model_version TEXT,
      prompt_version TEXT,
      s3_key TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_extraction_versions_document ON extraction_versions(document_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_extraction_versions_unique ON extraction_versions(document_id, version);
  `);

  // Processing log table (for audit)
  db.exec(`
    CREATE TABLE IF NOT EXISTS processing_log (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      application_id TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT,
      error_message TEXT,
      duration_ms INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_processing_log_document ON processing_log(document_id);
    CREATE INDEX IF NOT EXISTS idx_processing_log_application ON processing_log(application_id);
  `);

  // Sequences table (for generating unique reference numbers)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sequences (
      name TEXT PRIMARY KEY,
      current_value INTEGER NOT NULL DEFAULT 0
    );
  `);

  console.log('Database initialized successfully');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
