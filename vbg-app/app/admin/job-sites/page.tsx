'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, MapPin, Users, Calendar, DollarSign, Edit, Trash2, Eye, MessageSquare, Send, FileText } from 'lucide-react';

interface JobSite {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  client_id: number;
  client_name?: string;
  project_manager: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
  client_notes: string;
  contractor_notes: string;
  safety_requirements: string;
  created_at: string;
  assigned_users?: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  user_type: 'client' | 'subcontractor';
  company_name?: string;
}

export default function JobSitesManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [jobSites, setJobSites] = useState<JobSite[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJobSite, setSelectedJobSite] = useState<JobSite | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageForm, setMessageForm] = useState({
    message: '',
    message_type: 'update',
    priority: 'normal',
    send_sms: true
  });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [deletingJobSite, setDeletingJobSite] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!user || !(user.isAdmin || (user as any)?.is_admin || user.id === 15)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const fetchJobSites = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      console.log('Fetching job sites from:', `${API_URL}/api/admin/job-sites`);
      const response = await fetch(`${API_URL}/api/admin/job-sites`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Job sites fetched successfully:', data.length, 'sites');
        setJobSites(data);
      } else {
        console.error('Failed to fetch job sites:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching job sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/users`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchJobSites();
    fetchUsers();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-primary-100 text-primary-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-cyan-100 text-cyan-800';
      case 'on_hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleSendMessage = async () => {
    if (!selectedJobSite || !messageForm.message.trim()) {
      alert('Please enter a message');
      return;
    }

    setSendingMessage(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/job-sites/${selectedJobSite.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(messageForm),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Message sent successfully to ${result.recipients} users!\n\nSMS Results:\n${result.sms_results.map((r: any) => `${r.user}: ${r.status}`).join('\n')}`);
        setShowMessageModal(false);
        setMessageForm({
          message: '',
          message_type: 'update',
          priority: 'normal',
          send_sms: true
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteJobSite = async (jobSite: JobSite) => {
    if (!confirm(`Are you sure you want to delete the job site "${jobSite.name}"? This will also remove all user assignments and cannot be undone.`)) {
      return;
    }

    setDeletingJobSite(jobSite.id);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/job-sites/${jobSite.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Remove from local state
        setJobSites(prev => prev.filter(js => js.id !== jobSite.id));
        alert('Job site deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error deleting job site: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting job site:', error);
      alert('Failed to delete job site. Please try again.');
    } finally {
      setDeletingJobSite(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-cyan-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/dashboard?tab=admin')}
                className="flex items-center text-white hover:text-cyan-100 text-sm font-normal tracking-wide transition-colors mb-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Admin Dashboard
              </button>
              <h1 className="text-2xl font-bold tracking-wide text-white mb-2">Job Sites Management</h1>
              <p className="text-cyan-100 text-sm font-normal tracking-wide mt-2">
                Create and manage construction job sites, assign teams, and track progress
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/admin/documents')}
                className="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center font-semibold"
              >
                <FileText className="h-5 w-5 mr-2" />
                Manage Documents
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-white px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center font-semibold"
              >
                <Plus className="h-5 w-5 mr-2 text-cyan-600" />
                <span className="text-cyan-600 font-semibold">Create Job Site</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Job Sites Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {jobSites.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Job Sites Yet</h3>
            <p className="text-gray-600 mb-6">Create your first job site to get started with project management.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white px-6 py-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              <span className="text-cyan-600 font-semibold">Create Job Site</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobSites.map((jobSite) => (
              <div key={jobSite.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-1">{jobSite.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(jobSite.status)}`}>
                        {jobSite.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/admin/job-sites/${jobSite.id}`)}
                        className="text-cyan-600 hover:text-cyan-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedJobSite(jobSite);
                          setShowAssignModal(true);
                        }}
                        className="text-cyan-600 hover:text-cyan-700"
                        title="Assign Users"
                      >
                        <Users className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedJobSite(jobSite);
                          setShowMessageModal(true);
                        }}
                        className="text-cyan-600 hover:text-cyan-700"
                        title="Send Message"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteJobSite(jobSite)}
                        disabled={deletingJobSite === jobSite.id}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Delete Job Site"
                      >
                        {deletingJobSite === jobSite.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {jobSite.address}, {jobSite.city}, {jobSite.state}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(jobSite.start_date).toLocaleDateString()} - {new Date(jobSite.end_date).toLocaleDateString()}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Budget: {formatCurrency(jobSite.budget)}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {jobSite.assigned_users || 0} assigned workers
                    </div>
                  </div>

                  {jobSite.description && (
                    <p className="text-sm text-gray-600 mt-4 line-clamp-2">
                      {jobSite.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* <span className="bg-gradient-to-r from-teal-500 to-cyan-600 bg-clip-text text-transparent">Create Job Site</span> Modal */}
      {showCreateModal && (
        <CreateJobSiteModal
          users={users}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchJobSites();
          }}
        />
      )}

      {/* Assign Users Modal */}
      {showAssignModal && selectedJobSite && (
        <AssignUsersModal
          jobSite={selectedJobSite}
          users={users}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedJobSite(null);
          }}
          onSuccess={() => {
            setShowAssignModal(false);
            setSelectedJobSite(null);
            fetchJobSites();
          }}
        />
      )}

      {/* Send Message Modal */}
      {showMessageModal && selectedJobSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-700">Send Message to {selectedJobSite.name}</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Type
                </label>
                <select
                  value={messageForm.message_type}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, message_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="update">General Update</option>
                  <option value="safety">Safety Alert</option>
                  <option value="schedule">Schedule Change</option>
                  <option value="weather">Weather Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={messageForm.priority}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your message..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="send_sms"
                  checked={messageForm.send_sms}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, send_sms: e.target.checked }))}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="send_sms" className="ml-2 block text-sm text-gray-700">
                  Send SMS notifications
                </label>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedJobSite(null);
                  setMessageForm({
                    message: '',
                    message_type: 'update',
                    priority: 'normal',
                    send_sms: true
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageForm.message.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {sendingMessage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
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

// <span className="bg-gradient-to-r from-teal-500 to-cyan-600 bg-clip-text text-transparent">Create Job Site</span> Modal Component
function CreateJobSiteModal({ users, onClose, onSuccess }: {
  users: User[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    client_id: '',
    project_manager: '',
    start_date: '',
    end_date: '',
    budget: '',
    status: 'planning',
    client_notes: '',
    contractor_notes: '',
    safety_requirements: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/job-sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          budget: parseFloat(formData.budget) || 0,
          client_id: parseInt(formData.client_id) || null
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating job site:', error);
      alert('Failed to create job site');
    } finally {
      setLoading(false);
    }
  };

  const clients = users.filter(u => u.user_type === 'client');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-700">Create New Job Site</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Site Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder="Downtown Office Building"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.company_name || client.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder="Brief description of the project..."
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder="New York"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder="NY"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code *
              </label>
              <input
                type="text"
                required
                value={formData.zip_code}
                onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder="10001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Manager
              </label>
              <input
                type="text"
                value={formData.project_manager}
                onChange={(e) => setFormData(prev => ({ ...prev, project_manager: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder="John Smith"
              />
            </div>

            {/* Dates and Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder="50000.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Notes (Visible to clients)
              </label>
              <textarea
                value={formData.client_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, client_notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder="Information that clients should see..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contractor Notes (Visible to subcontractors only)
              </label>
              <textarea
                value={formData.contractor_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, contractor_notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder="Technical details, safety requirements, etc..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Safety Requirements
              </label>
              <textarea
                value={formData.safety_requirements}
                onChange={(e) => setFormData(prev => ({ ...prev, safety_requirements: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder="PPE requirements, safety protocols, etc..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Assign Users Modal Component
function AssignUsersModal({ jobSite, users, onClose, onSuccess }: {
  jobSite: JobSite;
  users: User[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedUsers, setSelectedUsers] = useState<{[key: number]: boolean}>({});
  const [userRoles, setUserRoles] = useState<{[key: number]: string}>({});
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    setLoading(true);
    
    const assignments = Object.entries(selectedUsers)
      .filter(([_, selected]) => selected)
      .map(([userId, _]) => ({
        user_id: parseInt(userId),
        role: userRoles[parseInt(userId)] || '',
        user_type: users.find(u => u.id === parseInt(userId))?.user_type || 'subcontractor'
      }));

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      console.log('Starting assignment request to:', `${API_URL}/api/admin/job-sites/${jobSite.id}/assign`);
      console.log('Assignment data:', assignments);
      
      // Create a simple, clean request body
      const requestBody = JSON.stringify({
        assignments: assignments
      });
      console.log('Request body string:', requestBody);
      console.log('Request body length:', requestBody.length);
      
      // Test with a minimal request body first
      const testBody = '{"assignments":[{"user_id":13,"user_type":"subcontractor","role":"Test"}]}';
      console.log('Test body:', testBody);
      
      // Test connection first
      console.log('Testing connection...');
      const testResponse = await fetch(`${API_URL}/api/admin/job-sites`, {
        credentials: 'include'
      });
      console.log('Connection test result:', testResponse.status);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduced to 10 seconds
      
      const response = await fetch(`${API_URL}/api/admin/job-sites/${jobSite.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: requestBody, // Use actual request body
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('Response received:', response.status, response.statusText);

      if (response.ok) {
        console.log('Assignment successful, calling onSuccess');
        onSuccess();
      } else {
        const error = await response.json();
        console.error('Assignment failed:', error);
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error assigning users:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        alert('Request timed out. Please try again.');
      } else {
        alert('Failed to assign users: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const clients = users.filter(u => u.user_type === 'client');
  const subcontractors = users.filter(u => u.user_type === 'subcontractor');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-700">Assign Users to {jobSite.name}</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Clients Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Clients</h3>
            <div className="space-y-3">
              {clients.map(client => (
                <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers[client.id] || false}
                      onChange={(e) => setSelectedUsers(prev => ({
                        ...prev,
                        [client.id]: e.target.checked
                      }))}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-gray-600">{client.company_name || client.email}</p>
                    </div>
                  </div>
                  {selectedUsers[client.id] && (
                    <input
                      type="text"
                      placeholder="Role (e.g., Project Owner)"
                      value={userRoles[client.id] || ''}
                      onChange={(e) => setUserRoles(prev => ({
                        ...prev,
                        [client.id]: e.target.value
                      }))}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Subcontractors Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Subcontractors</h3>
            <div className="space-y-3">
              {subcontractors.map(subcontractor => (
                <div key={subcontractor.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers[subcontractor.id] || false}
                      onChange={(e) => setSelectedUsers(prev => ({
                        ...prev,
                        [subcontractor.id]: e.target.checked
                      }))}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium">{subcontractor.name}</p>
                      <p className="text-sm text-gray-600">{subcontractor.company_name || subcontractor.email}</p>
                    </div>
                  </div>
                  {selectedUsers[subcontractor.id] && (
                    <input
                      type="text"
                      placeholder="Role/Specialty (e.g., Electrician)"
                      value={userRoles[subcontractor.id] || ''}
                      onChange={(e) => setUserRoles(prev => ({
                        ...prev,
                        [subcontractor.id]: e.target.value
                      }))}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 p-6 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || Object.values(selectedUsers).every(v => !v)}
            className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign Users'}
          </button>
        </div>
      </div>
    </div>
  );
}
