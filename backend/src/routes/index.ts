import { Router } from 'express';
import multer from 'multer';
import { applicationController } from '../controllers/application.controller.js';
import { documentController } from '../controllers/document.controller.js';
import { config } from '../config/index.js';

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

export default router;
