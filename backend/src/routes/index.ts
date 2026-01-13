import { Router } from 'express';
import multer from 'multer';
import { applicationController } from '../controllers/application.controller.js';
import { documentController } from '../controllers/document.controller.js';
import { schemaVersioningService } from '../services/schema-versioning.service.js';
import { config } from '../config/index.js';
import type { DocumentCategory } from '../types/index.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.documents.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (config.documents.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Application routes
router.post('/applications', applicationController.create.bind(applicationController));
router.get('/applications/:id', applicationController.getById.bind(applicationController));
router.get('/applications/cluid/:cluid', applicationController.getByCluid.bind(applicationController));
router.get('/applications/:id/summary', applicationController.getDocumentSummary.bind(applicationController));
router.patch('/applications/:id/status', applicationController.updateStatus.bind(applicationController));
router.post('/applications/:id/refresh-checklist', applicationController.refreshChecklist.bind(applicationController));

// Document routes
router.post(
  '/applications/:applicationId/documents',
  upload.single('file'),
  documentController.upload.bind(documentController)
);
router.get(
  '/applications/:applicationId/documents',
  documentController.getByApplication.bind(documentController)
);

router.get('/documents/:id', documentController.getById.bind(documentController));
router.get('/documents/:id/versions', documentController.getWithVersions.bind(documentController));
router.get('/documents/:id/download', documentController.download.bind(documentController));
router.get('/documents/:id/extraction', documentController.getExtraction.bind(documentController));
router.get('/documents/:id/extraction/history', documentController.getExtractionHistory.bind(documentController));

router.post('/documents/:id/process', documentController.process.bind(documentController));
router.post('/documents/:id/reprocess', documentController.reprocess.bind(documentController));
router.post(
  '/documents/:id/versions',
  upload.single('file'),
  documentController.uploadVersion.bind(documentController)
);
router.patch('/documents/:id/classification', documentController.overrideClassification.bind(documentController));
router.delete('/documents/:id', documentController.delete.bind(documentController));

// Schema versioning routes
router.get('/schemas', (req, res) => {
  const metadata = schemaVersioningService.exportSchemaMetadata();
  res.json({
    success: true,
    data: metadata,
  });
});

router.get('/schemas/:category', (req, res) => {
  const category = req.params.category as DocumentCategory;
  const registry = schemaVersioningService.getRegistry(category);

  if (!registry) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Schema registry not found for category: ${category}` },
    });
  }

  res.json({
    success: true,
    data: {
      category,
      currentVersion: registry.currentVersion,
      versions: registry.versions.map((v) => ({
        version: v.version,
        createdAt: v.createdAt,
        description: v.description,
        changelog: v.changelog,
        requiredFields: v.requiredFields,
      })),
    },
  });
});

router.get('/schemas/:category/current', (req, res) => {
  const category = req.params.category as DocumentCategory;
  const schema = schemaVersioningService.getCurrentSchema(category);

  if (!schema) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Current schema not found for category: ${category}` },
    });
  }

  res.json({
    success: true,
    data: schema,
  });
});

router.get('/schemas/:category/versions/:version', (req, res) => {
  const category = req.params.category as DocumentCategory;
  const version = req.params.version as string;
  const schema = schemaVersioningService.getSchemaVersion(category, version);

  if (!schema) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Schema version ${version} not found for category: ${category}` },
    });
  }

  res.json({
    success: true,
    data: schema,
  });
});

router.get('/schemas/:category/changelog', (req, res) => {
  const category = req.params.category as DocumentCategory;
  const fromVersion = req.query.from as string || '1.0.0';
  const toVersion = req.query.to as string || schemaVersioningService.getCurrentVersion(category);

  const changelog = schemaVersioningService.getChangelog(category, fromVersion, toVersion);

  res.json({
    success: true,
    data: {
      category,
      fromVersion,
      toVersion,
      changelog,
    },
  });
});

export default router;
