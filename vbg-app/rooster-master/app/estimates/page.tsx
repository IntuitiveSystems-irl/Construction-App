'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Calculator, 
  Plus, 
  Eye, 
  CheckCircle, 
  Clock,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  AlertCircle,
  Send,
  Receipt,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface Estimate {
  id: string;
  estimate_number: string;
  project_name: string;
  description: string;
  amount?: number;
  status: 'requested' | 'pending' | 'approved' | 'rejected';
  requested_date: string;
  response_date?: string;
  notes?: string;
  admin_notes?: string;
}

export default function EstimatesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewEstimateForm, setShowNewEstimateForm] = useState(false);
  const [newEstimate, setNewEstimate] = useState({
    project_name: '',
    description: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchEstimates();
    }
  }, [user]);

  const fetchEstimates = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${API_URL}/api/estimates`, {
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

  const handleSubmitEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${API_URL}/api/estimates`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEstimate)
      });

      if (response.ok) {
        setNewEstimate({ project_name: '', description: '', notes: '' });
        setShowNewEstimateForm(false);
        fetchEstimates(); // Refresh the list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit estimate request');
      }
    } catch (error) {
      console.error('Error submitting estimate:', error);
      setError('Error submitting estimate request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveEstimate = async (estimateId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${API_URL}/api/estimates/${estimateId}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchEstimates(); // Refresh the list
      } else {
        setError('Failed to approve estimate');
      }
    } catch (error) {
      console.error('Error approving estimate:', error);
      setError('Error approving estimate');
    }
  };

  const handleRejectEstimate = async (estimateId: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${API_URL}/api/estimates/${estimateId}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchEstimates(); // Refresh the list
      } else {
        setError('Failed to reject estimate');
      }
    } catch (error) {
      console.error('Error rejecting estimate:', error);
      setError('Error rejecting estimate');
    }
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
        return <FileText className="h-5 w-5 text-gray-400" />;
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
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="flex items-center text-orange-100 hover:text-white mr-4 mb-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Project Estimates</h1>
              <p className="text-orange-100 mt-2">
                Request estimates and manage project approvals
              </p>
            </div>
            <button
              onClick={() => setShowNewEstimateForm(true)}
              className="bg-white text-orange-600 px-6 py-3 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Request Estimate</span>
            </button>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-b border-orange-400 border-opacity-30 mt-6">
            <div className="flex space-x-8 overflow-x-auto">
              <Link
                href="/contracts"
                className="flex items-center space-x-2 py-3 px-1 border-b-2 border-transparent text-orange-100 hover:text-white hover:border-orange-200 font-medium text-sm whitespace-nowrap transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Contracts</span>
              </Link>
              <Link
                href="/invoices"
                className="flex items-center space-x-2 py-3 px-1 border-b-2 border-transparent text-orange-100 hover:text-white hover:border-orange-200 font-medium text-sm whitespace-nowrap transition-colors"
              >
                <DollarSign className="h-4 w-4" />
                <span>Invoices</span>
              </Link>
              <Link
                href="/receipts"
                className="flex items-center space-x-2 py-3 px-1 border-b-2 border-transparent text-orange-100 hover:text-white hover:border-orange-200 font-medium text-sm whitespace-nowrap transition-colors"
              >
                <Receipt className="h-4 w-4" />
                <span>Receipts</span>
              </Link>
              <div className="flex items-center space-x-2 py-3 px-1 border-b-2 border-white text-white font-medium text-sm whitespace-nowrap">
                <Calculator className="h-4 w-4" />
                <span>Estimates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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

        {/* New Estimate Form */}
        {showNewEstimateForm && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Request New Estimate</h3>
              <button
                onClick={() => setShowNewEstimateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitEstimate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={newEstimate.project_name}
                  onChange={(e) => setNewEstimate({ ...newEstimate, project_name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter project name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={newEstimate.description}
                  onChange={(e) => setNewEstimate({ ...newEstimate, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Describe your project in detail..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newEstimate.notes}
                  onChange={(e) => setNewEstimate({ ...newEstimate, notes: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Any additional information or requirements..."
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewEstimateForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Estimates List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Your Estimates</h3>
          </div>
          
          {estimates.length === 0 ? (
            <div className="p-8 text-center">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No estimates found</p>
              <p className="text-gray-400 text-sm mt-2">
                Click &quot;Request Estimate&quot; to submit your first project estimate request
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {estimates.map((estimate) => (
                <div key={estimate.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
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
                      
                      <p className="text-gray-600 mb-3">{estimate.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
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
                      
                      {estimate.admin_notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Response:</strong> {estimate.admin_notes}
                          </p>
                        </div>
                      )}
                      
                      {estimate.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <strong>Your Notes:</strong> {estimate.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {estimate.status === 'pending' && estimate.amount && (
                      <div className="ml-6 flex space-x-2">
                        <button
                          onClick={() => handleApproveEstimate(estimate.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRejectEstimate(estimate.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
