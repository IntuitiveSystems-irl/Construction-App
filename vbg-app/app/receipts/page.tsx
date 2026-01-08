'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Receipt, 
  Download, 
  Eye, 
  DollarSign, 
  Calendar,
  CheckCircle,
  CreditCard,
  AlertCircle,
  FileText,
  Calculator,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface PaymentReceipt {
  id: string;
  receipt_number: string;
  invoice_id: string;
  invoice_number: string;
  project_name: string;
  amount: number;
  payment_method: 'credit_card' | 'bank_transfer' | 'check' | 'cash';
  payment_date: string;
  transaction_id?: string;
  notes?: string;
}

export default function ReceiptsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchReceipts();
    }
  }, [user]);

  const fetchReceipts = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${API_URL}/api/receipts`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReceipts(data);
      } else {
        setError('Failed to fetch receipts');
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
      setError('Error loading receipts');
    } finally {
      setDataLoading(false);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
        return <CreditCard className="h-4 w-4 text-cyan-600" />;
      case 'bank_transfer':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'check':
        return <Receipt className="h-4 w-4 text-purple-600" />;
      case 'cash':
        return <DollarSign className="h-4 w-4 text-primary-600" />;
      default:
        return <Receipt className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'credit_card':
        return 'Credit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'check':
        return 'Check';
      case 'cash':
        return 'Cash';
      default:
        return method;
    }
  };

  const handleDownloadReceipt = (receiptId: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    window.open(`${API_URL}/api/receipts/${receiptId}/download`, '_blank');
  };

  const handleViewReceipt = (receiptId: string) => {
    router.push(`/receipts/${receiptId}`);
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="flex items-center text-cyan-100 hover:text-white mr-4 mb-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Payment Receipts</h1>
              <p className="text-cyan-100 mt-2">
                View and download your payment receipts
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <Receipt className="h-6 w-6" />
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-b border-cyan-400 border-opacity-30 mt-6">
            <div className="flex space-x-8 overflow-x-auto">
              <Link
                href="/contracts"
                className="flex items-center space-x-2 py-3 px-1 border-b-2 border-transparent text-cyan-100 hover:text-white hover:border-cyan-200 font-medium text-sm whitespace-nowrap transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Contracts</span>
              </Link>
              <Link
                href="/invoices"
                className="flex items-center space-x-2 py-3 px-1 border-b-2 border-transparent text-cyan-100 hover:text-white hover:border-cyan-200 font-medium text-sm whitespace-nowrap transition-colors"
              >
                <DollarSign className="h-4 w-4" />
                <span>Invoices</span>
              </Link>
              <div className="flex items-center space-x-2 py-3 px-1 border-b-2 border-white text-white font-medium text-sm whitespace-nowrap">
                <Receipt className="h-4 w-4" />
                <span>Receipts</span>
              </div>
              <Link
                href="/estimates"
                className="flex items-center space-x-2 py-3 px-1 border-b-2 border-transparent text-cyan-100 hover:text-white hover:border-cyan-200 font-medium text-sm whitespace-nowrap transition-colors"
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-cyan-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Receipts</p>
                <p className="text-2xl font-bold text-gray-900">{receipts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-cyan-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${receipts.reduce((sum, receipt) => sum + receipt.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg">
                <Calendar className="h-6 w-6 text-cyan-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Last Payment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {receipts.length > 0 
                    ? new Date(Math.max(...receipts.map(r => new Date(r.payment_date).getTime()))).toLocaleDateString()
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Receipts List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
          </div>
          
          {receipts.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No payment receipts found</p>
              <p className="text-gray-400 text-sm mt-2">
                Payment receipts will appear here once payments are processed
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt
                    </th>
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
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {receipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              #{receipt.receipt_number}
                            </div>
                            {receipt.transaction_id && (
                              <div className="text-sm text-gray-500">
                                ID: {receipt.transaction_id}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">#{receipt.invoice_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{receipt.project_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${receipt.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPaymentMethodIcon(receipt.payment_method)}
                          <span className="ml-2 text-sm text-gray-900">
                            {getPaymentMethodLabel(receipt.payment_method)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {new Date(receipt.payment_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewReceipt(receipt.id)}
                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-xs flex items-center"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadReceipt(receipt.id)}
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
