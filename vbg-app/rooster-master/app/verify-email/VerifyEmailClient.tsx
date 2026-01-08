'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(`http://31.97.144.132:4000/api/verify-email?token=${encodeURIComponent(token)}`, {
          method: 'GET',
          credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage('Email verified successfully!');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data?.error || 'Email verification failed.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Something went wrong while verifying your email.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center">
        {status === 'verifying' && <p className="text-gray-700">Verifying your email...</p>}
        {status === 'success' && (
          <div className="space-y-4">
            <p className="text-green-600 font-medium">{message}</p>
            <p className="text-gray-600">Redirecting you to your dashboard...</p>
          </div>
        )}
        {status === 'error' && <p className="text-red-600 font-medium">{message}</p>}
      </div>
    </div>
  );
}
