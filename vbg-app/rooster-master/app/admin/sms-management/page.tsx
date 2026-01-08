'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { MessageSquare, Users, Send, CheckCircle, XCircle, Phone, Bell, TrendingUp } from 'lucide-react';

interface SMSStats {
  totalUsers: number;
  usersWithSMS: number;
  usersWithoutSMS: number;
  smsEnabledUsers: number;
  recentSMSSent: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  sms_notifications: boolean;
}

export default function SMSManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<SMSStats>({
    totalUsers: 0,
    usersWithSMS: 0,
    usersWithoutSMS: 0,
    smsEnabledUsers: 0,
    recentSMSSent: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading_data, setLoadingData] = useState(true);
  const [bulkMessage, setBulkMessage] = useState('🏗️ ROOSTER CONSTRUCTION\\n\\nImportant Update:\\n\\nPlease check your dashboard for new information.\\n\\nThank you!');
  const [sendingBulk, setSendingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);

  // Check if user is admin
  const isAdmin = user?.isAdmin || (user as any)?.is_admin;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchSMSData();
    }
  }, [isAdmin]);

  const fetchSMSData = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      // Fetch all users
      const usersResponse = await fetch(`${API_URL}/api/admin/users`, {
        credentials: 'include'
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
        
        // Calculate stats
        const totalUsers = usersData.length;
        const usersWithSMS = usersData.filter((u: User) => u.phone_number && u.phone_number.trim()).length;
        const usersWithoutSMS = totalUsers - usersWithSMS;
        const smsEnabledUsers = usersData.filter((u: User) => u.phone_number && u.sms_notifications).length;
        
        setStats({
          totalUsers,
          usersWithSMS,
          usersWithoutSMS,
          smsEnabledUsers,
          recentSMSSent: 0 // This would come from SMS logs in production
        });
      }
    } catch (error) {
      console.error('Error fetching SMS data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleBulkSMS = async () => {
    if (!bulkMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    setSendingBulk(true);
    setBulkResult(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/bulk-sms`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: bulkMessage,
          userIds: users.filter(u => u.phone_number && u.sms_notifications).map(u => u.id)
        })
      });

      const data = await response.json();
      setBulkResult(data);

    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      setBulkResult({ 
        success: false, 
        error: 'Failed to send bulk SMS: ' + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      setSendingBulk(false);
    }
  };

  if (loading || loading_data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-3xl font-bold">SMS Management</h1>
              <p className="text-purple-100 mt-2">Manage SMS notifications and user engagement</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Phone className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">With Phone Numbers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.usersWithSMS}</p>
                <p className="text-xs text-gray-500">{((stats.usersWithSMS / stats.totalUsers) * 100).toFixed(1)}% of users</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">SMS Enabled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.smsEnabledUsers}</p>
                <p className="text-xs text-gray-500">{((stats.smsEnabledUsers / stats.totalUsers) * 100).toFixed(1)}% of users</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Need Setup</p>
                <p className="text-2xl font-bold text-gray-900">{stats.usersWithoutSMS}</p>
                <p className="text-xs text-gray-500">{((stats.usersWithoutSMS / stats.totalUsers) * 100).toFixed(1)}% of users</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bulk SMS */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Send Bulk SMS</h3>
              <p className="text-sm text-gray-500 mt-1">Send message to all users with SMS enabled</p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your message..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Will be sent to {stats.smsEnabledUsers} users with SMS enabled
                </p>
              </div>

              <button
                onClick={handleBulkSMS}
                disabled={sendingBulk || !bulkMessage.trim()}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {sendingBulk ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {stats.smsEnabledUsers} Users
                  </>
                )}
              </button>

              {bulkResult && (
                <div className={`mt-4 p-4 rounded-md ${bulkResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center">
                    {bulkResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <p className={`text-sm font-medium ${bulkResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {bulkResult.success ? 'Bulk SMS sent successfully!' : 'Failed to send bulk SMS'}
                    </p>
                  </div>
                  {bulkResult.error && (
                    <p className="text-red-700 text-sm mt-1">{bulkResult.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User SMS Status */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">User SMS Status</h3>
              <p className="text-sm text-gray-500 mt-1">Overview of user SMS settings</p>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.phone_number && (
                        <p className="text-xs text-gray-400">{user.phone_number}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.phone_number ? (
                        user.sms_notifications ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            SMS Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Phone className="h-3 w-3 mr-1" />
                            SMS Disabled
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          No Phone
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-2">FREE SMS System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">How it works:</h4>
              <ul className="space-y-1">
                <li>• Uses email-to-SMS gateways</li>
                <li>• Completely free (no API costs)</li>
                <li>• Supports all major US carriers</li>
                <li>• ~30 second delivery time</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Automatic SMS triggers:</h4>
              <ul className="space-y-1">
                <li>• Job site assignments</li>
                <li>• Safety alerts</li>
                <li>• Schedule changes</li>
                <li>• Weather alerts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
