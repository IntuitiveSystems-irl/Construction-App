'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Phone, Send, X, MessageSquare, Clock, ExternalLink } from 'lucide-react';

interface CRMPerson {
  id: string;
  name: { firstName: string; lastName: string; };
  emails?: { primaryEmail: string; };
  phones?: { primaryPhoneNumber: string; };
  company?: { name: string; };
  createdAt: string;
}

export default function EnhancedCRMPage() {
  const router = useRouter();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [callDuration, setCallDuration] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [savingCall, setSavingCall] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody || !selectedContact) return;
    
    setSendingEmail(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/send-crm-email-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipients: [{
            email: selectedContact.email,
            name: selectedContact.name,
            personId: selectedContact.id
          }],
          subject: emailSubject,
          body: emailBody,
        }),
      });

      if (response.ok) {
        alert('Email sent successfully!');
        setShowEmailModal(false);
        setEmailSubject('');
        setEmailBody('');
      } else {
        alert('Failed to send email');
      }
    } catch (error) {
      alert('Error sending email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleLogCall = async () => {
    if (!callNotes || !selectedContact) return;
    
    setSavingCall(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/crm/person/${selectedContact.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          note: `📞 Call - Duration: ${callDuration || 'N/A'}\n${callNotes}` 
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

  // Listen for messages from Twenty CRM iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle contact selection from Twenty CRM
      if (event.data.type === 'CONTACT_SELECTED') {
        setSelectedContact(event.data.contact);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar with Quick Actions */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-700">CRM</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 hover:text-gray-700"
          >
            ← Back
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {showQuickActions ? 'Hide' : 'Show'} Quick Actions
          </button>
          
          <button
            onClick={() => window.open('https://crm.veribuilds.com/objects/people', '_blank')}
            className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Full CRM
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Twenty CRM Iframe */}
        <div className="flex-1 relative">
          <iframe
            src="https://crm.veribuilds.com/objects/people"
            className="w-full h-full border-0"
            title="Twenty CRM"
            allow="clipboard-read; clipboard-write"
          />
        </div>

        {/* Quick Actions Sidebar */}
        {showQuickActions && (
          <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Quick Actions</h2>

            <div className="space-y-3">
              <button
                onClick={() => {
                  if (!selectedContact) {
                    alert('Please select a contact from the CRM first');
                    return;
                  }
                  setShowEmailModal(true);
                }}
                className="w-full p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 text-left"
              >
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">Send Email</div>
                    <div className="text-sm text-green-100">Compose & track</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (!selectedContact) {
                    alert('Please select a contact from the CRM first');
                    return;
                  }
                  setShowCallModal(true);
                }}
                className="w-full p-4 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-left"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5" />
                  <div>
                    <div className="font-semibold">Log Call</div>
                    <div className="text-sm text-cyan-100">Document conversation</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/admin/contracts')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-cyan-600 hover:bg-cyan-50 text-left"
              >
                <div className="font-semibold text-gray-700">View Contracts</div>
                <div className="text-sm text-gray-500">Manage all contracts</div>
              </button>

              <button
                onClick={() => router.push('/admin/estimates')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-cyan-600 hover:bg-cyan-50 text-left"
              >
                <div className="font-semibold text-gray-700">View Estimates</div>
                <div className="text-sm text-gray-500">Manage all estimates</div>
              </button>

              <button
                onClick={() => router.push('/admin/invoices')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-cyan-600 hover:bg-cyan-50 text-left"
              >
                <div className="font-semibold text-gray-700">View Invoices</div>
                <div className="text-sm text-gray-500">Manage all invoices</div>
              </button>
            </div>

            {selectedContact && (
              <div className="mt-6 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                <div className="text-sm font-semibold text-cyan-900 mb-2">Selected Contact</div>
                <div className="text-sm text-cyan-800">{selectedContact.name}</div>
                {selectedContact.email && (
                  <div className="text-xs text-cyan-600 mt-1">{selectedContact.email}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Send Email</h2>
                  {selectedContact && (
                    <p className="text-green-100 text-sm mt-1">To: {selectedContact.name}</p>
                  )}
                </div>
                <button onClick={() => setShowEmailModal(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  disabled={sendingEmail}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Type your message here..."
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
                  disabled={sendingEmail}
                />
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                <p className="text-sm text-cyan-800">
                  <strong>Note:</strong> Email will be sent from Veritas Building Group (info@veribuilds.com) and saved to CRM history.
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
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2"
              >
                {sendingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Log Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Log Call</h2>
                  {selectedContact && (
                    <p className="text-cyan-100 text-sm mt-1">With: {selectedContact.name}</p>
                  )}
                </div>
                <button onClick={() => setShowCallModal(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Call Duration</label>
                <input
                  type="text"
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                  placeholder="e.g., 15 minutes"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  disabled={savingCall}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Call Notes</label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="What was discussed during the call..."
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 resize-none"
                  disabled={savingCall}
                />
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                <p className="text-sm text-cyan-800">
                  <strong>Note:</strong> Call log will be saved to the contact's activity timeline in the CRM.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowCallModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                disabled={savingCall}
              >
                Cancel
              </button>
              <button
                onClick={handleLogCall}
                disabled={savingCall || !callNotes}
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-300 flex items-center gap-2"
              >
                {savingCall ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Save Call Log
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
