'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calculator, 
  Send,
  CheckCircle, 
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  ArrowLeft,
  Plus,
  Eye,
  ThumbsUp,
  ThumbsDown
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
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [responseForm, setResponseForm] = useState({
    amount: '',
    notes: ''
  });

  useEffect(() => {
    const isAdmin = user?.isAdmin || (user as any)?.is_admin;
    if (!loading && (!user || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const isAdmin = user?.isAdmin || (user as any)?.is_admin;
    if (user && isAdmin) {
      fetchEstimates();
    }
  }, [user]);

  const fetchEstimates = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/estimates`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setEstimates(data);
      }
    } catch (error) {
      console.error('Error fetching estimates:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSendEstimate = async (estimateId: string, status: 'approved' | 'rejected') => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/estimates/${estimateId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: responseForm.amount ? parseFloat(responseForm.amount) : null,
          admin_notes: responseForm.notes,
          status: status
        })
      });

      if (response.ok) {
        setSelectedEstimate(null);
        setResponseForm({ amount: '', notes: '' });
        fetchEstimates();
      }
    } catch (error) {
      console.error('Error updating estimate:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      requested: 'bg-cyan-100 text-cyan-700',
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700';
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading estimates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-white hover:text-cyan-100">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">Estimates</h1>
                <p className="text-cyan-100 mt-1">Review and respond to estimate requests</p>
              </div>
            </div>
            <Link
              href="/admin/estimates/new"
              className="bg-white text-cyan-600 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-50 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>New Estimate</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estimates Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-700">All Estimates</h3>
          </div>
          
          {estimates.length === 0 ? (
            <div className="p-8 text-center">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No estimates found</p>
              <p className="text-gray-400 text-sm mt-2">
                Estimate requests from clients will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estimate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estimates.map((estimate) => (
                    <tr key={estimate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-700">
                          #{estimate.estimate_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(estimate.requested_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 font-medium">{estimate.client_name}</div>
                        <div className="text-sm text-gray-500">{estimate.client_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 font-medium">{estimate.project_name}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">{estimate.description}</div>
                        {estimate.notes && (
                          <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                            Note: {estimate.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {estimate.amount ? (
                          <div className="text-sm font-medium text-gray-700">
                            ${estimate.amount.toLocaleString()}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">
                            Pending
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(estimate.status)}`}>
                          {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
                        </span>
                        {estimate.admin_notes && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs">
                            {estimate.admin_notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-700">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {new Date(estimate.requested_date).toLocaleDateString()}
                        </div>
                        {estimate.response_date && (
                          <div className="text-xs text-gray-500 mt-1">
                            Responded: {new Date(estimate.response_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedEstimate(estimate);
                              setResponseForm({
                                amount: estimate.amount?.toString() || '',
                                notes: estimate.admin_notes || ''
                              });
                            }}
                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-xs flex items-center"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </button>
                          {estimate.status === 'requested' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedEstimate(estimate);
                                  setResponseForm({
                                    amount: estimate.amount?.toString() || '',
                                    notes: estimate.admin_notes || ''
                                  });
                                }}
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-xs flex items-center"
                              >
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedEstimate(estimate);
                                  setResponseForm({
                                    amount: estimate.amount?.toString() || '',
                                    notes: estimate.admin_notes || ''
                                  });
                                }}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs flex items-center"
                              >
                                <ThumbsDown className="h-3 w-3 mr-1" />
                                Deny
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Response Modal */}
        {selectedEstimate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h3 className="text-xl font-bold text-gray-700 mb-4">Respond to Estimate Request</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600"><strong>Project:</strong> {selectedEstimate.project_name}</p>
                <p className="text-sm text-gray-600"><strong>Client:</strong> {selectedEstimate.client_name}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimate Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={responseForm.amount}
                      onChange={(e) => setResponseForm({ ...responseForm, amount: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={responseForm.notes}
                    onChange={(e) => setResponseForm({ ...responseForm, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Add any notes about the estimate..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleSendEstimate(selectedEstimate.id, 'approved')}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Send Estimate</span>
                  </button>
                  <button
                    onClick={() => handleSendEstimate(selectedEstimate.id, 'rejected')}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>Decline</span>
                  </button>
                  <button
                    onClick={() => setSelectedEstimate(null)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
