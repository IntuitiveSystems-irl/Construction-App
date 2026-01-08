'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock,
  AlertCircle,
  ArrowLeft,
  CreditCard,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface Payment {
  id: string;
  payment_number: string;
  invoice_id?: string;
  amount: number;
  payment_date: string;
  due_date?: string;
  status: 'paid' | 'pending' | 'overdue' | 'scheduled';
  payment_method?: string;
  description: string;
  notes?: string;
  created_at: string;
}

export default function PaymentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'upcoming'>('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_URL}/api/payments`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      } else {
        setError('Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Error loading payments');
    } finally {
      setDataLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-cyan-600" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'scheduled':
        return <Calendar className="h-5 w-5 text-cyan-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-cyan-100 text-cyan-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterPayments = () => {
    const now = new Date();
    switch (activeTab) {
      case 'paid':
        return payments.filter(p => p.status === 'paid');
      case 'pending':
        return payments.filter(p => p.status === 'pending' || p.status === 'overdue');
      case 'upcoming':
        return payments.filter(p => p.status === 'scheduled' || (p.due_date && new Date(p.due_date) > now));
      default:
        return payments;
    }
  };

  const calculateTotals = () => {
    const paid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
    const pending = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
    const upcoming = payments.filter(p => p.status === 'scheduled').reduce((sum, p) => sum + p.amount, 0);
    return { paid, pending, upcoming };
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();
  const filteredPayments = filterPayments();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/dashboard"
            className="flex items-center text-cyan-100 hover:text-white mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-cyan-100 mt-2">
            Track and manage your payment history
          </p>
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
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">${totals.paid.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg">
                <Clock className="h-6 w-6 text-cyan-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">${totals.pending.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg">
                <Calendar className="h-6 w-6 text-cyan-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">${totals.upcoming.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Payments
              </button>
              <button
                onClick={() => setActiveTab('paid')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'paid'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upcoming'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upcoming
              </button>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white rounded-lg shadow">
          {filteredPayments.length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No payments found</p>
              <p className="text-gray-400 text-sm mt-2">
                {activeTab === 'all' ? 'You have no payment records yet' : `No ${activeTab} payments`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(payment.status)}
                        <h4 className="text-lg font-medium text-gray-900">
                          {payment.description}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-2">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {payment.payment_number}
                        </div>
                        {payment.payment_date && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Paid: {new Date(payment.payment_date).toLocaleDateString()}
                          </div>
                        )}
                        {payment.due_date && payment.status !== 'paid' && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Due: {new Date(payment.due_date).toLocaleDateString()}
                          </div>
                        )}
                        {payment.payment_method && (
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-1" />
                            {payment.payment_method}
                          </div>
                        )}
                      </div>

                      {payment.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <strong>Notes:</strong> {payment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-6 text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        ${payment.amount.toLocaleString()}
                      </p>
                    </div>
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
