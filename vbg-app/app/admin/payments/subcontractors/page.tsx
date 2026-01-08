'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  DollarSign,
  Send,
  ArrowLeft,
  Plus,
  CheckCircle,
  Clock,
  User,
  Mail,
  Calendar,
  Briefcase
} from 'lucide-react';

interface SubcontractorPayment {
  id: string;
  payment_number: string;
  subcontractor_name: string;
  subcontractor_email: string;
  project_name: string;
  amount: number;
  status: 'pending' | 'sent' | 'completed';
  due_date: string;
  sent_date?: string;
  completed_date?: string;
  description: string;
}

export default function SubcontractorPaymentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<SubcontractorPayment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [newPayment, setNewPayment] = useState({
    subcontractor_email: '',
    project_name: '',
    amount: '',
    description: '',
    due_date: ''
  });

  useEffect(() => {
    if (!loading && (!user || !(user as any).is_admin)) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && (user as any).is_admin) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/subcontractor-payments`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSendPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/subcontractor-payments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayment)
      });

      if (response.ok) {
        setShowNewPaymentForm(false);
        setNewPayment({ subcontractor_email: '', project_name: '', amount: '', description: '', due_date: '' });
        fetchPayments();
      }
    } catch (error) {
      console.error('Error sending payment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      sent: 'bg-cyan-100 text-cyan-700',
      completed: 'bg-green-100 text-green-700'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700';
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
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
                <h1 className="text-3xl font-bold text-white">Pay Subcontractors</h1>
                <p className="text-cyan-100 mt-1">Manage subcontractor payments</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewPaymentForm(!showNewPaymentForm)}
              className="bg-white text-cyan-600 px-6 py-3 rounded-lg font-semibold hover:bg-cyan-50 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>New Payment</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Payment Form */}
        {showNewPaymentForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-700 mb-6">Send Payment to Subcontractor</h3>
            <form onSubmit={handleSendPayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcontractor Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={newPayment.subcontractor_email}
                      onChange={(e) => setNewPayment({ ...newPayment, subcontractor_email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="subcontractor@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={newPayment.project_name}
                      onChange={(e) => setNewPayment({ ...newPayment, project_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="Project name"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Due Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={newPayment.due_date}
                      onChange={(e) => setNewPayment({ ...newPayment, due_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={newPayment.description}
                  onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="What is this payment for?"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500 text-white px-6 py-3 rounded-lg hover:bg-cyan-600 transition-colors font-semibold flex items-center justify-center space-x-2"
                >
                  <Send className="h-5 w-5" />
                  <span>Send Payment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewPaymentForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Payments List */}
        {payments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Payments Yet</h3>
            <p className="text-gray-500">Click "New Payment" to send your first subcontractor payment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {payments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-700">#{payment.payment_number}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(payment.status)}`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-lg font-medium text-gray-700 mb-2">{payment.project_name}</p>
                    <p className="text-gray-600 mb-4">{payment.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 flex items-center mb-1">
                          <User className="h-4 w-4 mr-1" />
                          Subcontractor
                        </span>
                        <p className="font-medium text-gray-700">{payment.subcontractor_name}</p>
                        <p className="text-gray-600">{payment.subcontractor_email}</p>
                      </div>

                      <div>
                        <span className="text-gray-500 flex items-center mb-1">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Amount
                        </span>
                        <p className="text-2xl font-bold text-gray-700">${payment.amount.toLocaleString()}</p>
                      </div>

                      <div>
                        <span className="text-gray-500 flex items-center mb-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due Date
                        </span>
                        <p className="font-medium text-gray-700">
                          {new Date(payment.due_date).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500 flex items-center mb-1">
                          <Clock className="h-4 w-4 mr-1" />
                          {payment.status === 'completed' ? 'Completed' : 'Sent'}
                        </span>
                        <p className="font-medium text-gray-700">
                          {payment.completed_date 
                            ? new Date(payment.completed_date).toLocaleDateString()
                            : payment.sent_date 
                              ? new Date(payment.sent_date).toLocaleDateString()
                              : 'Pending'}
                        </p>
                      </div>
                    </div>

                    {payment.completed_date && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm text-green-800">
                          Payment completed on {new Date(payment.completed_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {payment.status === 'pending' && (
                    <button className="ml-6 text-cyan-600 hover:text-cyan-700 font-semibold">
                      Send Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
