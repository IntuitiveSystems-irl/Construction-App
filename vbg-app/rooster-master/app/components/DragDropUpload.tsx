'use client'

import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  X, 
  File, 
  FileText, 
  FileImage, 
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

interface DragDropUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
  title?: string;
  description?: string;
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onUpload,
  maxFiles = 10,
  maxFileSize = 10,
  acceptedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif'],
  className = '',
  disabled = false,
  multiple = true,
  title = 'Upload Documents',
  description = 'Drag and drop files here, or click to select'
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-8 w-8 text-purple-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    // Check file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && !acceptedTypes.includes(extension)) {
      return `File type .${extension} is not supported`;
    }

    return null;
  }, [maxFileSize, acceptedTypes]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    if (disabled || isUploading) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate files
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    // Check max files limit
    if (uploadedFiles.length + validFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return;
    }

    if (errors.length > 0) {
      // Show errors (you might want to use a toast notification here)
      console.error('File validation errors:', errors);
      return;
    }

    if (validFiles.length === 0) return;

    // Add files to uploaded files list
    const newUploadedFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
    setIsUploading(true);

    try {
      // Call the upload handler
      await onUpload(validFiles);
      
      // Update status to success
      setUploadedFiles(prev => 
        prev.map(f => 
          newUploadedFiles.find(nf => nf.id === f.id) 
            ? { ...f, status: 'success' as const, progress: 100 }
            : f
        )
      );
    } catch (error) {
      // Update status to error
      setUploadedFiles(prev => 
        prev.map(f => 
          newUploadedFiles.find(nf => nf.id === f.id) 
            ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Upload failed' }
            : f
        )
      );
    } finally {
      setIsUploading(false);
    }
  }, [disabled, isUploading, maxFiles, uploadedFiles.length, onUpload, validateFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setUploadedFiles([]);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-orange-500 bg-orange-50'
            : disabled
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.map(type => `.${type}`).join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center">
          <Upload className={`h-12 w-12 mb-4 ${
            isDragOver ? 'text-orange-500' : disabled ? 'text-gray-300' : 'text-gray-400'
          }`} />
          
          <h3 className={`text-lg font-medium mb-2 ${
            disabled ? 'text-gray-400' : 'text-gray-900'
          }`}>
            {title}
          </h3>
          
          <p className={`text-sm mb-4 ${
            disabled ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {description}
          </p>

          <div className={`text-xs ${
            disabled ? 'text-gray-300' : 'text-gray-500'
          }`}>
            <p>Supported formats: {acceptedTypes.join(', ').toUpperCase()}</p>
            <p>Maximum file size: {maxFileSize}MB</p>
            <p>Maximum files: {maxFiles}</p>
          </div>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Uploading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">
              Files ({uploadedFiles.length})
            </h4>
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex-shrink-0 mr-3">
                  {getFileIcon(uploadedFile.file.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                  {uploadedFile.error && (
                    <p className="text-xs text-red-600 mt-1">
                      {uploadedFile.error}
                    </p>
                  )}
                </div>

                <div className="flex items-center ml-4">
                  {uploadedFile.status === 'pending' && (
                    <div className="h-4 w-4 rounded-full bg-gray-300"></div>
                  )}
                  {uploadedFile.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  )}
                  {uploadedFile.status === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {uploadedFile.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  
                  <button
                    onClick={() => removeFile(uploadedFile.id)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropUpload;
