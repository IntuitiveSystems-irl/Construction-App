'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Clock, FileText, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://31.97.144.132:4000';

interface Document {
  id: string;
  original_name: string;
  document_type: string;
  expires_at: string;
  uploaded_at: string;
}

interface ExpirationMonitorProps {
  onDocumentClick?: (docId: string) => void;
}

export default function ExpirationMonitor({ onDocumentClick }: ExpirationMonitorProps) {
  const { user } = useAuth();
  const [expiringDocs, setExpiringDocs] = useState<Document[]>([]);
  const [expiredDocs, setExpiredDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpirationData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch expiring documents (next 30 days)
      const expiringResponse = await fetch(
        `${API_URL}/api/documents/expiring?user_id=${user.id}&days=30`,
        { credentials: 'include' }
      );
      
      // Fetch expired documents
      const expiredResponse = await fetch(
        `${API_URL}/api/documents/expired?user_id=${user.id}`,
        { credentials: 'include' }
      );

      if (expiringResponse.ok) {
        const expiringData = await expiringResponse.json();
        setExpiringDocs(expiringData);
      }

      if (expiredResponse.ok) {
        const expiredData = await expiredResponse.json();
        setExpiredDocs(expiredData);
      }
    } catch (error) {
      console.error('Error fetching expiration data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchExpirationData();
    }
  }, [user, fetchExpirationData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilExpiration = (expiresAt: string) => {
    const expDate = new Date(expiresAt);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'insurance': return 'Insurance Form';
      case 'w9': return 'W9 Form';
      case 'contract': return 'Contract';
      case 'invoice': return 'Invoice';
      case 'receipt': return 'Receipt';
      default: return 'Document';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const totalAlerts = expiredDocs.length + expiringDocs.length;

  if (totalAlerts === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Clock className="h-5 w-5 text-green-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Document Expiration Monitor</h3>
        </div>
        <div className="text-center py-4">
          <div className="text-green-500 mb-2">
            <Calendar className="h-8 w-8 mx-auto" />
          </div>
          <p className="text-sm text-gray-500">All documents are up to date!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Document Expiration Monitor</h3>
        </div>
        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {totalAlerts} Alert{totalAlerts !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {/* Expired Documents */}
        {expiredDocs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Expired Documents ({expiredDocs.length})
            </h4>
            <div className="space-y-2">
              {expiredDocs.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100"
                  onClick={() => onDocumentClick?.(doc.id)}
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-red-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                        {doc.original_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getDocumentTypeLabel(doc.document_type)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-red-600">EXPIRED</p>
                    <p className="text-xs text-gray-500">{formatDate(doc.expires_at)}</p>
                  </div>
                </div>
              ))}
              {expiredDocs.length > 3 && (
                <p className="text-xs text-gray-500 text-center">
                  +{expiredDocs.length - 3} more expired documents
                </p>
              )}
            </div>
          </div>
        )}

        {/* Expiring Soon Documents */}
        {expiringDocs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-orange-600 mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Expiring Soon ({expiringDocs.length})
            </h4>
            <div className="space-y-2">
              {expiringDocs.slice(0, 3).map((doc) => {
                const daysLeft = getDaysUntilExpiration(doc.expires_at);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100"
                    onClick={() => onDocumentClick?.(doc.id)}
                  >
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-orange-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                          {doc.original_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getDocumentTypeLabel(doc.document_type)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-orange-600">
                        {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(doc.expires_at)}</p>
                    </div>
                  </div>
                );
              })}
              {expiringDocs.length > 3 && (
                <p className="text-xs text-gray-500 text-center">
                  +{expiringDocs.length - 3} more expiring documents
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => window.location.href = '/document'}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All Documents →
        </button>
      </div>
    </div>
  );
}
