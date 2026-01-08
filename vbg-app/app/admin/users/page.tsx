'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Building, 
  CheckCircle, 
  XCircle,
  Search,
  Edit,
  UserPlus,
  Trash2,
  FileText,
  Send,
  Upload,
  X
} from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  company_name?: string;
  phone?: string;
  user_type: string;
  is_verified: boolean;
  created_at: string;
}

export default function UsersManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  
  // Request Document state
  const [showRequestDocModal, setShowRequestDocModal] = useState(false);
  const [requestDocUser, setRequestDocUser] = useState<UserData | null>(null);
  const [requestDocType, setRequestDocType] = useState('');
  const [requestDocMessage, setRequestDocMessage] = useState('');
  const [requestDocLoading, setRequestDocLoading] = useState(false);
  
  // Send Document state
  const [showSendDocModal, setShowSendDocModal] = useState(false);
  const [sendDocUser, setSendDocUser] = useState<UserData | null>(null);
  const [sendDocFile, setSendDocFile] = useState<File | null>(null);
  const [sendDocMessage, setSendDocMessage] = useState('');
  const [sendDocLoading, setSendDocLoading] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!user || !(user.isAdmin || (user as any)?.is_admin || user.id === 15)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${API_URL}/api/admin/users`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      } else {
        console.error('Failed to fetch users:', response.status);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleSelectUser = (userId: number) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    
    try {
      setBulkDeleteLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      
      // Delete users one by one
      const deletePromises = Array.from(selectedUsers).map(userId =>
        fetch(`${API_URL}/api/admin/users/${userId}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      );
      
      const results = await Promise.all(deletePromises);
      const successfulDeletes = results.filter(r => r.ok).length;
      
      if (successfulDeletes > 0) {
        // Remove deleted users from local state
        setUsers(prev => prev.filter(u => !selectedUsers.has(u.id)));
        setFilteredUsers(prev => prev.filter(u => !selectedUsers.has(u.id)));
        setSelectedUsers(new Set());
        setShowBulkDeleteModal(false);
      }
      
      if (successfulDeletes < selectedUsers.size) {
        alert(`Deleted ${successfulDeletes} of ${selectedUsers.size} users. Some deletions may have failed.`);
      }
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      alert('Failed to delete some users');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setDeleteLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${API_URL}/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        // Remove user from local state
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        setFilteredUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        setShowDeleteModal(false);
        setUserToDelete(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Request Document
  const handleRequestDocument = async () => {
    if (!requestDocUser || !requestDocType) return;
    
    try {
      setRequestDocLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${API_URL}/api/admin/request-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: requestDocUser.id,
          documentType: requestDocType,
          message: requestDocMessage
        })
      });
      
      if (response.ok) {
        alert(`Document request sent to ${requestDocUser.company_name || requestDocUser.name}`);
        setShowRequestDocModal(false);
        setRequestDocUser(null);
        setRequestDocType('');
        setRequestDocMessage('');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to send document request');
      }
    } catch (error) {
      console.error('Error requesting document:', error);
      alert('Failed to send document request');
    } finally {
      setRequestDocLoading(false);
    }
  };

  // Handle Send Document
  const handleSendDocument = async () => {
    if (!sendDocUser || !sendDocFile) return;
    
    try {
      setSendDocLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      
      const formData = new FormData();
      formData.append('file', sendDocFile);
      formData.append('userId', sendDocUser.id.toString());
      formData.append('message', sendDocMessage);
      
      const response = await fetch(`${API_URL}/api/admin/send-document`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (response.ok) {
        alert(`Document sent to ${sendDocUser.company_name || sendDocUser.name}`);
        setShowSendDocModal(false);
        setSendDocUser(null);
        setSendDocFile(null);
        setSendDocMessage('');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to send document');
      }
    } catch (error) {
      console.error('Error sending document:', error);
      alert('Failed to send document');
    } finally {
      setSendDocLoading(false);
    }
  };

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(u =>
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.company_name?.toLowerCase().includes(query) ||
      u.user_type?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard?tab=admin')}
                className="flex items-center text-white hover:text-cyan-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Admin Dashboard
              </button>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-cyan-100">View and edit user profiles</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar and Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name, email, company, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            {selectedUsers.size > 0 && (
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex items-center gap-2 whitespace-nowrap transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Delete Selected ({selectedUsers.size})
              </button>
            )}
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
            >
              <UserPlus className="w-5 h-5" />
              Add New User
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company / Contact
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Status
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No users found</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((userData) => (
                    <tr key={userData.id} className={`hover:bg-gray-50 ${selectedUsers.has(userData.id) ? 'bg-cyan-50' : ''}`}>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(userData.id)}
                          onChange={() => toggleSelectUser(userData.id)}
                          className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-cyan-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-cyan-600" />
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[180px]" title={userData.company_name || userData.name}>
                              {userData.company_name || userData.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-[180px]" title={userData.company_name ? userData.name : ''}>
                              {userData.company_name ? userData.name : `ID: ${userData.id}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900 truncate max-w-[200px]" title={userData.email}>
                          {userData.email}
                        </div>
                        {userData.phone && (
                          <div className="text-xs text-gray-500">{userData.phone}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          userData.user_type === 'admin' ? 'bg-purple-100 text-purple-800' :
                          userData.user_type === 'subcontractor' ? 'bg-orange-100 text-orange-800' :
                          'bg-cyan-100 text-cyan-800'
                        }`}>
                          {userData.user_type || 'client'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {userData.is_verified ? (
                          <span title="Verified"><CheckCircle className="h-5 w-5 text-green-500" /></span>
                        ) : (
                          <span title="Unverified"><XCircle className="h-5 w-5 text-gray-300" /></span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => router.push(`/admin/user-details/${userData.id}`)}
                            className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded"
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setRequestDocUser(userData);
                              setShowRequestDocModal(true);
                            }}
                            className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded"
                            title="Request Document"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSendDocUser(userData);
                              setShowSendDocModal(true);
                            }}
                            className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded"
                            title="Send Document"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(userData);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white rounded-t-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Add New User</h2>
                  <p className="text-green-100 text-sm mt-1">
                    Choose the type of user to create
                  </p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  router.push('/admin/invite-client');
                }}
                className="w-full p-4 border-2 border-cyan-200 rounded-lg hover:border-cyan-600 hover:bg-cyan-50 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">Add Client</div>
                    <div className="text-sm text-gray-500">Create a new client account</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  router.push('/admin/invite-subcontractor');
                }}
                className="w-full p-4 border-2 border-orange-200 rounded-lg hover:border-orange-600 hover:bg-orange-50 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">Add Subcontractor</div>
                    <div className="text-sm text-gray-500">Create a new subcontractor account</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-700">
                  Delete User
                </h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <strong>{userToDelete.name}</strong>? 
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
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center border border-red-200"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && selectedUsers.size > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-700">
                  Delete {selectedUsers.size} User{selectedUsers.size > 1 ? 's' : ''}
                </h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <strong>{selectedUsers.size} selected user{selectedUsers.size > 1 ? 's' : ''}</strong>? 
                This action cannot be undone and will permanently remove for each user:
              </p>
              <ul className="mt-2 text-sm text-gray-500 list-disc list-inside space-y-1">
                <li>User account and profile information</li>
                <li>All uploaded documents</li>
                <li>All contracts and agreements</li>
                <li>All invoices and receipts</li>
                <li>All estimates and project data</li>
              </ul>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                <p className="text-xs font-medium text-gray-600 mb-2">Selected users:</p>
                <div className="space-y-1">
                  {filteredUsers.filter(u => selectedUsers.has(u.id)).map(u => (
                    <div key={u.id} className="text-xs text-gray-500">
                      • {u.name} ({u.email})
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkDeleteLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteLoading}
                className="bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center border border-red-200"
              >
                {bulkDeleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete {selectedUsers.size} User{selectedUsers.size > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Document Modal */}
      {showRequestDocModal && requestDocUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Request Document from {requestDocUser.company_name || requestDocUser.name}
              </h3>
              <button
                onClick={() => {
                  setShowRequestDocModal(false);
                  setRequestDocUser(null);
                  setRequestDocType('');
                  setRequestDocMessage('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type *
                </label>
                <select
                  value={requestDocType}
                  onChange={(e) => setRequestDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="">Select document type...</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optional)
                </label>
                <textarea
                  value={requestDocMessage}
                  onChange={(e) => setRequestDocMessage(e.target.value)}
                  placeholder="Add a note about why you need this document..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  setShowRequestDocModal(false);
                  setRequestDocUser(null);
                  setRequestDocType('');
                  setRequestDocMessage('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestDocument}
                disabled={!requestDocType || requestDocLoading}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {requestDocLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Document Modal */}
      {showSendDocModal && sendDocUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Send Document to {sendDocUser.company_name || sendDocUser.name}
              </h3>
              <button
                onClick={() => {
                  setShowSendDocModal(false);
                  setSendDocUser(null);
                  setSendDocFile(null);
                  setSendDocMessage('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-cyan-500 transition-colors">
                  <input
                    type="file"
                    onChange={(e) => setSendDocFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="send-doc-file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <label htmlFor="send-doc-file" className="cursor-pointer">
                    {sendDocFile ? (
                      <div className="flex items-center justify-center gap-2 text-cyan-600">
                        <FileText className="h-5 w-5" />
                        <span>{sendDocFile.name}</span>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optional)
                </label>
                <textarea
                  value={sendDocMessage}
                  onChange={(e) => setSendDocMessage(e.target.value)}
                  placeholder="Add a note about this document..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  setShowSendDocModal(false);
                  setSendDocUser(null);
                  setSendDocFile(null);
                  setSendDocMessage('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSendDocument}
                disabled={!sendDocFile || sendDocLoading}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {sendDocLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Document
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
