import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const uploadDocument = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { description, documentType = 'other', expiresAt } = req.body;

  const { data, error } = await supabase
    .from('documents')
    .insert([{
      user_id: req.user.id,
      filename: req.file.filename,
      original_name: req.file.originalname,
      description,
      document_type: documentType,
      expires_at: expiresAt || null,
      size: req.file.size,
      mime_type: req.file.mimetype,
      status: 'pending'
    }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to save document metadata' });
  }

  res.status(201).json({
    message: 'Document uploaded successfully',
    document: data
  });
};

export const getDocuments = async (req, res) => {
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', req.user.id)
    .order('uploaded_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }

  res.json({ documents });
};

export const getDocument = async (req, res) => {
  const { id } = req.params;

  const { data: document, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error || !document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  res.json({ document });
};

export const downloadDocument = async (req, res) => {
  const { id } = req.params;

  const { data: document, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (error || !document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const filePath = path.join(uploadsDir, document.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on server' });
  }

  res.download(filePath, document.original_name);
};

export const deleteDocument = async (req, res) => {
  const { id } = req.params;

  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (fetchError || !document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const filePath = path.join(uploadsDir, document.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return res.status(500).json({ error: 'Failed to delete document' });
  }

  res.json({ message: 'Document deleted successfully' });
};

export const getExpiringDocuments = async (req, res) => {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', req.user.id)
    .not('expires_at', 'is', null)
    .lte('expires_at', thirtyDaysFromNow.toISOString())
    .gte('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch expiring documents' });
  }

  res.json({ documents });
};
