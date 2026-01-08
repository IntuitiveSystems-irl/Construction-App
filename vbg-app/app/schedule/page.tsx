'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import CalendarBooking from '../components/CalendarBooking';

export default function ScheduleAppointmentPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [formData, setFormData] = useState({
    appointment_type: 'consultation',
    preferred_date: '',
    preferred_time: '',
    alternate_date: '',
    alternate_time: '',
    description: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Fetch user info for pre-filling calendar
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
        const response = await fetch(`${BACKEND_URL}/api/user`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setUserEmail(data.email || '');
          setUserName(data.name || '');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    fetchUserInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${BACKEND_URL}/api/appointments`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to schedule appointment');
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      setError('Error scheduling appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Requested!</h2>
          <p className="text-gray-600">Your appointment request has been submitted. We'll contact you soon to confirm.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/dashboard" className="flex items-center text-cyan-100 hover:text-white mb-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 p-3 rounded-lg">
              <Calendar className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Schedule an Appointment</h1>
              <p className="text-cyan-100 mt-1">Book a consultation or site visit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Your Appointment</h2>
              <p className="text-gray-600">
                Click the button below to open our calendar and select a time that works best for you.
              </p>
            </div>

            <div className="py-8">
              <CalendarBooking 
                email={userEmail}
                name={userName}
                buttonText="Open Calendar & Book Time"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Available Appointment Types:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <h4 className="font-medium text-cyan-900">Initial Consultation</h4>
                  <p className="text-sm text-cyan-700 mt-1">Discuss your project needs and goals</p>
                </div>
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <h4 className="font-medium text-cyan-900">Site Visit</h4>
                  <p className="text-sm text-cyan-700 mt-1">On-site assessment and evaluation</p>
                </div>
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <h4 className="font-medium text-cyan-900">Estimate Review</h4>
                  <p className="text-sm text-cyan-700 mt-1">Review and discuss project estimates</p>
                </div>
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <h4 className="font-medium text-cyan-900">Follow-up Meeting</h4>
                  <p className="text-sm text-cyan-700 mt-1">Continue discussions on ongoing projects</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Link 
                href="/dashboard" 
                className="text-gray-600 hover:text-gray-900 font-medium flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-cyan-50 border border-cyan-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Clock className="h-6 w-6 text-cyan-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-cyan-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-cyan-800 space-y-1">
                <li>• We'll review your appointment request</li>
                <li>• You'll receive a confirmation call or email within 24 hours</li>
                <li>• We'll confirm the date and time that works best</li>
                <li>• You'll receive a calendar invitation with details</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
