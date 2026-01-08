'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AdminHeader from '../../components/AdminHeader';
import { 
  Calculator, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  Send,
  DollarSign,
  Calendar,
  Search,
  Filter,
  AlertCircle,
  Edit
} from 'lucide-react';

interface Estimate {
  id: string;
  estimate_number: string;
  client_name: string;
  client_email: string;
  project_name: string;
  description: string;
  amount?: number;
  status: 'requested' | 'pending' | 'approved' | 'rejected';
  requested_date: string;
  response_date?: string;
  notes?: string;
  admin_notes?: string;
}

export default function AdminEstimatesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingEstimate, setEditingEstimate] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    amount: '',
    admin_notes: '',
    status: 'pending'
  });

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.isAdmin) {
      fetchEstimates();
    }
  }, [user]);

  const fetchEstimates = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${API_URL}/api/admin/estimates`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEstimates(data);
      } else {
        setError('Failed to fetch estimates');
      }
    } catch (error) {
      console.error('Error fetching estimates:', error);
      setError('Error loading estimates');
    } finally {
      setDataLoading(false);
    }
  };

  const handleUpdateEstimate = async (estimateId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${API_URL}/api/admin/estimates/${estimateId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: editForm.amount ? parseFloat(editForm.amount) : null,
          admin_notes: editForm.admin_notes,
          status: editForm.status
        })
      });

      if (response.ok) {
        setEditingEstimate(null);
        setEditForm({ amount: '', admin_notes: '', status: 'pending' });
        fetchEstimates();
      } else {
        setError('Failed to update estimate');
      }
    } catch (error) {
      console.error('Error updating estimate:', error);
      setError('Error updating estimate');
    }
  };

  const startEditing = (estimate: Estimate) => {
    setEditingEstimate(estimate.id);
    setEditForm({
      amount: estimate.amount?.toString() || '',
      admin_notes: estimate.admin_notes || '',
      status: estimate.status
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'requested':
        return <Send className="h-5 w-5 text-blue-600" />;
      default:
        return <Calculator className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'requested':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEstimates = estimates.filter(estimate => {
    const matchesSearch = 
      estimate.estimate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estimate.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      estimate.project_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || estimate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = estimates.reduce((acc, estimate) => {
    acc[estimate.status] = (acc[estimate.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalValue = estimates
    .filter(e => e.amount && e.status === 'approved')
    .reduce((sum, estimate) => sum + (estimate.amount || 0), 0);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading estimates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        title="Estimate Management" 
        subtitle="Review and respond to client estimate requests"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Requests</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.requested || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.pending || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.approved || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search estimates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="requested">Requested</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Estimates List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Estimate Requests</h3>
          </div>
          
          {filteredEstimates.length === 0 ? (
            <div className="p-8 text-center">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No estimates found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Estimate requests will appear here'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredEstimates.map((estimate) => (
                <div key={estimate.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(estimate.status)}
                        <h4 className="text-lg font-medium text-gray-900">
                          {estimate.project_name}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(estimate.status)}`}>
                          {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Client:</strong> {estimate.client_name} ({estimate.client_email})
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Estimate #:</strong> {estimate.estimate_number}
                      </div>
                      
                      <p className="text-gray-700 mb-3">{estimate.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Requested: {new Date(estimate.requested_date).toLocaleDateString()}
                        </div>
                        {estimate.response_date && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Responded: {new Date(estimate.response_date).toLocaleDateString()}
                          </div>
                        )}
                        {estimate.amount && (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            ${estimate.amount.toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      {estimate.notes && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <strong>Client Notes:</strong> {estimate.notes}
                          </p>
                        </div>
                      )}
                      
                      {estimate.admin_notes && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Your Response:</strong> {estimate.admin_notes}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-6 flex space-x-2">
                      <button
                        onClick={() => startEditing(estimate)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Respond</span>
                      </button>
                      <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Edit Form */}
                  {editingEstimate === estimate.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-3">Respond to Estimate Request</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estimate Amount ($)
                          </label>
                          <input
                            type="number"
                            value={editForm.amount}
                            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="Enter estimate amount"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            <option value="pending">Pending Client Approval</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Response Notes
                        </label>
                        <textarea
                          rows={3}
                          value={editForm.admin_notes}
                          onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Add notes about the estimate..."
                        />
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleUpdateEstimate(estimate.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Update Estimate
                        </button>
                        <button
                          onClick={() => setEditingEstimate(null)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
