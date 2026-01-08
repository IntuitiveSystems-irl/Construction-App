'use client'

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Bell, 
  BellOff, 
  Save, 
  Mail,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Briefcase,
  Megaphone,
  CheckCircle
} from 'lucide-react';

interface NotificationPreferences {
  job_assignments: boolean;
  job_updates: boolean;
  safety_alerts: boolean;
  schedule_changes: boolean;
  general_messages: boolean;
  admin_announcements: boolean;
}

export default function NotificationPreferencesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    job_assignments: true,
    job_updates: true,
    safety_alerts: true,
    schedule_changes: true,
    general_messages: true,
    admin_announcements: true
  });
  
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchPreferences();
    }
  }, [user, loading, router]);

  const fetchPreferences = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/user/notification-preferences`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreferences({
          job_assignments: data.job_assignments === 1 || data.job_assignments === true,
          job_updates: data.job_updates === 1 || data.job_updates === true,
          safety_alerts: data.safety_alerts === 1 || data.safety_alerts === true,
          schedule_changes: data.schedule_changes === 1 || data.schedule_changes === true,
          general_messages: data.general_messages === 1 || data.general_messages === true,
          admin_announcements: data.admin_announcements === 1 || data.admin_announcements === true
        });
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/user/notification-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const notificationTypes = [
    {
      key: 'job_assignments' as keyof NotificationPreferences,
      title: 'Job Assignments',
      description: 'Get notified when you are assigned to new job sites',
      icon: <Briefcase className="h-5 w-5" />,
      color: 'text-blue-500'
    },
    {
      key: 'job_updates' as keyof NotificationPreferences,
      title: 'Job Updates',
      description: 'Receive updates about job site progress and changes',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'text-green-500'
    },
    {
      key: 'safety_alerts' as keyof NotificationPreferences,
      title: 'Safety Alerts',
      description: 'Important safety notifications and requirements',
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'text-red-500'
    },
    {
      key: 'schedule_changes' as keyof NotificationPreferences,
      title: 'Schedule Changes',
      description: 'Notifications about schedule updates and timeline changes',
      icon: <Calendar className="h-5 w-5" />,
      color: 'text-purple-500'
    },
    {
      key: 'general_messages' as keyof NotificationPreferences,
      title: 'General Messages',
      description: 'General communications and project messages',
      icon: <Mail className="h-5 w-5" />,
      color: 'text-gray-500'
    },
    {
      key: 'admin_announcements' as keyof NotificationPreferences,
      title: 'Admin Announcements',
      description: 'Company-wide announcements and important notices',
      icon: <Megaphone className="h-5 w-5" />,
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center">
            <Link 
              href="/profile" 
              className="mr-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center">
              <Bell className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Notification Preferences</h1>
                <p className="text-orange-100 mt-2">Manage your email notification settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Email Notifications</h2>
              {saved && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">Preferences saved!</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 mt-2">
              Choose which types of email notifications you want to receive. All notifications are sent to: <strong>{user?.email}</strong>
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {notificationTypes.map((type) => (
                <div key={type.key} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start">
                    <div className={`${type.color} mr-4 mt-1`}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{type.title}</h3>
                      <p className="text-gray-600 mt-1">{type.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center ml-4">
                    <button
                      onClick={() => updatePreference(type.key, !preferences[type.key])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                        preferences[type.key] ? 'bg-orange-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferences[type.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="ml-3 text-sm text-gray-500">
                      {preferences[type.key] ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <p>Changes are saved automatically when you toggle settings.</p>
                  <p className="mt-1">You can update these preferences at any time.</p>
                </div>
                
                <button
                  onClick={savePreferences}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <Mail className="h-6 w-6 text-blue-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-blue-900">About Email Notifications</h3>
              <div className="mt-2 text-blue-800">
                <p>• All notifications are sent via email only (SMS has been disabled)</p>
                <p>• Safety alerts are highly recommended to keep enabled</p>
                <p>• You can change these settings at any time from your profile</p>
                <p>• Disabling notifications may cause you to miss important updates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
