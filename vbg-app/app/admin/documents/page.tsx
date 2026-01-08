'use client'

import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
// import DragDropUpload from '../../components/AdminDragDrop';
import { 
  ArrowLeft, 
  FileText, 
  Search, 
  Filter,
  Download,
  Trash2,
  Eye,
  Plus,
  Folder,
  Users,
  Calendar,
  File,
  FileImage,
  FileSpreadsheet,
  Upload,
  Edit
} from 'lucide-react';

interface Document {
  id: string;
  description: string; // This is where the document name is stored
  original_name: string; // Original filename
  document_type: string;
  size: number;
  uploaded_by: string;
  uploaded_at: string;
  job_site_id?: string;
  job_site_name?: string;
  user_id: number;
  user_name: string;
  company_name?: string;
  file_path: string;
  filename: string;
  mime_type: string;
}

interface JobSite {
  id: string;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  company_name?: string;
}

function AdminDocumentsContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobSiteIdFromUrl = searchParams.get('jobSiteId');
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterJobSite, setFilterJobSite] = useState('all');
  const [selectedJobSite, setSelectedJobSite] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('other');
  const [documentName, setDocumentName] = useState<string>('');
  const [expirationDate, setExpirationDate] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editDocumentName, setEditDocumentName] = useState('');
  const [editDocumentType, setEditDocumentType] = useState('');
  const [editJobSite, setEditJobSite] = useState('');
  const [editUser, setEditUser] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if user is admin
  const isAdmin = user?.isAdmin || (user as any)?.is_admin;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (!loading && !isAdmin) {
      router.push('/dashboard');
      return;
    }

    if (user && isAdmin) {
      fetchDocuments();
      fetchJobSites();
      fetchUsers();
    }
  }, [user, loading, router, isAdmin]);

  // Set job site filter when URL parameter is present
  useEffect(() => {
    if (jobSiteIdFromUrl) {
      setFilterJobSite(jobSiteIdFromUrl);
    }
  }, [jobSiteIdFromUrl]);

  const fetchDocuments = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/documents`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchJobSites = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/job-sites`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobSites(data);
      }
    } catch (error) {
      console.error('Error fetching job sites:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/users`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    // Validation
    if (!documentName.trim()) {
      alert('Please enter a document name');
      return;
    }

    if (selectedFiles.length === 0) {
      alert('Please select at least one file to upload');
      return;
    }

    if (documentType === 'insurance' && !expirationDate) {
      alert('Expiration date is required for insurance documents');
      return;
    }

    setUploading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', documentName);
        formData.append('type', documentType);
        if (selectedJobSite) {
          formData.append('job_site_id', selectedJobSite);
        }
        if (selectedUser) {
          formData.append('assigned_user_id', selectedUser);
        }
        if (expirationDate) {
          formData.append('expires_at', expirationDate);
        }

        const response = await fetch(`${API_URL}/api/admin/documents/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      // Success message
      alert(`Successfully uploaded ${selectedFiles.length} document(s)!`);
      
      // Refresh documents list
      await fetchDocuments();
      
      // Reset form and close modal
      setShowUploadModal(false);
      setSelectedJobSite('');
      setSelectedUser('');
      setDocumentType('other');
      setDocumentName('');
      setExpirationDate('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/documents/${doc.id}/download`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = doc.description || doc.original_name;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleView = async (doc: Document) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/documents/${doc.id}/download`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Open in new tab for viewing
        window.open(url, '_blank');
        
        // Clean up the URL after a short delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      }
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc);
    setEditDocumentName(doc.description || doc.original_name || '');
    setEditDocumentType(doc.document_type || 'other');
    setEditJobSite(doc.job_site_id || '');
    setEditUser(doc.user_id?.toString() || '');
    setShowEditModal(true);
  };

  const handleUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocument) return;

    setIsUpdating(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/documents/${editingDocument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          description: editDocumentName,
          document_type: editDocumentType,
          job_site_id: editJobSite || null,
          user_id: editUser || null
        })
      });

      if (response.ok) {
        // Refresh documents list
        fetchDocuments();
        setShowEditModal(false);
        setEditingDocument(null);
        alert('Document updated successfully!');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to update document'}`);
      }
    } catch (error) {
      console.error('Error updating document:', error);
      alert('An error occurred while updating the document');
    } finally {
      setIsUpdating(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-cyan-500" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-5 w-5 text-purple-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (doc.user_name && doc.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (doc.job_site_name && doc.job_site_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || doc.document_type === filterCategory;
    const matchesJobSite = filterJobSite === 'all' || doc.job_site_id === filterJobSite;
    return matchesSearch && matchesCategory && matchesJobSite;
  });

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-cyan-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link 
                href={jobSiteIdFromUrl ? `/admin/job-sites/${jobSiteIdFromUrl}` : '/admin/job-sites'} 
                className="mr-4 p-2 rounded-full hover:bg-white/20 transition-colors text-white"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center">
                <FileText className="h-8 w-8 mr-3 text-white" />
                <div>
                  <h1 className="text-2xl font-bold tracking-wide text-white mb-2">Document Management</h1>
                  <p className="text-cyan-100 text-sm font-normal tracking-wide">
                    {jobSiteIdFromUrl ? 
                      `Documents for ${jobSites.find(js => js.id === jobSiteIdFromUrl)?.name || 'Selected Job Site'}` : 
                      'Upload and manage documents'
                    }
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-white text-cyan-600 px-6 py-2 rounded-lg font-medium hover:bg-cyan-50 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Documents
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Categories</option>
                  <option value="contract">Contracts</option>
                  <option value="invoice">Invoices</option>
                  <option value="receipt">Receipts</option>
                  <option value="permit">Permits</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <select
                  value={filterJobSite}
                  onChange={(e) => setFilterJobSite(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Job Sites</option>
                  {jobSites.map(jobSite => (
                    <option key={jobSite.id} value={jobSite.id}>{jobSite.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700">
              Documents ({filteredDocuments.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getFileIcon(doc.original_name || 'unknown')}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-700">{doc.description || doc.original_name || 'Unnamed Document'}</div>
                          <div className="text-sm text-gray-500">{doc.document_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {doc.company_name || 'No Company'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {doc.job_site_name || 'General'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {doc.user_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'Unknown Date'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(doc.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(doc)}
                          className="text-green-600 hover:text-green-900"
                          title="View Document"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(doc)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Document"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="text-cyan-600 hover:text-cyan-900"
                          title="Download Document"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-700">Upload Documents</h3>
              <button
onClick={() => {
                  setShowUploadModal(false);
                  setSelectedJobSite('');
                  setSelectedUser('');
                  setDocumentType('other');
                  setDocumentName('');
                  setExpirationDate('');
                  setSelectedFiles([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6 mb-6">
              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="contract">Contract</option>
                  <option value="invoice">Invoice</option>
                  <option value="receipt">Receipt</option>
                  <option value="insurance">Insurance Form</option>
                  <option value="w9">W9 Form</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Document Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Name *
                </label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter document name"
                  required
                />
              </div>

              {/* User Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to User (Optional)
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select User (defaults to admin)</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id.toString()}>
                      {user.company_name || user.name} {user.company_name ? `(${user.name})` : `(${user.email})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Site */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Site (Optional)
                </label>
                <select
                  value={selectedJobSite}
                  onChange={(e) => setSelectedJobSite(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">General Documents</option>
                  {jobSites.map(jobSite => (
                    <option key={jobSite.id} value={jobSite.id}>{jobSite.name}</option>
                  ))}
                </select>
              </div>

              {/* Expiration Date for Insurance/W9 */}
              {(documentType === 'insurance' || documentType === 'w9') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date {documentType === 'insurance' ? '(Required for Insurance)' : '(Optional)'}
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required={documentType === 'insurance'}
                  />
                  {documentType === 'insurance' && (
                    <p className="text-xs text-gray-500 mt-1">Insurance forms require an expiration date</p>
                  )}
                </div>
              )}
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  handleFileSelect(files);
                }}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer inline-flex flex-col items-center ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
<h3 className="text-lg font-medium text-gray-700 mb-2">
                  {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Upload Documents'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedFiles.length > 0 ? selectedFiles.map(f => f.name).join(', ') : 'Click to select files'}
                </p>
                <div className="text-xs text-gray-500">
                  <p>Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG, GIF</p>
                  <p>Maximum file size: 50MB</p>
                  <p>Maximum files: 20</p>
                </div>
              </label>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedJobSite('');
                  setSelectedUser('');
                  setDocumentType('other');
                  setDocumentName('');
                  setExpirationDate('');
                  setSelectedFiles([]);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                disabled={uploading}
              >
                Close
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0 || !documentName.trim()}
                className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditModal && editingDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-700">Edit Document</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDocument(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateDocument} className="space-y-4">
              {/* Document Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Name *
                </label>
                <input
                  type="text"
                  value={editDocumentName}
                  onChange={(e) => setEditDocumentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter document name"
                  required
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={editDocumentType}
                  onChange={(e) => setEditDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="contract">Contract</option>
                  <option value="invoice">Invoice</option>
                  <option value="receipt">Receipt</option>
                  <option value="insurance">Insurance Form</option>
                  <option value="w9">W9 Form</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Assign to User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to User
                </label>
                <select
                  value={editUser}
                  onChange={(e) => setEditUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select User</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id.toString()}>
                      {u.company_name || u.name} {u.company_name ? `(${u.name})` : `(${u.email})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Site */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Site
                </label>
                <select
                  value={editJobSite}
                  onChange={(e) => setEditJobSite(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">General Documents</option>
                  {jobSites.map(js => (
                    <option key={js.id} value={js.id}>{js.name}</option>
                  ))}
                </select>
              </div>

              {/* Original File Info */}
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Original File:</strong> {editingDocument.original_name}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDocument(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editDocumentName.trim()}
                  className="px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDocuments() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AdminDocumentsContent />
    </Suspense>
  );
}
