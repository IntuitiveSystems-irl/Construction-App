'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Download, 
  Eye, 
  DollarSign, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  Calculator,
  ArrowLeft,
  Plus
} from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  project_name: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  issue_date: string;
  due_date: string;
  description?: string;
  quickbooks_id?: string;
}

export default function InvoicesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${API_URL}/api/invoices`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        setError('Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Error loading invoices');
    } finally {
      setDataLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    window.open(`${API_URL}/api/invoices/${invoiceId}/download`, '_blank');
  };

  const handleViewInvoice = (invoiceId: string) => {
    router.push(`/invoices/${invoiceId}`);
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
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
              <h1 className="text-3xl font-bold">Invoices</h1>
              <p className="text-orange-100 mt-2">
                View and download your project invoices
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/create-invoice')}
                className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors flex items-center space-x-2 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Create New Invoice</span>
              </button>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
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
              <div className="flex items-center space-x-2 py-3 px-1 border-b-2 border-white text-white font-medium text-sm whitespace-nowrap">
                <DollarSign className="h-4 w-4" />
                <span>Invoices</span>
              </div>
              <Link
                href="/receipts"
                className="flex items-center space-x-2 py-3 px-1 border-b-2 border-transparent text-orange-100 hover:text-white hover:border-orange-200 font-medium text-sm whitespace-nowrap transition-colors"
              >
                <Receipt className="h-4 w-4" />
                <span>Receipts</span>
              </Link>
              <Link
                href="/estimates"
                className="flex items-center space-x-2 py-3 px-1 border-b-2 border-transparent text-orange-100 hover:text-white hover:border-orange-200 font-medium text-sm whitespace-nowrap transition-colors"
              >
                <Calculator className="h-4 w-4" />
                <span>Estimates</span>
              </Link>
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

        {/* Invoices List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Your Invoices</h3>
          </div>
          
          {invoices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No invoices found</p>
              <p className="text-gray-400 text-sm mt-2">
                Invoices will appear here once they are generated for your projects
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
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
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(invoice.status)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              #{invoice.invoice_number}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(invoice.issue_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.project_name}</div>
                        {invoice.description && (
                          <div className="text-sm text-gray-500">{invoice.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${invoice.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewInvoice(invoice.id)}
                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-xs flex items-center"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-xs flex items-center"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
