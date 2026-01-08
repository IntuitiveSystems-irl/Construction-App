'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Mail, Phone, Send, X, MessageSquare, Search, Filter, 
  Users, Building, Calendar, ExternalLink, CheckSquare,
  MoreVertical, Edit, Trash2, UserPlus
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  userType?: string;
  createdAt: string;
  verified?: boolean;
}

export default function IntegratedCRMPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [callDuration, setCallDuration] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [savingCall, setSavingCall] = useState(false);
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'client' | 'subcontractor'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const API_URL = '';

  // Fetch contacts from VBG backend (which will fetch from Twenty CRM)
  useEffect(() => {
    if (!authLoading) {
      fetchContacts();
    }
  }, [authLoading]);

  // Filter contacts based on search and user type
  useEffect(() => {
    let filtered = contacts;
    
    // Filter by user type
    if (userTypeFilter !== 'all') {
      filtered = filtered.filter((c) => {
        if (userTypeFilter === 'client') {
          return c.userType === 'client' || !c.userType;
        } else if (userTypeFilter === 'subcontractor') {
          return c.userType === 'subcontractor';
        }
        return true;
      });
    }
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.company?.toLowerCase().includes(query) ||
          c.phone?.includes(query)
      );
    }
    
    setFilteredContacts(filtered);
  }, [searchQuery, contacts, userTypeFilter]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/crm/contacts`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data);
        setFilteredContacts(data);
      } else if (response.status === 401) {
        console.error('Unauthorized - redirecting to login');
        router.push('/login');
      } else {
        console.error('Failed to fetch contacts:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map((c) => c.id)));
    }
  };

  const handleBulkEmail = () => {
    if (selectedContacts.size === 0) {
      alert('Please select at least one contact');
      return;
    }
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody) return;

    setSendingEmail(true);
    try {
      const recipients = filteredContacts
        .filter((c) => selectedContacts.has(c.id))
        .map((c) => ({
          email: c.email,
          name: c.name,
          contactId: c.id,
        }));

      const response = await fetch(`${API_URL}/api/admin/send-bulk-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipients,
          subject: emailSubject,
          body: emailBody,
        }),
      });

      if (response.ok) {
        alert(`Email sent successfully to ${recipients.length} contact(s)!`);
        setShowEmailModal(false);
        setEmailSubject('');
        setEmailBody('');
        setSelectedContacts(new Set());
      } else {
        alert('Failed to send email');
      }
    } catch (error) {
      alert('Error sending email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleLogCall = async (contact: Contact) => {
    if (!callNotes) return;

    setSavingCall(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/crm/log-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contactId: contact.id,
          duration: callDuration,
          notes: callNotes,
        }),
      });

      if (response.ok) {
        alert('Call logged successfully!');
        setShowCallModal(false);
        setCallNotes('');
        setCallDuration('');
      } else {
        alert('Failed to log call');
      }
    } catch (error) {
      alert('Error logging call');
    } finally {
      setSavingCall(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-700">CRM</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage contacts and communications
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.open('https://crm.veribuilds.com', '_blank')}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Full CRM
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add New
              </button>
              {selectedContacts.size > 0 && (
                <>
                  <span className="text-sm text-gray-600">
                    {selectedContacts.size} selected
                  </span>
                  <button
                    onClick={handleBulkEmail}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Send Email
                  </button>
                </>
              )}
              <button
                onClick={fetchContacts}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
              >
                Refresh
              </button>
            </div>
          </div>
          
          {/* User Type Filter */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <button
              onClick={() => setUserTypeFilter('all')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                userTypeFilter === 'all'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({contacts.length})
            </button>
            <button
              onClick={() => setUserTypeFilter('client')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                userTypeFilter === 'client'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Clients ({contacts.filter(c => c.userType === 'client' || !c.userType).length})
            </button>
            <button
              onClick={() => setUserTypeFilter('subcontractor')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                userTypeFilter === 'subcontractor'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Subcontractors ({contacts.filter(c => c.userType === 'subcontractor').length})
            </button>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No contacts found</p>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Try a different search' : 'Contacts will appear here'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedContacts.size === filteredContacts.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(contact.id)}
                          onChange={() => handleSelectContact(contact.id)}
                          className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-700">{contact.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{contact.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{contact.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{contact.company || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          contact.userType === 'admin' ? 'bg-purple-100 text-purple-800' :
                          contact.userType === 'subcontractor' ? 'bg-orange-100 text-orange-800' :
                          'bg-cyan-100 text-cyan-800'
                        }`}>
                          {contact.userType || 'client'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedContacts(new Set([contact.id]));
                              setShowEmailModal(true);
                            }}
                            className="text-cyan-600 hover:text-cyan-900"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          {contact.phone && (
                            <a
                              href={`tel:${contact.phone}`}
                              className="text-cyan-600 hover:text-cyan-900"
                              title="Call"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Send Email</h2>
                  <p className="text-cyan-100 text-sm mt-1">
                    To: {selectedContacts.size} contact(s)
                  </p>
                </div>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  disabled={sendingEmail}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Type your message here..."
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 resize-none"
                  disabled={sendingEmail}
                />
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                <p className="text-sm text-cyan-800">
                  <strong>Note:</strong> Emails will be sent from Veritas Building Group
                  (info@veribuilds.com).
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                disabled={sendingEmail}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailSubject || !emailBody}
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-300 flex items-center gap-2"
              >
                {sendingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send to {selectedContacts.size} Contact(s)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white rounded-t-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Add New Contact</h2>
                  <p className="text-green-100 text-sm mt-1">
                    Choose the type of user to create
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  router.push('/admin/invite-client');
                }}
                className="w-full p-4 border-2 border-cyan-200 rounded-lg hover:border-cyan-600 hover:bg-cyan-50 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">Add Client</div>
                    <div className="text-sm text-gray-500">Create a new client account</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowAddModal(false);
                  router.push('/admin/invite-subcontractor');
                }}
                className="w-full p-4 border-2 border-orange-200 rounded-lg hover:border-orange-600 hover:bg-orange-50 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">Add Subcontractor</div>
                    <div className="text-sm text-gray-500">Create a new subcontractor account</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
