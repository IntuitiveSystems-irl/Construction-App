'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { generateContractPDF, Contract as PDFContract } from '../../../../utils/pdfGenerator.client';
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowLeft,
  Plus,
  X,
  Trash2,
  MapPin,
  Download
} from 'lucide-react';

interface UserDetails {
  id: number;
  name: string;
  email: string;
  company_name: string;
  contact_name: string;
  phone: string;
  is_verified: boolean;
  created_at: string;
}

interface Document {
  id: number;
  document_name: string;
  original_name?: string;
  document_type: string;
  document_url: string;
  uploaded_at: string;
  expires_at?: string;
  status: string;
  admin_notes?: string;
}

interface Contract {
  id: string;
  project_name: string;
  project_description: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  payment_terms: string;
  scope: string;
  scope_of_work: string;
  status: string;
  user_comments?: string;
  created_at: string;
  updated_at: string;
  contract_type?: string;
  signature_data?: string;
  signature_status?: string;
  signed_at?: string;
  contract_content?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteDocLoading, setDeleteDocLoading] = useState<string | null>(null);
  
  // Edit user states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    company_name: '',
    contact_name: '',
    phone: '',
    is_verified: false
  });
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Delete user states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);

  const userId = params.id as string;

  // Check if user is admin (same logic as dashboard)
  useEffect(() => {
    const isAdmin = user?.isAdmin || (user as any)?.is_admin || user?.id === 15;
    if (!user || !isAdmin) {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Fetch user details, documents, and contracts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        
        // Fetch user details
        const userResponse = await fetch(`${API_URL}/api/admin/users/${userId}`, {
          credentials: 'include',
        });
        
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user details');
        }
        
        const userData = await userResponse.json();
        setUserDetails(userData);
        
        // Process documents to ensure they have proper URLs
        const processedDocuments = (userData.documents || []).map((doc: any) => ({
          ...doc,
          document_url: `/api/documents/${doc.id}/serve?user_id=${userId}`
        }));
        console.log('DEBUG: Frontend received documents for user', userId, ':', processedDocuments.map((d: any) => ({
          id: d.id,
          document_name: d.document_name,
          original_name: d.original_name,
          document_type: d.document_type
        })));
        setDocuments(processedDocuments);
        
        // Fetch user contracts
        const contractsResponse = await fetch(`${API_URL}/api/admin/users/${userId}/contracts`, {
          credentials: 'include',
        });
        
        if (contractsResponse.ok) {
          const contractsData = await contractsResponse.json();
          setContracts(contractsData.contracts || []);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleDocumentAction = async (documentId: number, action: string, notes?: string) => {
    try {
      setActionLoading(`${documentId}-${action}`);
      
      const response = await fetch(`${API_URL}/api/admin/documents/${documentId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ admin_notes: notes || '' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} document`);
      }

      // Refresh documents
      const userResponse = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        credentials: 'include',
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setDocuments(userData.documents || []);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} document`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDocument = async (documentId: number, documentName: string) => {
    if (!confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleteDocLoading(documentId.toString());
      
      const response = await fetch(`${API_URL}/api/admin/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }
      
      // Remove document from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      console.log('Document deleted successfully');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setDeleteDocLoading(null);
    }
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowContractModal(true);
  };

  const closeContractModal = () => {
    setSelectedContract(null);
    setShowContractModal(false);
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm('Are you sure you want to delete this contract? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(contractId);
      
      const response = await fetch(`${API_URL}/api/admin/contracts/${contractId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete contract');
      }
      
      // Remove contract from local state
      setContracts(prev => prev.filter(contract => contract.id !== contractId));
      
      // Close modal if the deleted contract was being viewed
      if (selectedContract?.id === contractId) {
        closeContractModal();
      }
      
      // Show success message (you could add a toast notification here)
      console.log('Contract deleted successfully');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contract');
    } finally {
      setDeleteLoading(null);
    }
  };

  const downloadContract = (contract: Contract) => {
    try {
      // Generate PDF with signature data if available - using same method as user side
      const pdf = generateContractPDF({
        ...contract,
        user_name: userDetails?.name || 'Client',
        user_email: userDetails?.email || 'client@email.com'
      } as unknown as PDFContract);
      
      // Download the PDF
      pdf.save(`Rooster_Construction_Contract_${contract.id}.pdf`);
      
      console.log('Admin PDF download successful for contract:', contract.id, {
        signature_data: contract.signature_data ? 'Present' : 'Missing',
        signature_status: contract.signature_status,
        signed_at: contract.signed_at
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to server-side generation if client-side fails
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      window.open(`${API_URL}/api/contracts/${contract.id}/pdf`, '_blank');
    }
  };

  // Initialize edit form when user details are loaded
  useEffect(() => {
    if (userDetails && !isEditing) {
      setEditForm({
        name: userDetails.name || '',
        email: userDetails.email || '',
        company_name: userDetails.company_name || '',
        contact_name: userDetails.contact_name || '',
        phone: userDetails.phone || '',
        is_verified: userDetails.is_verified || false
      });
    }
  }, [userDetails, isEditing]);

  const handleEditUser = () => {
    setIsEditing(true);
    setEditForm({
      name: userDetails?.name || '',
      email: userDetails?.email || '',
      company_name: userDetails?.company_name || '',
      contact_name: userDetails?.contact_name || '',
      phone: userDetails?.phone || '',
      is_verified: userDetails?.is_verified || false
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError('');
  };

  const handleSaveUser = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setError('Name and email are required');
      return;
    }

    try {
      setSaveLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to update user';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('Update user error:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          userId,
          editForm
        });
        throw new Error(errorMessage);
      }
      
      // Update local state
      setUserDetails(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
      console.log('User updated successfully');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setDeleteUserLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      // Redirect to admin dashboard after successful deletion
      router.push('/dashboard?tab=admin');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      setShowDeleteModal(false);
    } finally {
      setDeleteUserLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      archived: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      signed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getExpirationStatus = (expiresAt?: string) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'text-red-600', text: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring', color: 'text-yellow-600', text: `Expires in ${daysUntilExpiry} days` };
    }
    return { status: 'valid', color: 'text-green-600', text: 'Valid' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !userDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested user could not be found.'}</p>
          <button
            onClick={() => router.push('/dashboard?tab=admin')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard?tab=admin')}
                className="flex items-center text-white hover:text-orange-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Admin Dashboard
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {!isEditing && (
                <>
                  <button
                    onClick={handleEditUser}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Edit User
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </button>
                </>
              )}
              <button
                onClick={() => router.push(`/generate-contract?user_id=${userId}`)}
                className="bg-white text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Contract
              </button>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold">{userDetails.name}</h1>
            <p className="text-orange-100">{userDetails.company_name || 'Individual Contractor'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'contracts', label: 'Contracts', icon: Building },
              { id: 'jobsites', label: 'Job Sites', icon: MapPin },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {isEditing ? 'Edit User Information' : 'User Information'}
                  </h2>
                  {isEditing && (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleCancelEdit}
                        disabled={saveLoading}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveUser}
                        disabled={saveLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        {saveLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  )}
                </div>
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
                
                {isEditing ? (
                  // Edit Form
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={editForm.company_name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, company_name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter company name"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Name
                        </label>
                        <input
                          type="text"
                          value={editForm.contact_name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, contact_name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter contact name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editForm.is_verified}
                            onChange={(e) => setEditForm(prev => ({ ...prev, is_verified: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Verified User</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Display View
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Full Name</p>
                          <p className="text-gray-900">{userDetails.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p className="text-gray-900">{userDetails.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Building className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Company</p>
                          <p className="text-gray-900">{userDetails.company_name || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Contact Name</p>
                          <p className="text-gray-900">{userDetails.contact_name || userDetails.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <p className="text-gray-900">{userDetails.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Member Since</p>
                          <p className="text-gray-900">{new Date(userDetails.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Verification Status</p>
                          <p className={`font-medium ${
                            userDetails.is_verified ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {userDetails.is_verified ? 'Verified' : 'Pending Verification'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
                </div>
                <div className="p-6">
                  {documents.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No documents uploaded yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((doc) => {
                        const expirationStatus = getExpirationStatus(doc.expires_at);
                        return (
                          <div key={doc.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <FileText className="h-5 w-5 text-gray-400" />
                                  <div>
                                    <p className="font-medium text-gray-900">{doc.document_name || doc.original_name || 'Unnamed Document'}</p>
                                    <p className="text-sm text-gray-500">
                                      {doc.document_type} • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                                    </p>
                                    {expirationStatus && (
                                      <p className={`text-sm ${expirationStatus.color}`}>
                                        {expirationStatus.text}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {doc.admin_notes && (
                                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                                    <strong>Admin Notes:</strong> {doc.admin_notes}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-3">
                                {getStatusBadge(doc.status)}
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => window.open(doc.document_url, '_blank')}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                    title="View Document"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  {doc.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleDocumentAction(doc.id, 'approve')}
                                        disabled={actionLoading === `${doc.id}-approve`}
                                        className="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                                        title="Approve Document"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDocumentAction(doc.id, 'reject')}
                                        disabled={actionLoading === `${doc.id}-reject`}
                                        className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                        title="Reject Document"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id, doc.document_name || doc.original_name || 'document')}
                                    disabled={deleteDocLoading === doc.id.toString()}
                                    className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                    title="Delete Document"
                                  >
                                    {deleteDocLoading === doc.id.toString() ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'contracts' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Contracts</h2>
                  <button
                    onClick={() => router.push(`/generate-contract?user_id=${userId}`)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Contract
                  </button>
                </div>
                <div className="p-6">
                  {contracts.filter(c => c.contract_type !== 'job_site').length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No contracts assigned yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {contracts.filter(c => c.contract_type !== 'job_site').map((contract) => (
                        <div key={contract.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <Building className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">{contract.project_name}</p>
                                  <p className="text-sm text-gray-500">{contract.project_description}</p>
                                  <p className="text-sm text-gray-500">
                                    ${contract.total_amount.toLocaleString()} • {new Date(contract.start_date).toLocaleDateString()} - {new Date(contract.end_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              {contract.user_comments && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                                  <strong>User Comments:</strong> {contract.user_comments}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              {getStatusBadge(contract.status)}
                              <button
                                onClick={() => handleViewContract(contract)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteContract(contract.id)}
                                disabled={deleteLoading === contract.id}
                                className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete contract"
                              >
                                {deleteLoading === contract.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'jobsites' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">Job Site Assignments</h2>
                </div>
                <div className="p-6">
                  {contracts.filter(c => c.contract_type === 'job_site').length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No job site assignments yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {contracts.filter(c => c.contract_type === 'job_site').map((jobAssignment) => (
                        <div key={jobAssignment.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <MapPin className="h-5 w-5 text-green-600" />
                                <div>
                                  <p className="font-medium text-gray-900">{jobAssignment.project_name}</p>
                                  <p className="text-sm text-gray-600">{jobAssignment.project_description}</p>
                                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                    <span>📅 {new Date(jobAssignment.start_date).toLocaleDateString()} - {new Date(jobAssignment.end_date).toLocaleDateString()}</span>
                                    {jobAssignment.total_amount && (
                                      <span>💰 ${jobAssignment.total_amount.toLocaleString()}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {jobAssignment.user_comments && (
                                <div className="mt-2 p-2 bg-white rounded text-sm text-gray-700 border border-green-200">
                                  <strong>Comments:</strong> {jobAssignment.user_comments}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                Job Site
                              </span>
                              <button
                                onClick={() => handleViewContract(jobAssignment)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteContract(jobAssignment.id)}
                                disabled={deleteLoading === jobAssignment.id}
                                className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete job assignment"
                              >
                                {deleteLoading === jobAssignment.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Documents</span>
                  <span className="font-semibold">{documents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Contracts</span>
                  <span className="font-semibold">{contracts.filter(c => c.contract_type !== 'job_site').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Job Sites</span>
                  <span className="font-semibold">{contracts.filter(c => c.contract_type === 'job_site').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Account Status</span>
                  <span className={`text-sm px-2 py-1 rounded ${userDetails.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {userDetails.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Details Modal */}
      {showContractModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Contract Details</h2>
              <button
                onClick={closeContractModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Status</h3>
                {getStatusBadge(selectedContract.status)}
              </div>

              {/* Project Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Project Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Project Name</p>
                    <p className="text-gray-900">{selectedContract.project_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Start Date</p>
                    <p className="text-gray-900">{new Date(selectedContract.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">End Date</p>
                    <p className="text-gray-900">{new Date(selectedContract.end_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-gray-900">${selectedContract.total_amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Project Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Project Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedContract.project_description}</p>
              </div>

              {/* User Comments */}
              {selectedContract.user_comments && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">User Comments</h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{selectedContract.user_comments}</p>
                  </div>
                </div>
              )}

              {/* Creation Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Contract Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contract ID</p>
                    <p className="text-gray-900 font-mono text-sm">{selectedContract.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created</p>
                    <p className="text-gray-900">{new Date(selectedContract.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Signature Status</p>
                    <div className="flex items-center space-x-2">
                      {selectedContract.signature_data ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Digitally Signed</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-500">Not Signed</span>
                        </>
                      )}
                    </div>
                  </div>
                  {selectedContract.signed_at && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Signed Date</p>
                      <p className="text-gray-900">{new Date(selectedContract.signed_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-between">
              <button
                onClick={() => {
                  if (selectedContract) {
                    handleDeleteContract(selectedContract.id);
                  }
                }}
                disabled={deleteLoading === selectedContract?.id}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {deleteLoading === selectedContract?.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Contract
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={closeContractModal}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (selectedContract) {
                      downloadContract(selectedContract);
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                  title="Download PDF with signature (if signed)"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    closeContractModal();
                    router.push(`/generate-contract?user_id=${userId}`);
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Create New Contract
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete User Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete User
                </h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <strong>{userDetails?.name}</strong>? 
                This action cannot be undone and will permanently remove:
              </p>
              <ul className="mt-2 text-sm text-gray-500 list-disc list-inside space-y-1">
                <li>User account and profile information</li>
                <li>All uploaded documents</li>
                <li>All contracts and agreements</li>
                <li>All invoices and receipts</li>
                <li>All estimates and project data</li>
              </ul>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteUserLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteUserLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {deleteUserLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
