'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Building, User, Send, Wrench } from 'lucide-react';

export default function InviteSubcontractor() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    businessName: '',
    clientName: '',
    specialty: '',
    message: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [invitationResult, setInvitationResult] = useState<any>(null);

  // Check if user is admin
  if (!user || !(user.isAdmin || (user as any)?.is_admin || user.id === 15)) {
    router.push('/dashboard');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/admin/invite-subcontractor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          userType: 'subcontractor'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInvitationResult(data);
        setSuccess(true);
        // Don't clear form data here since we need it for the success page
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const isEmailMethod = invitationResult?.method === 'email';
    const isManualMethod = invitationResult?.method === 'manual';
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className={`bg-gradient-to-r ${isEmailMethod ? 'from-green-600 via-blue-600 to-purple-600' : 'from-orange-600 via-red-600 to-primary-600'} text-white`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  {isEmailMethod ? 'Invitation Sent Successfully!' : 'Invitation Created - Manual Sending Required'}
                </h1>
                <p className={`${isEmailMethod ? 'text-green-100' : 'text-orange-100'} mt-2`}>
                  Subcontractor invitation for {invitationResult?.email || formData.email} ({invitationResult?.specialty || formData.specialty})
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {isEmailMethod ? (
              // Email Success
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Invitation Sent!</h2>
                <p className="text-gray-600 mb-6">
                  An invitation email has been sent to <strong>{invitationResult.email}</strong>. 
                  They will receive instructions on how to create their subcontractor account and get started.
                </p>
              </div>
            ) : (
              // Manual Method
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-700 mb-4">Email Service Unavailable</h2>
                  <p className="text-gray-600 mb-4">
                    The invitation was created successfully, but our email service is currently unavailable. 
                    Please send the invitation manually using the details below:
                  </p>
                  {invitationResult?.emailError && (
                    <p className="text-sm text-red-600 mb-4">
                      Error: {invitationResult.emailError}
                    </p>
                  )}
                </div>
                
                {invitationResult?.manualText && (
                  <div className="bg-gray-50 border rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-700 mb-2">Copy and send this invitation:</h3>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white border rounded p-3 max-h-96 overflow-y-auto">
                      {invitationResult.manualText}
                    </pre>
                    <button
                      onClick={() => navigator.clipboard.writeText(invitationResult.manualText)}
                      className="mt-2 bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 transition-colors text-sm"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setSuccess(false);
                  setInvitationResult(null);
                }}
                className="bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Send Another Invitation
              </button>
              <button
                onClick={() => router.push('/dashboard?tab=admin')}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/dashboard?tab=admin')}
                className="flex items-center text-white hover:text-cyan-100 transition-colors mb-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Admin Dashboard
              </button>
              <h1 className="text-3xl font-bold">Invite Subcontractor</h1>
              <p className="text-cyan-100 mt-2">
                Send an invitation to a new subcontractor to join your construction management platform
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-2" />
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="contractor@company.com"
              />
            </div>

            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-2" />
                Business Name *
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                required
                value={formData.businessName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="XYZ Plumbing Services"
              />
            </div>

            {/* Contact Name */}
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Contact Name *
              </label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                required
                value={formData.clientName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Mike Johnson"
              />
            </div>

            {/* Specialty */}
            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
                <Wrench className="h-4 w-4 inline mr-2" />
                Specialty/Trade *
              </label>
              <select
                id="specialty"
                name="specialty"
                required
                value={formData.specialty}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">Select a specialty...</option>
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="hvac">HVAC</option>
                <option value="roofing">Roofing</option>
                <option value="flooring">Flooring</option>
                <option value="painting">Painting</option>
                <option value="drywall">Drywall</option>
                <option value="framing">Framing</option>
                <option value="concrete">Concrete</option>
                <option value="landscaping">Landscaping</option>
                <option value="general">General Construction</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Custom Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Custom Message (Optional)
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Add a personal message to include in the invitation email..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 font-medium rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Send Invitation
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard?tab=admin')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
