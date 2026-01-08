import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken, asyncHandler } from '../middleware/auth.js';
import * as documentController from '../controllers/documentController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

router.post('/upload-document', authenticateToken, upload.single('file'), asyncHandler(documentController.uploadDocument));
router.get('/documents', authenticateToken, asyncHandler(documentController.getDocuments));
router.get('/documents/expiring', authenticateToken, asyncHandler(documentController.getExpiringDocuments));
router.get('/documents/:id', authenticateToken, asyncHandler(documentController.getDocument));
router.get('/documents/:id/download', authenticateToken, asyncHandler(documentController.downloadDocument));
router.delete('/documents/:id', authenticateToken, asyncHandler(documentController.deleteDocument));

export default router;
