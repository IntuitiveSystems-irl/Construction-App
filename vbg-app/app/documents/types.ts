export type DocumentType = 'contract' | 'invoice' | 'receipt' | 'other';

export interface Document {
  id: string;
  document_url: string;
  type: DocumentType;
  name: string;
  uploaded_at: string;
  expires_at?: string;
  user_id: string;
  size?: number;
  description?: string;
  mime_type?: string;
}
