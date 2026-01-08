'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  DollarSign,
  Send,
  ArrowLeft,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Mail,
  Calendar,
  FileText,
  Eye,
  Check,
  X
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  project_name: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  issue_date: string;
  due_date: string;
  description?: string;
}

export default function AdminInvoicesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showNewInvoiceForm, setShowNewInvoiceForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newInvoice, setNewInvoice] = useState({
    client_email: '',
    project_name: '',
    amount: '',
    description: '',
    due_date: ''
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
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/invoices`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSendInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/invoices`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice)
      });

      if (response.ok) {
        setShowNewInvoiceForm(false);
        setNewInvoice({ client_email: '', project_name: '', amount: '', description: '', due_date: '' });
        fetchInvoices();
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const handleApproveInvoice = async (invoiceId: string) => {
    setActionLoading(invoiceId);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/invoices/${invoiceId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        fetchInvoices(); // Refresh the list
        setSelectedInvoice(null);
      }
    } catch (error) {
      console.error('Error approving invoice:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectInvoice = async (invoiceId: string) => {
    setActionLoading(invoiceId);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/invoices/${invoiceId}/reject`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        fetchInvoices(); // Refresh the list
        setSelectedInvoice(null);
      }
    } catch (error) {
      console.error('Error rejecting invoice:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
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
                <h1 className="text-3xl font-bold text-white">Invoices</h1>
                <p className="text-cyan-100 mt-1">Send and manage client invoices</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewInvoiceForm(!showNewInvoiceForm)}
              className="bg-white text-cyan-600 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-50 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>New Invoice</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Invoice Form */}
        {showNewInvoiceForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-700 mb-6">Send Invoice</h3>
            <form onSubmit={handleSendInvoice} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={newInvoice.client_email}
                      onChange={(e) => setNewInvoice({ ...newInvoice, client_email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="client@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={newInvoice.project_name}
                      onChange={(e) => setNewInvoice({ ...newInvoice, project_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="Project name"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={newInvoice.amount}
                      onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={newInvoice.due_date}
                      onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Invoice description..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500 text-white px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors font-semibold flex items-center justify-center space-x-2"
                >
                  <Send className="h-5 w-5" />
                  <span>Send Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Invoices List */}
        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Invoices Yet</h3>
            <p className="text-gray-500">Click "New Invoice" to send your first invoice</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getStatusIcon(invoice.status)}
                      <h3 className="text-xl font-bold text-gray-700">{invoice.invoice_number}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(invoice.status)}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-lg font-medium text-gray-700 mb-2">{invoice.project_name}</p>
                    {invoice.description && (
                      <p className="text-gray-600 mb-4">{invoice.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 flex items-center mb-1">
                          <User className="h-4 w-4 mr-1" />
                          Client
                        </span>
                        <p className="font-medium text-gray-700">{invoice.client_name}</p>
                        <p className="text-gray-600">{invoice.client_email}</p>
                      </div>

                      <div>
                        <span className="text-gray-500 flex items-center mb-1">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Amount
                        </span>
                        <p className="text-2xl font-bold text-gray-700">${invoice.amount.toLocaleString()}</p>
                      </div>

                      <div>
                        <span className="text-gray-500 flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          Issue Date
                        </span>
                        <p className="font-medium text-gray-700">
                          {new Date(invoice.issue_date).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500 flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due Date
                        </span>
                        <p className="font-medium text-gray-700">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <button
                      onClick={() => setSelectedInvoice(invoice)}
                      className="text-cyan-600 hover:text-cyan-700 font-semibold flex items-center space-x-1 px-3 py-1 rounded hover:bg-cyan-50"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    
                    {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                      <>
                        <button
                          onClick={() => handleApproveInvoice(invoice.id)}
                          disabled={actionLoading === invoice.id}
                          className="text-green-600 hover:text-green-700 font-semibold flex items-center space-x-1 px-3 py-1 rounded hover:bg-green-50 disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRejectInvoice(invoice.id)}
                          disabled={actionLoading === invoice.id}
                          className="text-red-600 hover:text-red-700 font-semibold flex items-center space-x-1 px-3 py-1 rounded hover:bg-red-50 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invoice Detail Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-700">Invoice Details</h2>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(selectedInvoice.status)}
                    <h3 className="text-xl font-bold text-gray-700">{selectedInvoice.invoice_number}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedInvoice.status)}`}>
                      {selectedInvoice.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Project</h4>
                    <p className="text-lg font-semibold text-gray-700">{selectedInvoice.project_name}</p>
                    {selectedInvoice.description && (
                      <p className="text-gray-600 mt-2">{selectedInvoice.description}</p>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Client</h4>
                      <p className="font-semibold text-gray-700">{selectedInvoice.client_name}</p>
                      <p className="text-gray-600">{selectedInvoice.client_email}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Amount</h4>
                      <p className="text-3xl font-bold text-gray-700">${selectedInvoice.amount.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Issue Date</h4>
                      <p className="font-semibold text-gray-700">
                        {new Date(selectedInvoice.issue_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Due Date</h4>
                      <p className="font-semibold text-gray-700">
                        {new Date(selectedInvoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {(selectedInvoice.status === 'pending' || selectedInvoice.status === 'overdue') && (
                    <div className="border-t border-gray-200 pt-6 flex space-x-3">
                      <button
                        onClick={() => handleApproveInvoice(selectedInvoice.id)}
                        disabled={actionLoading === selectedInvoice.id}
                        className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <Check className="h-5 w-5" />
                        <span>Approve & Mark as Paid</span>
                      </button>
                      <button
                        onClick={() => handleRejectInvoice(selectedInvoice.id)}
                        disabled={actionLoading === selectedInvoice.id}
                        className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <X className="h-5 w-5" />
                        <span>Reject Invoice</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
