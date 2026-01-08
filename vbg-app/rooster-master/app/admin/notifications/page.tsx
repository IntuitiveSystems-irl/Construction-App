'use client'

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Bell, 
  BellOff, 
  Users, 
  Search,
  Filter,
  Mail,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Briefcase,
  Megaphone,
  CheckCircle,
  X,
  Eye
} from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  user_type: string;
}

interface NotificationPreferences {
  user_id: number;
  name: string;
  email: string;
  job_assignments: boolean;
  job_updates: boolean;
  safety_alerts: boolean;
  schedule_changes: boolean;
  general_messages: boolean;
  admin_announcements: boolean;
}

export default function AdminNotificationManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPreferences, setUserPreferences] = useState<NotificationPreferences | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  // Check if user is admin
  const isAdmin = user?.isAdmin || (user as any)?.is_admin;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (!loading && !isAdmin) {
      router.push('/dashboard');
      return;
    }

    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, loading, router, isAdmin]);

  const fetchUsers = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/users`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchUserPreferences = async (userId: number) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/notification-preferences/${userId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserPreferences({
          ...data,
          job_assignments: data.job_assignments === 1 || data.job_assignments === true,
          job_updates: data.job_updates === 1 || data.job_updates === true,
          safety_alerts: data.safety_alerts === 1 || data.safety_alerts === true,
          schedule_changes: data.schedule_changes === 1 || data.schedule_changes === true,
          general_messages: data.general_messages === 1 || data.general_messages === true,
          admin_announcements: data.admin_announcements === 1 || data.admin_announcements === true
        });
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  const openPreferencesModal = async (user: User) => {
    setSelectedUser(user);
    setShowPreferencesModal(true);
    await fetchUserPreferences(user.id);
  };

  const closePreferencesModal = () => {
    setShowPreferencesModal(false);
    setSelectedUser(null);
    setUserPreferences(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || user.user_type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admin access required.</p>
        </div>
      </div>
    );
  }

  const notificationTypes = [
    {
      key: 'job_assignments' as keyof NotificationPreferences,
      title: 'Job Assignments',
      icon: <Briefcase className="h-4 w-4" />,
      color: 'text-blue-500'
    },
    {
      key: 'job_updates' as keyof NotificationPreferences,
      title: 'Job Updates',
      icon: <MessageSquare className="h-4 w-4" />,
      color: 'text-green-500'
    },
    {
      key: 'safety_alerts' as keyof NotificationPreferences,
      title: 'Safety Alerts',
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-red-500'
    },
    {
      key: 'schedule_changes' as keyof NotificationPreferences,
      title: 'Schedule Changes',
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-purple-500'
    },
    {
      key: 'general_messages' as keyof NotificationPreferences,
      title: 'General Messages',
      icon: <Mail className="h-4 w-4" />,
      color: 'text-gray-500'
    },
    {
      key: 'admin_announcements' as keyof NotificationPreferences,
      title: 'Admin Announcements',
      icon: <Megaphone className="h-4 w-4" />,
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center">
            <Link 
              href="/admin" 
              className="mr-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center">
              <Bell className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Notification Management</h1>
                <p className="text-orange-100 mt-2">Manage user notification preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Users</option>
                  <option value="client">Clients</option>
                  <option value="subcontractor">Subcontractors</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Users ({filteredUsers.length})
              </h2>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.user_type === 'client' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.user_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openPreferencesModal(user)}
                        className="text-orange-600 hover:text-orange-900 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Preferences
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferencesModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Notification Preferences - {selectedUser.name}
              </h3>
              <button
                onClick={closePreferencesModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                This user&apos;s notification preferences are shown below. These settings control which email notifications they receive.
              </p>
            </div>

            {userPreferences ? (
              <div className="space-y-4">
                {notificationTypes.map((type) => (
                  <div key={type.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className={`${type.color} mr-3`}>
                        {type.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{type.title}</span>
                    </div>
                    <div className="flex items-center">
                      {userPreferences[type.key] ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="text-sm">Enabled</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <BellOff className="h-4 w-4 mr-1" />
                          <span className="text-sm">Disabled</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={closePreferencesModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
