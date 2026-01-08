/**
 * Core type definitions for the contract system
 */

export type ContractStatus = 'pending' | 'signed' | 'approved' | 'rejected' | 'cancelled';

export type SignerType = 'client' | 'contractor' | 'admin';

export interface Contract {
  id: string;
  userId: string;
  adminId?: string;
  templateId?: string;
  
  // Project details
  projectName: string;
  projectDescription?: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  paymentTerms?: string;
  scope?: string;
  
  // Contract content
  contractContent: string;
  
  // Status
  status: ContractStatus;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Client signature
  clientSignature?: string;
  clientSignatureStatus?: 'not_requested' | 'requested' | 'signed';
  clientSignedAt?: Date;
  
  // Contractor/Admin signature
  contractorSignature?: string;
  contractorSignatureStatus?: 'not_requested' | 'requested' | 'signed';
  contractorSignedAt?: Date;
  
  // User information
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  contractorName?: string;
  contractorEmail?: string;
  
  // Additional fields
  userComments?: string;
  adminNotes?: string;
  attachedDocuments?: string;
  viewed?: boolean;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  content: string;
  sections?: string[];
  isDefault?: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContractOptions {
  templateId: string;
  userId: string;
  adminId?: string;
  data: {
    clientName: string;
    clientEmail: string;
    clientAddress?: string;
    projectName: string;
    projectDescription?: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    paymentTerms?: string;
    scope?: string;
    contractorName?: string;
    contractorEmail?: string;
  };
  adminSignature?: string;
}

export interface SignContractOptions {
  contractId: string;
  signatureData: string;
  signerType: SignerType;
  comments?: string;
}

export interface ContractFilters {
  userId?: string;
  status?: ContractStatus;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailServiceConfig {
  apiKey?: string; // Resend API key (can also use RESEND_API_KEY env var)
  from?: string; // Default from email address
  debug?: boolean;
  // Legacy SMTP fields (deprecated, kept for backwards compatibility)
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

export interface StorageAdapter {
  createContract(contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contract>;
  getContract(id: string): Promise<Contract | null>;
  updateContract(id: string, updates: Partial<Contract>): Promise<Contract>;
  deleteContract(id: string): Promise<void>;
  listContracts(filters?: ContractFilters): Promise<Contract[]>;
}

export interface PDFGeneratorConfig {
  format?: 'letter' | 'a4';
  margin?: number;
  embedSignatures?: boolean;
  watermark?: string;
  logoUrl?: string;
}

export interface SignaturePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ContractServiceConfig {
  emailService: any; // Will be typed properly in implementation
  storageAdapter: StorageAdapter;
  pdfGenerator?: any;
  templateEngine?: any;
}

export interface ContractEvent {
  type: 'created' | 'signed' | 'approved' | 'rejected' | 'cancelled' | 'updated';
  contract: Contract;
  timestamp: Date;
  metadata?: Record<string, any>;
}
