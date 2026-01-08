'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Download, DollarSign, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: number;
  invoice_number: string;
  project_name: string;
  amount: string;
  description: string;
  status: string;
  issue_date: string;
  due_date: string;
  created_at: string;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      fetchInvoice();
    }
  }, [user, params.id]);

  const fetchInvoice = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_URL}/api/invoices/${params.id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }

      const data = await response.json();
      setInvoice(data);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      paid: 'bg-green-100 text-green-700 border-green-300',
      overdue: 'bg-red-100 text-red-700 border-red-300'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">{error || 'Invoice not found'}</p>
            <Link href="/invoices" className="mt-4 inline-block text-cyan-600 hover:text-cyan-700">
              Back to Invoices
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/invoices"
            className="inline-flex items-center text-cyan-600 hover:text-cyan-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Details</h1>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-8 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">{invoice.invoice_number}</h2>
                <p className="text-cyan-100">{invoice.project_name}</p>
              </div>
              <div className={`px-4 py-2 rounded-full border-2 font-semibold ${getStatusBadge(invoice.status)}`}>
                {invoice.status.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-6">
            {/* Amount */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-cyan-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ${parseFloat(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Issue Date</p>
                  <p className="text-gray-900">{new Date(invoice.issue_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Due Date</p>
                  <p className="text-gray-900">{new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {invoice.description && (
              <div>
                <div className="flex items-start space-x-3 mb-2">
                  <FileText className="h-5 w-5 text-gray-400 mt-1" />
                  <p className="text-sm font-medium text-gray-600">Description</p>
                </div>
                <p className="text-gray-700 ml-8">{invoice.description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-6 border-t border-gray-200">
              {invoice.status === 'pending' && (
                <div className="mb-4 bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                  <p className="text-sm text-cyan-700">
                    <strong>Note:</strong> Online payment processing is coming soon. Please contact us for payment arrangements.
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                {invoice.status === 'pending' && (
                  <button 
                    disabled
                    className="flex-1 bg-gray-300 text-gray-500 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
                  >
                    Pay Invoice (Coming Soon)
                  </button>
                )}
                <button className="flex-1 sm:flex-initial border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center">
                  <Download className="h-5 w-5 mr-2" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
