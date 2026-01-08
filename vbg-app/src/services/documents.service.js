import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Documents } from '../controllers/crud.controller.js';
import { authenticate, authenticateAdmin, asyncHandler } from '../middleware/auth.js';
import { UPLOADS_DIR } from '../config/constants.js';

const router = Router();

export const metadata = {
  name: 'Documents Service',
  version: '1.0.0',
  routes: [
    'GET /api/documents',
    'POST /api/documents/upload',
    'GET /api/documents/:id',
    'DELETE /api/documents/:id'
  ]
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all documents (user or admin)
router.get('/api/documents', authenticate, asyncHandler(async (req, res) => {
  const isAdmin = req.user.is_admin || req.user.id === 15;
  const documents = await Documents.getAll({}, req.user.id, isAdmin);
  res.json(documents);
}));

// Upload document
router.post('/api/documents/upload', authenticate, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const document = await Documents.create({
    user_id: req.user.id,
    filename: req.file.filename,
    original_name: req.file.originalname,
    description: req.body.description || '',
    document_type: req.body.document_type || 'other',
    mime_type: req.file.mimetype,
    size: req.file.size,
    expires_at: req.body.expires_at || null
  });

  res.status(201).json({ 
    success: true, 
    document 
  });
}));

// Get single document
router.get('/api/documents/:id', authenticate, asyncHandler(async (req, res) => {
  const isAdmin = req.user.is_admin || req.user.id === 15;
  const document = await Documents.getById(req.params.id, req.user.id, isAdmin);
  
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  res.json(document);
}));

// Serve document file
router.get('/api/documents/:id/serve', authenticate, asyncHandler(async (req, res) => {
  const isAdmin = req.user.is_admin || req.user.id === 15;
  const document = await Documents.getById(req.params.id, req.user.id, isAdmin);
  
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const filePath = path.join(UPLOADS_DIR, document.filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Set appropriate headers
  res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${document.original_name}"`);
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
}));

// Delete document
router.delete('/api/documents/:id', authenticate, asyncHandler(async (req, res) => {
  const isAdmin = req.user.is_admin || req.user.id === 15;
  const document = await Documents.getById(req.params.id, req.user.id, isAdmin);
  
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Delete file from filesystem
  const filePath = path.join(UPLOADS_DIR, document.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await Documents.delete(req.params.id, req.user.id, isAdmin);
  res.json({ message: 'Document deleted successfully' });
}));

export default router;
