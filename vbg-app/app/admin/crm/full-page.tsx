'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, Phone, Building2, Calendar, ExternalLink, User, Send, X, 
  Search, Filter, Download, Upload, MoreVertical, Plus, Edit, Trash2,
  CheckSquare, Square, List, Grid, Clock, MessageSquare, Tag
} from 'lucide-react';

interface CRMPerson {
  id: string;
  name: { firstName: string; lastName: string; };
  emails?: { primaryEmail: string; };
  phones?: { primaryPhoneNumber: string; };
  company?: { name: string; };
  createdAt: string;
}

interface EmailHistory {
  id: number;
  subject: string;
  body: string;
  sent_at: string;
  sent_by: string;
}

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
}

export default function FullCRMPage() {
  const router = useRouter();
  const [people, setPeople] = useState<CRMPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set());
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<CRMPerson | null>(null);
  const [showPersonDetail, setShowPersonDetail] = useState(false);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  
  // Email composer state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

  useEffect(() => {
    fetchCRMData();
    fetchEmailTemplates();
  }, []);

  const fetchCRMData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/crm/people`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPeople(data.people || []);
      }
    } catch (err) {
      setError('Failed to load CRM data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/crm/email-templates`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEmailTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Failed to load templates');
    }
  };

  const fetchPersonDetails = async (personId: string) => {
    try {
      const [emailRes, notesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/crm/person/${personId}/emails`, { credentials: 'include' }),
        fetch(`${API_URL}/api/admin/crm/person/${personId}/notes`, { credentials: 'include' })
      ]);
      
      if (emailRes.ok) {
        const emailData = await emailRes.json();
        setEmailHistory(emailData.emails || []);
      }
      
      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData.notes || []);
      }
    } catch (err) {
      console.error('Failed to load person details');
    }
  };

  const handleSelectPerson = (personId: string) => {
    const newSelected = new Set(selectedPeople);
    if (newSelected.has(personId)) {
      newSelected.delete(personId);
    } else {
      newSelected.add(personId);
    }
    setSelectedPeople(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPeople.size === filteredPeople.length) {
      setSelectedPeople(new Set());
    } else {
      setSelectedPeople(new Set(filteredPeople.map(p => p.id)));
    }
  };

  const handleSendEmail = async (isBulk = false) => {
    if (!emailSubject || !emailBody) {
      alert('Please fill in all fields');
      return;
    }

    setSendingEmail(true);
    try {
      const recipients = isBulk 
        ? Array.from(selectedPeople).map(id => people.find(p => p.id === id)).filter(Boolean)
        : [selectedPerson];

      const response = await fetch(`${API_URL}/api/admin/send-crm-email-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipients: recipients.map(p => ({
            email: p?.emails?.primaryEmail,
            name: `${p?.name.firstName} ${p?.name.lastName}`,
            personId: p?.id
          })),
          subject: emailSubject,
          body: emailBody,
        }),
      });

      if (response.ok) {
        setEmailSuccess(true);
        setTimeout(() => {
          setShowEmailModal(false);
          setShowBulkEmail(false);
          setEmailSuccess(false);
          setEmailSubject('');
          setEmailBody('');
          setSelectedPeople(new Set());
        }, 2000);
      }
    } catch (error) {
      alert('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote || !selectedPerson) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/crm/person/${selectedPerson.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note: newNote }),
      });

      if (response.ok) {
        setNewNote('');
        fetchPersonDetails(selectedPerson.id);
      }
    } catch (error) {
      alert('Failed to add note');
    }
  };

  const applyTemplate = (template: EmailTemplate) => {
    setEmailSubject(template.subject);
    setEmailBody(template.body);
    setShowTemplates(false);
  };

  const filteredPeople = people.filter(person => {
    const fullName = `${person.name.firstName} ${person.name.lastName}`.toLowerCase();
    const email = person.emails?.primaryEmail?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-700">CRM</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded ${viewMode === 'table' ? 'bg-cyan-100 text-cyan-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-cyan-100 text-cyan-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {selectedPeople.size > 0 && (
                <button
                  onClick={() => setShowBulkEmail(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send to {selectedPeople.size}
                </button>
              )}

              <button
                onClick={() => window.open('http://31.97.144.132:3002', '_blank')}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Twenty
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-700">{people.length}</div>
            <div className="text-sm text-gray-600">Total Contacts</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-700">{selectedPeople.size}</div>
            <div className="text-sm text-gray-600">Selected</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-700">{filteredPeople.length}</div>
            <div className="text-sm text-gray-600">Filtered Results</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-700">{emailTemplates.length}</div>
            <div className="text-sm text-gray-600">Email Templates</div>
          </div>
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button onClick={handleSelectAll}>
                      {selectedPeople.size === filteredPeople.length && filteredPeople.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-cyan-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPeople.map((person) => (
                  <tr key={person.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <button onClick={() => handleSelectPerson(person.id)}>
                        {selectedPeople.has(person.id) ? (
                          <CheckSquare className="w-5 h-5 text-cyan-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedPerson(person);
                          setShowPersonDetail(true);
                          fetchPersonDetails(person.id);
                        }}
                        className="flex items-center gap-3 hover:text-cyan-600"
                      >
                        <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-cyan-600" />
                        </div>
                        <span className="font-medium">{person.name.firstName} {person.name.lastName}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{person.emails?.primaryEmail || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{person.phones?.primaryPhoneNumber || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{person.company?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(person.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPerson(person);
                          setShowEmailModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100"
                      >
                        <Send className="w-4 h-4" />
                        Email
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPeople.map((person) => (
              <div key={person.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <button onClick={() => handleSelectPerson(person.id)}>
                      {selectedPeople.has(person.id) ? (
                        <CheckSquare className="w-5 h-5 text-cyan-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700">
                        {person.name.firstName} {person.name.lastName}
                      </h3>
                      {person.company && (
                        <p className="text-xs text-gray-500">{person.company.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {person.emails?.primaryEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{person.emails.primaryEmail}</span>
                    </div>
                  )}
                  {person.phones?.primaryPhoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{person.phones.primaryPhoneNumber}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => {
                      setSelectedPerson(person);
                      setShowPersonDetail(true);
                      fetchPersonDetails(person.id);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-cyan-50 text-cyan-700 rounded hover:bg-cyan-100"
                  >
                    View
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPerson(person);
                      setShowEmailModal(true);
                    }}
                    className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Person Detail Sidebar - Continues in next message due to length */}
    </div>
  );
}
