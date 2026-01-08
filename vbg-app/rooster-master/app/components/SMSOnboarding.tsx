'use client'

import { useState } from 'react';
import { MessageSquare, Check, X, Phone, Bell, Shield } from 'lucide-react';

interface SMSOnboardingProps {
  onComplete: (phoneNumber: string, smsEnabled: boolean) => void;
  onSkip: () => void;
}

export default function SMSOnboarding({ onComplete, onSkip }: SMSOnboardingProps) {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(true);

  const handleComplete = () => {
    onComplete(phoneNumber, smsEnabled);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return digits;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="h-6 w-6 mr-3" />
              <h2 className="text-xl font-bold">FREE SMS Notifications</h2>
            </div>
            <button
              onClick={onSkip}
              className="text-purple-200 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Step 1: Benefits */}
        {step === 1 && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Bell className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Stay Updated with FREE SMS
              </h3>
              <p className="text-gray-600">
                Get instant notifications for important construction updates
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-sm text-gray-700">New job site assignments</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-sm text-gray-700">Safety alerts and updates</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-sm text-gray-700">Schedule changes</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-sm text-gray-700">Weather alerts</span>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800">100% FREE</p>
                  <p className="text-xs text-green-600">No monthly fees or per-message charges</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
              >
                Set Up SMS
              </button>
              <button
                onClick={onSkip}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Phone Number */}
        {step === 2 && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Phone className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Enter Your Phone Number
              </h3>
              <p className="text-gray-600">
                We&apos;ll send SMS notifications to this number
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={14}
              />
              <p className="text-xs text-gray-500 mt-1">
                US phone numbers only. Standard messaging rates may apply from your carrier.
              </p>
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={smsEnabled}
                  onChange={(e) => setSmsEnabled(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enable SMS notifications
                </span>
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={!phoneNumber.trim()}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Complete Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
