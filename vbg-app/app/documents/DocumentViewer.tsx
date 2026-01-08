'use client';

import { X, Download, FileText } from 'lucide-react';
import { Document } from './types';

interface DocumentViewerProps {
  document: Document | null;
  onClose: () => void;
  isOpen?: boolean;
}

const DocumentViewer = ({ document, onClose, isOpen = true }: DocumentViewerProps) => {
  if (!document || !isOpen) return null;

  // Use the document_url directly since it's now a complete URL
  const safeDocumentUrl = document.document_url || '';
  const fileName = document.name || 'document';
  
  // Debug logging
  console.log('DocumentViewer Debug:', {
    document_url: document.document_url,
    safeDocumentUrl,
    fileName,
    document
  });
  const fileExtension = (fileName.split('.').pop() || '').toLowerCase();
  const isPdf = fileExtension === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
  
  // Add proper type for the image error handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/file-placeholder.svg';
  };
  
  const formatFileSize = (bytes: number = 0): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const renderContent = () => {
    if (!safeDocumentUrl) {
      return (
        <div className="mt-4 p-8 bg-gray-50 rounded-lg text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No document available</p>
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="w-full h-[70vh]">
          <iframe
            src={safeDocumentUrl}
            className="w-full h-full border rounded bg-white"
            title={fileName}
            aria-label={`PDF Viewer: ${fileName}`}
          />
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="relative w-full h-[70vh] flex items-center justify-center">
          <img
            src={safeDocumentUrl}
            alt={fileName}
            className="w-full h-full object-contain"
            onError={handleImageError}
          />
        </div>
      );
    }

    return (
      <div className="mt-4 p-8 bg-gray-50 rounded-lg text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Preview not available</p>
        <p className="text-xs text-gray-400 mt-1">Download the file to view it</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity" 
          onClick={onClose}
          role="button"
          aria-label="Close document viewer"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
        >
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              onClick={onClose}
              aria-label="Close document viewer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {document.name || 'Document'}
              </h3>
              {renderContent()}
              
              <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                <span>Type: {fileExtension.toUpperCase()}</span>
                {document.size && (
                  <span>Size: {formatFileSize(document.size)}</span>
                )}
                {safeDocumentUrl && (
                  <a
                    href={safeDocumentUrl}
                    download={fileName}
                    className="inline-flex items-center text-cyan-600 hover:text-cyan-800"
                    aria-label={`Download ${fileName}`}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
