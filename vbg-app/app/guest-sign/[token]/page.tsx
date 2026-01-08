'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, CheckCircle, AlertCircle, Clock, Mail, User, Calendar, DollarSign } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

export default function GuestContractSign() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<any>(null);
  const [error, setError] = useState('');
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  
  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    fetchContract();
  }, [token]);

  const fetchContract = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_URL}/api/contracts/guest/${token}`);
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to load contract');
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setContract(data);
      setName(data.guest_name || '');
      setEmail(data.guest_email || '');
      
      if (data.alreadySigned) {
        setSigned(true);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching contract:', err);
      setError('Failed to load contract. Please try again.');
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setError('Please provide your signature');
      return;
    }
    
    if (!name || !email) {
      setError('Please provide your name and email');
      return;
    }
    
    if (!agreed) {
      setError('Please agree to the terms before signing');
      return;
    }
    
    setSigning(true);
    setError('');
    
    try {
      const signatureData = signatureRef.current.toDataURL();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      
      const response = await fetch(`${API_URL}/api/contracts/guest/${token}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature: signatureData,
          name,
          email
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to sign contract');
        setSigning(false);
        return;
      }
      
      setSigned(true);
      setSigning(false);
    } catch (err) {
      console.error('Error signing contract:', err);
      setError('Failed to sign contract. Please try again.');
      setSigning(false);
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (error && !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Contract</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact Veritas Building Group at info@veribuilds.com
          </p>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-8">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl font-bold">Contract Signed Successfully!</h1>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              Your signature has been successfully recorded. A confirmation email has been sent to <strong>{email}</strong>.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Contract Details</h3>
              <p className="text-sm text-gray-600">Project: {contract?.project_name}</p>
              <p className="text-sm text-gray-600">Signed: {new Date().toLocaleDateString()}</p>
            </div>
            <p className="text-sm text-gray-500">
              You will receive a copy of the fully executed contract shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center space-x-3 mb-2">
            <FileText className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Contract Signature Required</h1>
          </div>
          <p className="text-cyan-100">Veritas Building Group</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Contract Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contract Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-cyan-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Project Name</p>
                <p className="text-gray-900">{contract?.project_name || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <DollarSign className="h-5 w-5 text-cyan-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                <p className="text-gray-900">{contract?.total_amount || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-cyan-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">Start Date</p>
                <p className="text-gray-900">{contract?.start_date || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-cyan-600 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-500">End Date</p>
                <p className="text-gray-900">{contract?.end_date || 'N/A'}</p>
              </div>
            </div>
          </div>

          {contract?.project_description && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
              <p className="text-gray-700">{contract.project_description}</p>
            </div>
          )}

          {/* Contract Content */}
          {contract?.contract_content && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Contract Terms</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {contract.contract_content}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Signature Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Signature</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Name and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Signature Canvas */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Draw Your Signature *
            </label>
            <div className="border-2 border-gray-300 rounded-lg bg-white">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'w-full h-40 cursor-crosshair',
                }}
                backgroundColor="white"
              />
            </div>
            <button
              type="button"
              onClick={clearSignature}
              className="mt-2 text-sm text-cyan-600 hover:text-cyan-700"
            >
              Clear Signature
            </button>
          </div>

          {/* Agreement Checkbox */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                I agree that the aforementioned is correct and legally binding.
              </span>
            </label>
          </div>

          {/* Token Expiry Info */}
          {contract?.token_expires_at && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6 flex items-start space-x-2">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800">
                  This signing link expires on {new Date(contract.token_expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Sign Button */}
          <button
            onClick={handleSign}
            disabled={signing || !agreed}
            className="w-full px-6 py-3 font-medium rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {signing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing Contract...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Sign Contract
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            By signing this contract, you agree to the terms and conditions outlined above.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Questions? Contact us at info@veribuilds.com or (360) 229-5524</p>
        </div>
      </div>
    </div>
  );
}
