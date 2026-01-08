'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Clock
} from 'lucide-react';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://31.97.144.132:4000';

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
      className: 'text-yellow-600',
      isExpired: false,
      expiresSoon: true
    };
  } else if (daysDiff <= 30) {
    return { 
      status: 'expiring', 
      label: `Expires in ${daysDiff} days`,
      color: 'blue',
      className: 'text-blue-600',
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
      return <FileImage className="h-5 w-5 text-blue-500" />;
    } else if (fileExtension === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (['xls', 'xlsx', 'csv'].includes(fileExtension || '')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 ${
      isHighlighted ? 'ring-2 ring-orange-500 bg-orange-50 shadow-lg' : ''
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
              className="p-2 text-gray-500 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
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
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
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

export default function DocumentPage() {
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
          document_url: `/api/documents/${result.document.id}/serve?user_id=${user.id}`,
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
                      className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
                    className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
                    className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient background matching dashboard */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Documents</h1>
              <p className="text-orange-100 mt-2">
                Manage your uploaded documents with expiration monitoring
              </p>
            </div>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-lg flex items-center space-x-2 transition-all font-medium"
            >
              <Upload className="h-5 w-5" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value as DocumentType | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
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
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
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
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
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
      </div>
    </div>
  );
}
