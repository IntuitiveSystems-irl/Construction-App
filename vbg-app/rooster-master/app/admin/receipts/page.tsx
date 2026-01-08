
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AdminHeader from '../../components/AdminHeader';
import { 
  Receipt, 
  Plus, 
  Eye, 
  Download,
  CheckCircle, 
  CreditCard,
  DollarSign,
  Calendar,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';

interface PaymentReceipt {
  id: string;
  receipt_number: string;
  client_name: string;
  client_email: string;
  invoice_id: string;
  invoice_number: string;
  project_name: string;
  amount: number;
  payment_method: 'credit_card' | 'bank_transfer' | 'check' | 'cash';
  payment_date: string;
  transaction_id?: string;
  notes?: string;
}

export default function AdminReceiptsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.isAdmin) {
      fetchReceipts();
    }
  }, [user]);

  const fetchReceipts = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(`${API_URL}/api/admin/receipts`, {
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
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'bank_transfer':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'check':
        return <Receipt className="h-4 w-4 text-purple-600" />;
      case 'cash':
        return <DollarSign className="h-4 w-4 text-yellow-600" />;
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

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = 
      receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPaymentMethod = paymentMethodFilter === 'all' || receipt.payment_method === paymentMethodFilter;
    
    return matchesSearch && matchesPaymentMethod;
  });

  const totalAmount = filteredReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const paymentMethodStats = filteredReceipts.reduce((acc, receipt) => {
    acc[receipt.payment_method] = (acc[receipt.payment_method] || 0) + receipt.amount;
    return acc;
  }, {} as Record<string, number>);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader 
        title="Receipt Management" 
        subtitle="Track and manage payment receipts"
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
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Receipts</p>
                <p className="text-2xl font-bold text-gray-900">{filteredReceipts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">${totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Card Payments</p>
                <p className="text-2xl font-bold text-gray-900">${(paymentMethodStats.credit_card || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredReceipts.filter(r => {
                    const receiptDate = new Date(r.payment_date);
                    const now = new Date();
                    return receiptDate.getMonth() === now.getMonth() && receiptDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
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
                  placeholder="Search receipts..."
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
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Methods</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              
              <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Receipt</span>
              </button>
            </div>
          </div>
        </div>

        {/* Receipts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
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
                {filteredReceipts.map((receipt) => (
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
                      <div className="text-sm text-gray-900">{receipt.client_name}</div>
                      <div className="text-sm text-gray-500">{receipt.client_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">#{receipt.invoice_number}</div>
                      <div className="text-sm text-gray-500">{receipt.project_name}</div>
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
                        <button className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-xs flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </button>
                        <button className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-xs flex items-center">
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredReceipts.length === 0 && (
            <div className="p-8 text-center">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No receipts found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || paymentMethodFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Payment receipts will appear here once processed'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
