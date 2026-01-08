'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import type { Document, DocumentType } from './types';
import { 
  FileText, 
  Upload, 
  Search, 
  X, 
  Download, 
  Trash2, 
  File, 
  FileImage, 
  FileSpreadsheet, 
  Loader2, 
  Eye, 
  Clock,
  ArrowLeft,
  Send,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.veribuilds.com';

// Helper function to get expiration status
const getExpirationStatus = (expiresAt?: string) => {
  if (!expiresAt) return { status: 'no-expiry', label: 'No expiry', color: 'gray', className: 'text-gray-500' };
  
  const expirationDate = new Date(expiresAt);
  const today = new Date();
  const timeDiff = expirationDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  if (timeDiff < 0) {
    return { 
      status: 'expired', 
      label: 'Expired', 
      color: 'red',
      className: 'text-red-600',
      isExpired: true,
      expiresSoon: false
    };
  } else if (daysDiff <= 7) {
    return { 
      status: 'expiring-soon', 
      label: `Expires in ${daysDiff} day${daysDiff === 1 ? '' : 's'}`, 
      color: 'yellow',
      className: 'text-primary-600',
      isExpired: false,
      expiresSoon: true
    };
  } else if (daysDiff <= 30) {
    return { 
      status: 'expiring', 
      label: `Expires in ${daysDiff} days`,
      color: 'blue',
      className: 'text-cyan-600',
      isExpired: false,
      expiresSoon: true
    };
  }
  
  return { 
    status: 'valid', 
    label: `Expires ${expirationDate.toLocaleDateString()}`,
    color: 'green',
    className: 'text-green-600',
    isExpired: false,
    expiresSoon: false
  };
};

const formatFileSize = (bytes: number = 0): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Document Item Component Props
interface DocumentItemProps {
  document: Document;
  onView: (doc: Document) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  isHighlighted?: boolean;
}

// Document Item Component
const DocumentItem: React.FC<DocumentItemProps> = ({ document: doc, onView, onDelete, deletingId, isHighlighted = false }) => {
  const expirationStatus = getExpirationStatus(doc.expires_at);
  const fileExtension = doc.name?.split('.').pop()?.toLowerCase();
  
  // Get the appropriate icon based on file type
  const renderFileIcon = () => {
    if (fileExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      return <FileImage className="h-5 w-5 text-cyan-500" />;
    } else if (fileExtension === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (['xls', 'xlsx', 'csv'].includes(fileExtension || '')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 ${
      isHighlighted ? 'ring-2 ring-cyan-500 bg-orange-50 shadow-lg' : ''
    }`}>
      <div className="p-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 flex-shrink-0">
              {renderFileIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{doc.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{formatFileSize(doc.size)}</p>
            </div>
          </div>
          <div className="flex space-x-1 flex-shrink-0">
            <button
              onClick={() => onView(doc)}
              className="p-2 text-gray-500 hover:text-cyan-600 rounded-lg hover:bg-orange-50 transition-colors"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => window.open(doc.document_url, '_blank')}
              className="p-2 text-gray-500 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(doc.id)}
              disabled={deletingId === doc.id}
              className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              title="Delete"
            >
              {deletingId === doc.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        
        <div className="mt-3 flex items-center text-sm">
          {expirationStatus ? (
            <>
              <Clock className={`h-4 w-4 mr-1 ${expirationStatus.className}`} />
              <span className={expirationStatus.className}>
                {expirationStatus.label}
              </span>
              {expirationStatus.status === 'expired' && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                  Expired
                </span>
              )}
              {expirationStatus.status === 'expiring-soon' && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary-100 text-primary-800">
                  Expiring Soon
                </span>
              )}
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 mr-1 text-gray-400" />
              <span className="text-gray-500">No expiry</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Document categories for filtering
const documentCategories = [
  { id: 'all', name: 'All Documents', icon: File },
  { id: 'invoice', name: 'Invoices', icon: FileText },
  { id: 'receipt', name: 'Receipts', icon: FileText },
  { id: 'insurance', name: 'Insurance Forms', icon: FileText },
  { id: 'w9', name: 'W9 Forms', icon: FileText },
  { id: 'license', name: 'Licenses', icon: FileText },
  { id: 'certificate', name: 'Certificates', icon: FileText },
  { id: 'other', name: 'Other', icon: File }
];

function DocumentPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightDocId = searchParams.get('highlight');
  
  // State variables
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<DocumentType | 'all'>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('other');
  const [expirationDate, setExpirationDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Send to Admin state
  const [isSendToAdminOpen, setIsSendToAdminOpen] = useState(false);
  const [sendToAdminFile, setSendToAdminFile] = useState<File | null>(null);
  const [sendToAdminMessage, setSendToAdminMessage] = useState('');
  const [sendToAdminDocType, setSendToAdminDocType] = useState('w9');
  const [sendingToAdmin, setSendingToAdmin] = useState(false);
  const [sendToAdminSuccess, setSendToAdminSuccess] = useState(false);
  
  // Request Document state  
  const [isRequestDocOpen, setIsRequestDocOpen] = useState(false);
  const [requestDocType, setRequestDocType] = useState('');
  const [requestDocMessage, setRequestDocMessage] = useState('');
  const [requestingDoc, setRequestingDoc] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load documents and contracts when user is available
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchDocuments = async () => {
      try {
        setError(null);
        setLoading(true);
        
        console.log('Fetching documents for user ID:', user.id);
        const response = await fetch(`${API_URL}/api/documents?user_id=${user.id}`, {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load documents');
        }
        
        const data = await response.json();
        console.log('Raw API response:', data);
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received');
        }
        
        // Process documents to ensure they have all required fields
        const processedDocs = data.map(doc => {
          // Smart document type detection
          const validTypes = ['contract', 'invoice', 'receipt', 'insurance', 'w9', 'license', 'certificate', 'other'];
          
          // First try the document_type column, then type column
          let docType = doc.document_type || doc.type || 'other';
          
          // If it's 'other' or 'general', try to detect from description
          if (docType === 'other' || docType === 'general') {
            const description = (doc.description || '').toLowerCase();
            console.log('Detecting type for:', doc.description, 'normalized:', description);
            
            // Pattern matching for better type detection - check contract first since it's more specific
            if (description.includes('contract')) {
              docType = 'contract';
              console.log('Detected as contract');
            } else if (description.includes('invoice')) {
              docType = 'invoice';
            } else if (description.includes('receipt')) {
              docType = 'receipt';
            } else if (description.includes('insurance')) {
              docType = 'insurance';
            } else if (description.includes('w9') || description.includes('w-9')) {
              docType = 'w9';
            } else if (description.includes('license')) {
              docType = 'license';
            } else if (description.includes('certificate')) {
              docType = 'certificate';
            }
          }
          
          // Map 'general' to 'other' for backward compatibility
          const normalizedType = docType === 'general' ? 'other' : docType;
          const mappedType = validTypes.includes(normalizedType) ? normalizedType : 'other';
          
          
          return {
            ...doc,
            name: doc.description || doc.original_name || 'Unnamed Document',
            type: mappedType,
            document_type: mappedType,
            size: doc.size || 0,
            uploaded_at: doc.uploaded_at || new Date().toISOString(),
            expires_at: doc.expires_at,
            user_id: doc.user_id || user.id,
            document_url: `/api/documents/${doc.id}/serve?user_id=${user.id}`
          };
        });
        
        console.log('Processed documents:', processedDocs);
        console.log('Sample document URL:', processedDocs[0]?.document_url);
        setDocuments(processedDocs);
      } catch (err) {
        console.error('Error loading documents:', err);
        setError('Failed to load documents. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  // Filter and sort documents based on search query and category
  const filteredDocuments = useMemo(() => {
    console.log('Filtering documents:', { 
      totalDocuments: documents.length, 
      activeCategory, 
      searchQuery,
      documents: documents.map(d => ({ id: d.id, name: d.name, type: d.type }))
    });
    
    const filtered = documents
      .filter(doc => 
        (activeCategory === 'all' || doc.type === activeCategory) &&
        ((doc.name && doc.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
         (doc.type && doc.type.toLowerCase().includes(searchQuery.toLowerCase())))
      )
      .sort((a, b) => {
        // Sort by upload date (newest first)
        const dateA = new Date(a.uploaded_at || 0);
        const dateB = new Date(b.uploaded_at || 0);
        return dateB.getTime() - dateA.getTime();
      });
    
    console.log('Filtered documents:', filtered.map(d => ({ id: d.id, name: d.name, type: d.type })));
    return filtered;
  }, [documents, activeCategory, searchQuery]);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!documentName) {
        setDocumentName(selectedFile.name.split('.')[0]);
      }
    }
  };

  // Handle document upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!user) {
      setError('You must be logged in to upload files');
      return;
    }

    if (!documentName.trim()) {
      setError('Please enter a document name');
      return;
    }

    // Validate expiration date for insurance documents
    if (String(documentType) === 'insurance' && !expirationDate) {
      setError('Expiration date is required for insurance forms');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', documentName.trim());
      formData.append('description', documentName.trim());
      formData.append('user_id', user.id.toString());
      formData.append('document_type', documentType);
      if (expirationDate) {
        formData.append('expires_at', expirationDate);
      }

      const response = await fetch(`${API_URL}/api/upload-document`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success && result.document) {
        // Transform the document to match frontend expectations
        const newDoc = {
          ...result.document,
          name: result.document.description || result.document.name || result.document.original_name,
          document_url: `${API_URL}/api/documents/${result.document.id}/serve?user_id=${user.id}`,
          type: result.document.document_type || documentType,
          expires_at: result.document.expires_at,
          size: result.document.size,
          mime_type: result.document.mime_type,
          uploaded_at: result.document.uploaded_at || new Date().toISOString()
        };
        
        setDocuments(prev => [...prev, newDoc]);
        
        // Show success message
        setError(null);
        setUploadSuccess(true);
        
        // Reset form
        setFile(null);
        setDocumentName('');
        setDocumentType('other');
        setExpirationDate('');
        setIsUploadModalOpen(false);
        
        // Hide success message after 3 seconds
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle document deletion
  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    if (!user) return;
    
    try {
      setDeletingId(docId);
      const response = await fetch(`${API_URL}/api/documents/${docId}?user_id=${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      setDocuments(docs => docs.filter(doc => doc.id !== docId));
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle view document
  const handleViewDocument = useCallback((doc: Document) => {
    console.log('Opening document URL:', doc.document_url);
    window.open(doc.document_url, '_blank');
  }, []);

  // Handle Send Document to Admin
  const handleSendToAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendToAdminFile || !user) return;
    
    try {
      setSendingToAdmin(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', sendToAdminFile);
      formData.append('documentType', sendToAdminDocType);
      formData.append('message', sendToAdminMessage);
      
      const response = await fetch(`${API_URL}/api/user/send-document-to-admin`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to send document');
      }
      
      setSendToAdminSuccess(true);
      setIsSendToAdminOpen(false);
      setSendToAdminFile(null);
      setSendToAdminMessage('');
      setSendToAdminDocType('w9');
      
      setTimeout(() => setSendToAdminSuccess(false), 3000);
    } catch (err) {
      console.error('Error sending document to admin:', err);
      setError('Failed to send document. Please try again.');
    } finally {
      setSendingToAdmin(false);
    }
  };

  // Handle Request Document from Admin
  const handleRequestDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDocType || !user) return;
    
    try {
      setRequestingDoc(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/user/request-document-from-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          documentType: requestDocType,
          message: requestDocMessage
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send request');
      }
      
      alert('Document request sent to admin successfully!');
      setIsRequestDocOpen(false);
      setRequestDocType('');
      setRequestDocMessage('');
    } catch (err) {
      console.error('Error requesting document:', err);
      setError('Failed to send request. Please try again.');
    } finally {
      setRequestingDoc(false);
    }
  };

  // Close document viewer
  const handleCloseViewer = useCallback(() => {
    setIsViewerOpen(false);
    setCurrentDocument(null);
  }, []);

  // Document Viewer Modal
  const renderViewerModal = () => {
    if (!currentDocument?.document_url) {
      return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Document Viewer</h3>
              <button
                onClick={handleCloseViewer}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-4 p-8 bg-gray-50 rounded-lg text-center">
              <File className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Document not available</h3>
              <p className="mt-1 text-sm text-gray-500">This document cannot be displayed.</p>
            </div>
          </div>
        </div>
      );
    }

    // Get file extension from original filename or document name
    const originalName = (currentDocument as any).original_name || currentDocument.name || '';
    const fileExtension = originalName.split('.').pop()?.toLowerCase() || '';
    const isPdf = fileExtension === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileExtension);
    
    console.log('Document viewer debug:', {
      name: currentDocument.name,
      originalName: (currentDocument as any).original_name,
      fileExtension,
      isPdf,
      isImage,
      documentUrl: currentDocument.document_url
    });

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">{currentDocument.name}</h3>
            <button
              onClick={handleCloseViewer}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="w-full h-[70vh]">
            {isPdf ? (
              <object
                data={currentDocument.document_url}
                type="application/pdf"
                className="w-full h-full border rounded"
              >
                <div className="flex items-center justify-center h-full bg-gray-50 rounded">
                  <div className="text-center">
                    <File className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">PDF preview not available</p>
                    <button
                      onClick={() => window.open(currentDocument.document_url, '_blank')}
                      className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </object>
            ) : isImage ? (
              <div className="relative w-full h-full bg-gray-50 rounded flex items-center justify-center">
                <img
                  src={currentDocument.document_url}
                  alt={currentDocument.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <div className="text-center" style={{display: 'none'}}>
                  <File className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Image preview not available</p>
                  <button
                    onClick={() => window.open(currentDocument.document_url, '_blank')}
                    className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 rounded">
                <div className="text-center">
                  <File className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Preview not available for this file type</p>
                  <button
                    onClick={() => window.open(currentDocument.document_url, '_blank')}
                    className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Document
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <FileText className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by uploading your first document.
      </p>
      <div className="mt-6">
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
        >
          <Upload className="-ml-1 mr-2 h-4 w-4" />
          Upload Document
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Clean Header - VBG Style */}
      <div className="bg-cyan-600 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="flex items-center text-white hover:text-cyan-100 mb-4 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold tracking-wide text-white mb-2">Documents</h1>
              <p className="text-sm text-cyan-100 font-normal tracking-wide">
                Manage your uploaded documents
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <button
                onClick={() => setIsSendToAdminOpen(true)}
                className="px-3 md:px-5 py-2 md:py-2.5 rounded-lg bg-white/20 text-white hover:bg-white/30 font-medium transition-all duration-200 flex items-center gap-2 text-sm md:text-base"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send to Admin</span>
                <span className="sm:hidden">Send</span>
              </button>
              <button
                onClick={() => setIsRequestDocOpen(true)}
                className="px-3 md:px-5 py-2 md:py-2.5 rounded-lg bg-white/20 text-white hover:bg-white/30 font-medium transition-all duration-200 flex items-center gap-2 text-sm md:text-base"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Request Document</span>
                <span className="sm:hidden">Request</span>
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3 md:px-5 py-2 md:py-2.5 rounded-lg bg-white text-cyan-600 hover:bg-cyan-50 font-medium transition-all duration-200 text-sm md:text-base"
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Search and Filters - Clean Style */}
        <div className="bg-white rounded-lg border border-gray-100 mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-wide text-gray-900 mb-1">Your Documents</h2>
                <p className="text-sm text-gray-500">Uploaded files and certificates</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsSendToAdminOpen(true)}
                  className="px-3 py-2 rounded-lg border border-cyan-200 text-cyan-600 hover:bg-cyan-50 font-medium transition-all duration-200 flex items-center gap-2 text-sm"
                >
                  <Send className="h-4 w-4" />
                  Send to Admin
                </button>
                <button
                  onClick={() => setIsRequestDocOpen(true)}
                  className="px-3 py-2 rounded-lg border border-cyan-200 text-cyan-600 hover:bg-cyan-50 font-medium transition-all duration-200 flex items-center gap-2 text-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  Request Document
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value as DocumentType | 'all')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="invoice">Invoices</option>
                  <option value="receipt">Receipts</option>
                  <option value="insurance">Insurance Forms</option>
                  <option value="w9">W9 Forms</option>
                  <option value="license">Licenses</option>
                  <option value="certificate">Certificates</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {uploadSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800 font-medium">Document uploaded successfully!</p>
              </div>
            </div>
          </div>
        )}

        {sendToAdminSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800 font-medium">Document sent to admin successfully! They will be notified.</p>
              </div>
            </div>
          </div>
        )}

        {/* Documents Grid */}
        <div className="space-y-6">
          {filteredDocuments.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((doc) => (
                <DocumentItem
                  key={doc.id}
                  document={doc}
                  onView={handleViewDocument}
                  onDelete={handleDelete}
                  deletingId={deletingId}
                  isHighlighted={highlightDocId === doc.id}
                />
              ))}
            </div>
          ) : (
            renderEmptyState()
          )}
        </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upload Document</h3>
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <X className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-2">
                    <form onSubmit={handleUpload} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                        <select
                          value={documentType}
                          onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                          className="shadow-sm focus:ring-cyan-500 focus:border-cyan-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        >
                          <option value="invoice">Invoice</option>
                          <option value="receipt">Receipt</option>
                          <option value="insurance">Insurance Form</option>
                          <option value="w9">W9 Form</option>
                          <option value="license">License</option>
                          <option value="certificate">Certificate</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
                        <input
                          type="text"
                          value={documentName}
                          onChange={(e) => setDocumentName(e.target.value)}
                          className="shadow-sm focus:ring-cyan-500 focus:border-cyan-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Enter document name"
                          required
                        />
                      </div>
                      {(String(documentType) === 'insurance' || String(documentType) === 'w9') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expiration Date {String(documentType) === 'insurance' ? '(Required for Insurance)' : '(Optional)'}
                          </label>
                          <input
                            type="date"
                            value={expirationDate}
                            onChange={(e) => setExpirationDate(e.target.value)}
                            className="shadow-sm focus:ring-cyan-500 focus:border-cyan-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required={String(documentType) === 'insurance'}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            {String(documentType) === 'insurance' 
                              ? 'Insurance forms require an expiration date for monitoring'
                              : 'Optional: Set expiration date for tracking purposes'
                            }
                          </p>
                        </div>
                      )}
                      <div>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cyan-500"
                              >
                                <span>Upload a file</span>
                                <input 
                                  id="file-upload" 
                                  name="file-upload" 
                                  type="file" 
                                  className="sr-only"
                                  onChange={handleFileChange}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {file ? file.name : 'PDF, DOC, XLS, JPG, PNG up to 10MB'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                          type="submit"
                          disabled={!file || uploading || !documentName.trim()}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyan-600 text-base font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                        >
                          {uploading ? 'Uploading...' : 'Upload Document'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUploadModalOpen(false);
                            setError(null);
                            setFile(null);
                            setDocumentName('');
                            setDocumentType('other');
                            setExpirationDate('');
                          }}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Document Viewer */}
      {isViewerOpen && renderViewerModal()}

      {/* Send to Admin Modal */}
      {isSendToAdminOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsSendToAdminOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Send Document to Admin</h3>
                <button onClick={() => setIsSendToAdminOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSendToAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                  <select
                    value={sendToAdminDocType}
                    onChange={(e) => setSendToAdminDocType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="w9">W-9 Form</option>
                    <option value="insurance">Certificate of Insurance</option>
                    <option value="license">Business License</option>
                    <option value="id">Government ID</option>
                    <option value="contract">Signed Contract</option>
                    <option value="invoice">Invoice</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select File *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-cyan-500 transition-colors">
                    <input
                      type="file"
                      onChange={(e) => setSendToAdminFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="send-admin-file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <label htmlFor="send-admin-file" className="cursor-pointer">
                      {sendToAdminFile ? (
                        <div className="flex items-center justify-center gap-2 text-cyan-600">
                          <FileText className="h-5 w-5" />
                          <span>{sendToAdminFile.name}</span>
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <Upload className="h-8 w-8 mx-auto mb-2" />
                          <p>Click to upload a file</p>
                          <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                  <textarea
                    value={sendToAdminMessage}
                    onChange={(e) => setSendToAdminMessage(e.target.value)}
                    placeholder="Add a note about this document..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsSendToAdminOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!sendToAdminFile || sendingToAdmin}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {sendingToAdmin ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send to Admin
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Request Document Modal */}
      {isRequestDocOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsRequestDocOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Request Document from Admin</h3>
                <button onClick={() => setIsRequestDocOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleRequestDocument} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">What document do you need? *</label>
                  <select
                    value={requestDocType}
                    onChange={(e) => setRequestDocType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select document type...</option>
                    <option value="w9">W-9 Form (Company)</option>
                    <option value="insurance">Certificate of Insurance</option>
                    <option value="contract">Contract Copy</option>
                    <option value="estimate">Estimate/Quote</option>
                    <option value="invoice">Invoice Copy</option>
                    <option value="receipt">Receipt</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details (optional)</label>
                  <textarea
                    value={requestDocMessage}
                    onChange={(e) => setRequestDocMessage(e.target.value)}
                    placeholder="Describe what you need or any specific requirements..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsRequestDocOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!requestDocType || requestingDoc}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {requestingDoc ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function DocumentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <DocumentPageContent />
    </Suspense>
  );
}
