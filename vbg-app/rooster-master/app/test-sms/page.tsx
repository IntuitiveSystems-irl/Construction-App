'use client'

import { useState } from 'react';
import { MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestSMSPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('🏗️ ROOSTER CONSTRUCTION\n\nTest SMS from your construction management platform!\n\nThis is a FREE SMS sent via email-to-SMS gateway.');
  const [carrier, setCarrier] = useState('auto');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const carriers = [
    { value: 'auto', label: 'Auto-detect (tries all carriers)' },
    { value: 'verizon', label: 'Verizon' },
    { value: 'att', label: 'AT&T' },
    { value: 'tmobile', label: 'T-Mobile' },
    { value: 'sprint', label: 'Sprint' },
    { value: 'boost', label: 'Boost Mobile' },
    { value: 'cricket', label: 'Cricket' },
    { value: 'uscellular', label: 'US Cellular' },
    { value: 'metropcs', label: 'MetroPCS' },
    { value: 'virgin', label: 'Virgin Mobile' },
    { value: 'tracfone', label: 'TracFone' }
  ];

  const handleSendSMS = async () => {
    if (!phoneNumber.trim() || !message.trim()) {
      alert('Please enter both phone number and message');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/test-sms`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: message,
          carrier: carrier
        })
      });

      const data = await response.json();
      setResult(data);

    } catch (error) {
      console.error('Error sending SMS:', error);
      setResult({ 
        success: false, 
        error: 'Failed to send SMS: ' + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-lg shadow-lg mb-8">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">FREE SMS Test</h1>
              <p className="text-orange-100">Test the email-to-SMS gateway system</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* SMS Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Send Test SMS</h2>
            
            {/* Phone Number */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your phone number to receive the test SMS
              </p>
            </div>

            {/* Carrier Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carrier (Optional)
              </label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {carriers.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Auto-detect will try all major carriers
              </p>
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your SMS message..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Keep messages under 160 characters for best results
              </p>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendSMS}
              disabled={sending}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending SMS...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send FREE SMS
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className={`rounded-lg p-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center mb-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <h3 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? 'SMS Sent Successfully!' : 'SMS Failed'}
                </h3>
              </div>
              
              {result.results && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Carrier Results:</p>
                  {result.results.map((r: any, i: number) => (
                    <div key={i} className={`text-sm p-2 rounded ${r.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      <strong>{r.carrier}:</strong> {r.status}
                      {r.email && <span className="ml-2">({r.email})</span>}
                      {r.error && <span className="ml-2">- {r.error}</span>}
                    </div>
                  ))}
                </div>
              )}
              
              {result.error && (
                <p className="text-red-700 text-sm mt-2">{result.error}</p>
              )}
              
              {result.method && (
                <p className="text-gray-600 text-sm mt-2">
                  Method: {result.method}
                </p>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
            <h3 className="font-semibold text-blue-800 mb-2">How FREE SMS Works</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Uses carrier email-to-SMS gateways (completely free!)</li>
              <li>• Sends email to carrier-specific addresses like number@vtext.com</li>
              <li>• No API costs or monthly fees</li>
              <li>• Works with all major US carriers</li>
              <li>• Uses your existing email configuration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
