'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';

declare global {
  interface Window {
    Cal?: any;
  }
}

interface CalendarBookingProps {
  email?: string;
  name?: string;
  buttonText?: string;
  buttonClassName?: string;
}

export default function CalendarBooking({ 
  email = '', 
  name = '',
  buttonText = 'Schedule Consultation',
  buttonClassName = 'px-8 py-3 font-medium rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2'
}: CalendarBookingProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load Cal.com embed script
  useEffect(() => {
    if (!document.querySelector('script[src*="cal.com/embed"]')) {
      const script = document.createElement('script');
      script.src = 'https://app.cal.com/embed/embed.js';
      script.async = true;
      script.onload = () => {
        console.log('Cal.com embed script loaded');
        setScriptLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Cal.com embed script');
        setScriptLoaded(false);
      };
      document.head.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  const openCalendar = () => {
    setLoading(true);
    
    // Get Cal.com URL from environment variable
    const calUrl = process.env.NEXT_PUBLIC_CAL_URL || 'https://cal.com/niko-vbg/consultation';
    
    // Build URL with pre-fill parameters
    const params = new URLSearchParams();
    if (name) params.append('name', name);
    if (email) params.append('email', email);
    
    const fullUrl = `${calUrl}?${params.toString()}`;
    
    console.log('Opening calendar at:', fullUrl);
    
    // Open in popup window
    const popup = window.open(
      fullUrl,
      '_blank',
      'width=800,height=800,scrollbars=yes,resizable=yes'
    );

    if (popup) {
      // Check if popup was blocked
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          setLoading(false);
        }
      }, 500);
    } else {
      // Popup was blocked, fallback to new tab
      window.open(fullUrl, '_blank');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={openCalendar}
      disabled={loading || !scriptLoaded}
      className={buttonClassName}
      type="button"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>Opening Calendar...</span>
        </>
      ) : (
        <>
          <Calendar className="h-5 w-5" />
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
}
