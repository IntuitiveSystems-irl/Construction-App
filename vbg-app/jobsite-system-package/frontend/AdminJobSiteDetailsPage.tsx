'use client'

import { useAuth } from '../../app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  DollarSign, 
  FileText, 
  ArrowLeft, 
  Phone, 
  Mail, 
  Building,
  MessageSquare,
  Send,
  AlertTriangle,
  Info,
  CheckCircle,
  Users,
  Edit,
  Plus,
  Settings,
  Trash2
} from 'lucide-react';

interface JobSite {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: string;
  client_name: string;
  project_manager: string;
  notes: string;
  safety_requirements: string;
  created_at: string;
}

interface JobSiteMessage {
  id: number;
  message: string;
  message_type: string;
  priority: string;
  created_at: string;
  admin_name: string;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  user_type: string;
  assigned_date: string;
}

export default function AdminJobSiteDetailsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobSiteId = params.id as string;
  
  const [jobSite, setJobSite] = useState<JobSite | null>(null);
  const [messages, setMessages] = useState<JobSiteMessage[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState('update');
  const [priority, setPriority] = useState('normal');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Check if user is admin
  const isAdmin = user?.isAdmin || (user as any)?.is_admin;

  const fetchJobSiteDetails = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      // Fetch job site details (admin endpoint)
      const jobSiteResponse = await fetch(`${API_URL}/api/admin/job-sites/${jobSiteId}`, {
        credentials: 'include'
      });
      
      if (jobSiteResponse.ok) {
        const jobSiteData = await jobSiteResponse.json();
        setJobSite(jobSiteData);
      }

      // Fetch job site messages (admin endpoint)
      const messagesResponse = await fetch(`${API_URL}/api/admin/job-sites/${jobSiteId}/messages`, {
        credentials: 'include'
      });
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      }

      // Fetch team members (admin endpoint)
      const teamResponse = await fetch(`${API_URL}/api/admin/job-sites/${jobSiteId}/assignments`, {
        credentials: 'include'
      });
      
      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeamMembers(teamData);
      }

    } catch (error) {
      console.error('Error fetching job site details:', error);
    } finally {
      setDataLoading(false);
    }
  }, [jobSiteId]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (!loading && !isAdmin) {
      router.push('/dashboard');
      return;
    }

    if (user && jobSiteId && isAdmin) {
      fetchJobSiteDetails();
    }
  }, [user, loading, router, jobSiteId, isAdmin, fetchJobSiteDetails]);



  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/job-sites/${jobSiteId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: newMessage,
          message_type: messageType,
          priority: priority,
          send_sms: false // Email only
        })
      });

      if (response.ok) {
        setNewMessage('');
        fetchJobSiteDetails(); // Refresh messages
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-primary-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-primary-500 bg-primary-50';
      default:
        return 'border-l-green-500 bg-green-50';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'safety':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'update':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'question':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

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

  if (!jobSite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Site Not Found</h1>
          <Link href="/admin/job-sites" className="text-orange-600 hover:text-orange-700">
            ← Back to Job Sites
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link 
                href="/admin/job-sites" 
                className="mr-4 p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold">{jobSite.name}</h1>
                <p className="text-orange-100 mt-2">{jobSite.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                jobSite.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : jobSite.status === 'completed'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-primary-100 text-primary-800'
              }`}>
                {jobSite.status.charAt(0).toUpperCase() + jobSite.status.slice(1)}
              </div>
              <button className="p-2 rounded-full hover:bg-white/20 transition-colors">
                <Edit className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Site Details */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Job Site Information</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Location</p>
                        <p className="text-gray-900">{jobSite.address}</p>
                        <p className="text-gray-600">{jobSite.city}, {jobSite.state} {jobSite.zip_code}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Duration</p>
                        <p className="text-gray-900">
                          {new Date(jobSite.start_date).toLocaleDateString()} - {new Date(jobSite.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Client</p>
                        <p className="text-gray-900">{jobSite.client_name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Project Manager</p>
                        <p className="text-gray-900">{jobSite.project_manager}</p>
                      </div>
                    </div>

                    {jobSite.budget && (
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Budget</p>
                          <p className="text-gray-900">${jobSite.budget.toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Created</p>
                        <p className="text-gray-900">{new Date(jobSite.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {jobSite.safety_requirements && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-red-800">Safety Requirements</h3>
                        <p className="text-red-700 mt-1">{jobSite.safety_requirements}</p>
                      </div>
                    </div>
                  </div>
                )}

                {jobSite.notes && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-blue-800">Notes</h3>
                        <p className="text-blue-700 mt-1">{jobSite.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Messages and Updates */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Messages & Updates</h2>
              </div>
              <div className="p-6">
                {messages.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`border-l-4 p-4 rounded-r-lg ${getPriorityColor(message.priority)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            {getMessageTypeIcon(message.message_type)}
                            <span className="ml-2 text-sm font-medium text-gray-600">
                              {message.message_type.charAt(0).toUpperCase() + message.message_type.slice(1)}
                            </span>
                            {getPriorityIcon(message.priority)}
                            <span className="ml-1 text-sm text-gray-500">
                              {message.priority} priority
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(message.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-800">{message.message}</p>
                        <p className="mt-2 text-sm text-gray-600">
                          From: {message.admin_name}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No messages or updates yet.</p>
                )}

                {/* Send Message */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Send Message to Team</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                        <select
                          value={messageType}
                          onChange={(e) => setMessageType(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="update">Update</option>
                          <option value="safety">Safety Alert</option>
                          <option value="question">Question</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="normal">Normal</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Enter your message..."
                        rows={3}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={sendingMessage || !newMessage.trim()}
                        className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {sendingMessage ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Team Members ({teamMembers.length})
                  </h3>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {teamMembers.length > 0 ? (
                  <div className="space-y-4">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.role || member.user_type}</p>
                          <p className="text-xs text-gray-400">
                            Assigned: {new Date(member.assigned_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <a 
                            href={`mailto:${member.email}`}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No team members assigned yet.</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Admin Actions</h3>
              </div>
              <div className="p-6 space-y-3">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center">
                  <Edit className="h-4 w-4 mr-3" />
                  Edit Job Site
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center">
                  <Plus className="h-4 w-4 mr-3" />
                  Add Team Member
                </button>
                <button 
                  onClick={() => router.push(`/admin/documents?jobSiteId=${jobSiteId}`)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center"
                >
                  <FileText className="h-4 w-4 mr-3" />
                  Manage Documents
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center">
                  <Settings className="h-4 w-4 mr-3" />
                  Job Site Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
