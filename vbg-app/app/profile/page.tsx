'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, Calendar, Building, CheckCircle, Clock, AlertCircle, FileText, Upload, MessageSquare, Settings, Bell, Trash2, Edit, Save, X, ArrowLeft } from 'lucide-react';

interface CompanyInfo {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  date_registered: string;
  services: string;
}

interface AdminRequest {
  id: number;
  title: string;
  description: string;
  type: 'document_upload' | 'information_update' | 'verification' | 'other';
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  admin_notes?: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingRequest, setCompletingRequest] = useState<number | null>(null);
  const [deletingRequest, setDeletingRequest] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: ''
  });
  const [updating, setUpdating] = useState(false);
  const [phoneSettings, setPhoneSettings] = useState({
    phone_number: '',
    carrier: ''
  });
  // SMS functionality removed - using email notifications only
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [phoneUpdateSuccess, setPhoneUpdateSuccess] = useState(false);

  // Helper functions to transform notification data
  const getRequestType = (notificationType: string): AdminRequest['type'] => {
    switch (notificationType) {
      case 'warning':
        return 'document_upload';
      case 'info':
        return 'information_update';
      case 'success':
        return 'verification';
      default:
        return 'other';
    }
  };

  const getPriority = (notificationType: string): AdminRequest['priority'] => {
    switch (notificationType) {
      case 'warning':
        return 'high';
      case 'info':
        return 'medium';
      case 'success':
        return 'low';
      default:
        return 'medium';
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch company profile data and admin requests
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? `https://${window.location.hostname}` : 'http://localhost:5002');
        
        // Get token from localStorage
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Fetch profile data using cookies for authentication
        const profileResponse = await fetch(`${API_URL}/api/profile`, {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
          headers,
        });
        
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          if (data.success && data.user) {
            // Transform the API response to match our CompanyInfo interface
            setCompanyInfo({
              id: data.user.id.toString(),
              name: data.user.name || 'N/A',
              email: data.user.email,
              contact: data.user.name || 'N/A', // Use name as contact for now
              phone: data.user.phone_number || 'Not provided',
              status: data.user.isVerified ? 'approved' : 'pending',
              date_registered: new Date(data.user.createdAt).toLocaleDateString(),
              services: 'Construction Services' // Default value
            });
            
            // Set phone settings
            setPhoneSettings({
              phone_number: data.user.phone_number || '',
              carrier: data.user.carrier || ''
            });
            // SMS functionality removed - using email notifications only
          } else {
            setError('Invalid profile data received');
          }
        } else {
          const errorData = await profileResponse.json().catch(() => ({}));
          setError(errorData.error || 'Failed to fetch profile data');
        }

        // Fetch real notifications from the same API used by dashboard
        try {
          const notificationsResponse = await fetch(`${API_URL}/api/notifications`, {
            method: 'GET',
            credentials: 'include',
            headers,
          });
          
          if (notificationsResponse.ok) {
            const notificationsData = await notificationsResponse.json();
            // Transform notifications to match AdminRequest interface
            const transformedRequests = notificationsData.map((notification: any) => ({
              id: notification.id,
              title: notification.title,
              description: notification.message,
              type: getRequestType(notification.type),
              status: notification.read ? 'completed' : 'pending',
              priority: getPriority(notification.type),
              created_at: notification.time,
              admin_notes: notification.message
            }));
            setAdminRequests(transformedRequests);
          } else {
            console.error('Failed to fetch notifications:', notificationsResponse.status);
            setAdminRequests([]); // Set empty array if API fails
          }
        } catch (notificationError) {
          console.error('Error fetching notifications:', notificationError);
          setAdminRequests([]); // Set empty array if API fails
        }
      } catch (err) {
        setError('Error connecting to server');
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleUpdatePhoneSettings = async () => {
    setUpdatingPhone(true);
    setPhoneUpdateSuccess(false);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? `https://${window.location.hostname}` : 'http://localhost:5002');
      const response = await fetch(`${API_URL}/api/user/profile/phone`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(phoneSettings),
      });

      if (response.ok) {
        setPhoneUpdateSuccess(true);
        
        // Update company info to reflect new phone number
        if (companyInfo) {
          setCompanyInfo({
            ...companyInfo,
            phone: phoneSettings.phone_number || 'Not provided'
          });
        }
        
        // Show success for 3 seconds
        setTimeout(() => {
          setPhoneUpdateSuccess(false);
        }, 3000);
        
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating phone settings:', error);
      alert('Failed to update phone settings');
    } finally {
      setUpdatingPhone(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="pt-24 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="text-red-500 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!companyInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <div className="text-gray-500 mb-4">
            <User className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Profile Found</h2>
          <p className="text-gray-600 mb-6">We couldn&apos;t find any company information associated with your account.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-primary-100 text-primary-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-cyan-600" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-primary-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document_upload': return <Upload className="h-4 w-4" />;
      case 'information_update': return <User className="h-4 w-4" />;
      case 'verification': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const completeRequest = async (requestId: number) => {
    setCompletingRequest(requestId);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? `https://${window.location.hostname}` : 'http://localhost:5002');
      // Mark the notification as read using the notifications API
      const response = await fetch(`${API_URL}/api/notifications/${requestId}/read`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove the completed request from the list
        setAdminRequests(prev => 
          prev.filter(req => req.id !== requestId)
        );
      } else {
        console.error('Failed to mark notification as read:', response.status);
      }
    } catch (error) {
      console.error('Error completing request:', error);
    } finally {
      setCompletingRequest(null);
    }
  };

  const deleteRequest = async (requestId: number) => {
    if (!confirm('Are you sure you want to delete this notification? This action cannot be undone.')) {
      return;
    }

    setDeletingRequest(requestId);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? `https://${window.location.hostname}` : 'http://localhost:5002');
      // Delete the notification using the notifications API
      const response = await fetch(`${API_URL}/api/notifications/${requestId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove the deleted request from the list
        setAdminRequests(prev => 
          prev.filter(req => req.id !== requestId)
        );
      } else {
        console.error('Failed to delete notification:', response.status);
        alert('Failed to delete notification. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Error deleting notification. Please try again.');
    } finally {
      setDeletingRequest(null);
    }
  };

  const handleEditProfile = () => {
    if (companyInfo) {
      setEditFormData({
        name: companyInfo.name,
        email: companyInfo.email,
        phone_number: companyInfo.phone,
        password: '',
        confirmPassword: ''
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      name: '',
      email: '',
      phone_number: '',
      password: '',
      confirmPassword: ''
    });
  };

  const handleSaveProfile = async () => {
    if (editFormData.password && editFormData.password !== editFormData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setUpdating(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? `https://${window.location.hostname}` : 'http://localhost:5002');
      
      const updateData: any = {
        name: editFormData.name,
        email: editFormData.email,
        phone_number: editFormData.phone_number
      };
      
      // Only include password if it's provided
      if (editFormData.password) {
        updateData.password = editFormData.password;
      }
      
      const response = await fetch(`${API_URL}/api/profile/update`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local company info
          setCompanyInfo(prev => prev ? {
            ...prev,
            name: editFormData.name,
            email: editFormData.email,
            phone: editFormData.phone_number,
            contact: editFormData.name // Use name as contact
          } : null);
          
          setIsEditing(false);
          alert('Profile updated successfully!');
        } else {
          alert(data.error || 'Failed to update profile');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Clean Header - VBG Style */}
      <div className="bg-cyan-600 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div>
            <Link
              href="/dashboard"
              className="flex items-center text-white hover:text-cyan-100 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold tracking-wide text-white mb-2">Profile</h1>
            <p className="text-sm text-cyan-100 font-normal tracking-wide">
              Manage your account information
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SMS functionality removed - using email notifications only */}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Information */}
            {companyInfo && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
                    <div className="flex items-center space-x-2">
                      {!isEditing ? (
                        <button
                          onClick={handleEditProfile}
                          className="flex items-center space-x-1 px-3 py-1 bg-cyan-600 text-white text-sm rounded-md hover:bg-cyan-700 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveProfile}
                            disabled={updating}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors"
                          >
                            <Save className="h-4 w-4" />
                            <span>{updating ? 'Saving...' : 'Save'}</span>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={updating}
                            className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
                          >
                            <X className="h-4 w-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {!isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Building className="h-5 w-5 text-gray-400" />
                          <div>
            <Link
              href="/dashboard"
              className="flex items-center text-gray-900 hover:text-gray-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
                            <p className="text-sm text-gray-500">Company Name</p>
                            <p className="font-medium text-gray-900">{companyInfo.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
            <Link
              href="/dashboard"
              className="flex items-center text-gray-900 hover:text-gray-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
                            <p className="text-sm text-gray-500">Contact Person</p>
                            <p className="font-medium text-gray-900">{companyInfo.contact}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
            <Link
              href="/dashboard"
              className="flex items-center text-gray-900 hover:text-gray-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium text-gray-900">{companyInfo.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
            <Link
              href="/dashboard"
              className="flex items-center text-gray-900 hover:text-gray-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium text-gray-900">{companyInfo.phone}</p>
                          </div>
                        </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
            <Link
              href="/dashboard"
              className="flex items-center text-gray-900 hover:text-gray-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
                          <p className="text-sm text-gray-500">Date Registered</p>
                          <p className="font-medium text-gray-900">{companyInfo.date_registered}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className={`h-5 w-5 ${
                          companyInfo.status === 'approved' ? 'text-green-500' :
                          companyInfo.status === 'rejected' ? 'text-red-500' : 'text-primary-500'
                        }`} />
                        <div>
            <Link
              href="/dashboard"
              className="flex items-center text-gray-900 hover:text-gray-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className={`font-medium capitalize ${
                            companyInfo.status === 'approved' ? 'text-green-600' :
                            companyInfo.status === 'rejected' ? 'text-red-600' : 'text-primary-600'
                          }`}>{companyInfo.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
            <Link
              href="/dashboard"
              className="flex items-center text-gray-900 hover:text-gray-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Name *
                          </label>
                          <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="Enter company name"
                          />
                        </div>
                        <div>
            <Link
              href="/dashboard"
              className="flex items-center text-gray-900 hover:text-gray-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={editFormData.email}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="Enter email address"
                          />
                        </div>
                        <div>
            <Link
              href="/dashboard"
              className="flex items-center text-gray-900 hover:text-gray-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={editFormData.phone_number}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div>
            <Link
              href="/dashboard"
              className="flex items-center text-gray-900 hover:text-gray-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password (leave blank to keep current)
                          </label>
                          <input
                            type="password"
                            value={editFormData.password}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="Enter new password"
                          />
                        </div>
                        <div>
            <Link
              href="/dashboard"
              className="flex items-center text-gray-900 hover:text-gray-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={editFormData.confirmPassword}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>* Required fields</p>
                        <p>Leave password fields blank if you don&apos;t want to change your password.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SMS functionality removed - using email notifications only */}

            {/* Admin Requests */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Admin Requests</h3>
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {adminRequests.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm">No pending requests from admin.</p>
                    <p className="text-xs text-gray-400 mt-1">All caught up!</p>
                  </div>
                ) : (
                  adminRequests.map((request) => (
                    <div key={request.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getTypeIcon(request.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-sm font-medium text-gray-900">{request.title}</h4>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(request.priority)}`}>
                                {request.priority}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(request.status)}
                                <span className="capitalize">{request.status.replace('_', ' ')}</span>
                              </div>
                              {request.due_date && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Due: {new Date(request.due_date).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                            {request.admin_notes && (
                              <div className="mt-3 p-3 bg-cyan-50 rounded-lg">
                                <p className="text-sm text-cyan-800">
                                  <strong>Admin Notes:</strong> {request.admin_notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {request.status !== 'completed' && (
                            <button
                              onClick={() => completeRequest(request.id)}
                              disabled={completingRequest === request.id || deletingRequest === request.id}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors"
                            >
                              {completingRequest === request.id ? 'Completing...' : 'Mark Complete'}
                            </button>
                          )}
                          <button
                            onClick={() => deleteRequest(request.id)}
                            disabled={deletingRequest === request.id || completingRequest === request.id}
                            className="px-2 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center"
                            title="Delete notification"
                          >
                            {deletingRequest === request.id ? (
                              <span className="text-xs">Deleting...</span>
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/document"
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <FileText className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">View Documents</span>
                </Link>
                <Link
                  href="/document"
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Upload Document</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <Building className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Dashboard</span>
                </Link>
                <Link
                  href="/notifications"
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
                >
                  <Bell className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Notification Preferences</span>
                </Link>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Verification</span>
                  <span className={`text-sm font-medium ${
                    companyInfo?.status === 'approved' ? 'text-green-600' :
                    companyInfo?.status === 'rejected' ? 'text-red-600' : 'text-primary-600'
                  }`}>
                    {companyInfo?.status === 'approved' ? 'Verified' :
                     companyInfo?.status === 'rejected' ? 'Rejected' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Documents</span>
                  <span className="text-sm font-medium text-cyan-600">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Connection</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-600">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
