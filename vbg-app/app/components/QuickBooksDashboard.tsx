'use client'

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  DollarSign, 
  FileCheck, 
  Briefcase, 
  Mail, 
  Settings,
  TrendingUp,
  ChevronDown,
  CreditCard,
  Package,
  Upload,
  Calendar,
  Send,
  UserCog,
  Bell,
  ClipboardList,
  X,
  Database
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  href: string;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function QuickBooksDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  // Determine user type
  const isAdmin = user?.is_admin || user?.isAdmin;
  const userType = (user as any)?.user_type || 'client';
  
  // Client-facing actions
  const clientActions: QuickAction[] = [
    {
      id: 'estimates',
      title: 'Estimates',
      icon: <ClipboardList className="h-10 w-10" />,
      href: '/estimates'
    },
    {
      id: 'invoices',
      title: 'Invoices',
      icon: <FileText className="h-10 w-10" />,
      href: '/invoices'
    },
    {
      id: 'schedule',
      title: 'Schedule an Appointment',
      icon: <Calendar className="h-10 w-10" />,
      href: '/schedule'
    },
    {
      id: 'contracts',
      title: 'Contracts',
      icon: <Briefcase className="h-10 w-10" />,
      href: '/contracts'
    }
  ];

  // Subcontractor actions
  const subcontractorActions: QuickAction[] = [
    {
      id: 'upload-documents',
      title: 'Upload Documents',
      icon: <Upload className="h-10 w-10" />,
      href: '/document'
    },
    {
      id: 'schedule',
      title: 'Schedule Appointment',
      icon: <Calendar className="h-10 w-10" />,
      href: '/schedule'
    },
    {
      id: 'contracts',
      title: 'Contracts',
      icon: <Briefcase className="h-10 w-10" />,
      href: '/contracts'
    },
    {
      id: 'invoices',
      title: 'Invoices',
      icon: <FileText className="h-10 w-10" />,
      href: '/invoices'
    },
    {
      id: 'job-sites',
      title: 'Job Sites',
      icon: <Package className="h-10 w-10" />,
      href: '/job-sites'
    },
    {
      id: 'profile',
      title: 'My Profile',
      icon: <UserCog className="h-10 w-10" />,
      href: '/profile'
    }
  ];

  // Admin actions
  const adminActions: QuickAction[] = [
    {
      id: 'send-contract',
      title: 'Send Contract (Guest)',
      icon: <Briefcase className="h-10 w-10" />,
      href: '/admin/send-contract-guest'
    },
    {
      id: 'job-sites',
      title: 'Job Sites',
      icon: <Package className="h-10 w-10" />,
      href: '/admin/job-sites'
    },
    {
      id: 'send-estimate',
      title: 'Send Estimate',
      icon: <Send className="h-10 w-10" />,
      href: '/admin/estimates'
    },
    {
      id: 'send-invoice',
      title: 'Send Invoice',
      icon: <FileText className="h-10 w-10" />,
      href: '/admin/invoices'
    },
    {
      id: 'edit-users',
      title: 'Edit User Profiles',
      icon: <UserCog className="h-10 w-10" />,
      href: '/admin/users'
    },
    {
      id: 'contracts',
      title: 'Generate Contract',
      icon: <Briefcase className="h-10 w-10" />,
      href: '/generate-contract'
    },
    {
      id: 'contract-templates',
      title: 'Contract Templates',
      icon: <FileText className="h-10 w-10" />,
      href: '/admin/contract-templates'
    },
    {
      id: 'documents',
      title: 'Manage Documents',
      icon: <FileCheck className="h-10 w-10" />,
      href: '/admin/documents'
    },
    {
      id: 'crm',
      title: 'CRM Dashboard',
      icon: <Database className="h-10 w-10" />,
      href: '/admin/crm-integrated'
    }
  ];

  // Select actions based on user type
  const quickActions = isAdmin 
    ? adminActions 
    : userType === 'subcontractor' 
      ? subcontractorActions 
      : clientActions;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_URL}/api/notifications`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      // Remove from local state
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section with Cyan Background */}
      <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-2xl mx-4 sm:mx-6 lg:mx-8 mt-8 px-8 py-12 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">
            Welcome, {user.name || 'User'}
          </h1>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Quick Actions Grid - 3x2 */}
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-4">
                {quickActions.map((action) => (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="bg-white rounded-xl p-8 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col items-center justify-center text-center min-h-[140px]"
                  >
                    <div className="text-gray-700 mb-3">
                      {action.icon}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {action.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Account Balance Card - Temporarily removed */}
            {/* {!isAdmin && (
              <div className="lg:w-80">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none">
                    <option>All Jobs</option>
                    <option>Active Jobs</option>
                    <option>Completed Jobs</option>
                  </select>
                  
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Balance:</p>
                    <p className="text-4xl font-bold text-gray-900">${balance}</p>
                  </div>

                  <button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <CreditCard className="h-5 w-5" />
                    MAKE A PAYMENT
                  </button>
                </div>
              </div>
            )} */}

            {/* Admin Quick Actions Card */}
            {isAdmin && (
              <div className="lg:w-80">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link href="/admin/invoices" className="block w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-all shadow-md hover:shadow-lg">
                      Approve Invoices
                    </Link>
                    <Link href="/admin/estimates" className="block w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-4 rounded-lg text-center transition-all shadow-md hover:shadow-lg">
                      Approve Estimates
                    </Link>
                    <Link href="/admin/contract-templates?create=true" className="block w-full bg-cyan-700 hover:bg-cyan-800 text-white font-semibold py-3 px-4 rounded-lg text-center transition-all shadow-md hover:shadow-lg">
                      Create Template
                    </Link>
                    <Link href="/generate-contract" className="block w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-4 rounded-lg text-center transition-all shadow-md hover:shadow-lg">
                      Generate Contract
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="h-6 w-6 text-cyan-600" />
              Notifications
            </h2>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                {notifications.filter(n => !n.read).length} New
              </span>
            )}
          </div>

          {loadingNotifications ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">No notifications yet</p>
              <p className="text-sm text-gray-500">You'll see updates about documents, invoices, and estimates here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all ${
                    notification.read
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-cyan-50 border-cyan-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-cyan-600 rounded-full"></span>
                        )}
                      </div>
                      <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {notifications.length > 10 && (
                <div className="text-center pt-4">
                  <Link href="/notifications" className="text-cyan-600 hover:text-cyan-700 font-medium text-sm">
                    View all notifications →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
