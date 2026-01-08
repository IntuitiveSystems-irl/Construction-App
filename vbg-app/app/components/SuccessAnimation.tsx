'use client';

import { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
}

export default function SuccessAnimation({ show, message = 'Success!', onComplete }: SuccessAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 100, 50]);
      }

      // Auto-hide after 2 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop with subtle pulse */}
      <div className="absolute inset-0 bg-black/5 animate-pulse-slow" />
      
      {/* Success checkmark with color burst */}
      <div className="relative">
        {/* Color burst rings */}
        <div className="absolute inset-0 animate-ping-slow">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-delight-pink/30 to-delight-mint/30" />
        </div>
        <div className="absolute inset-0 animate-ping-slower">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-delight-purple/20 to-delight-neon/20" />
        </div>
        
        {/* Main checkmark */}
        <div className="relative bg-white rounded-full w-32 h-32 flex items-center justify-center shadow-2xl animate-scale-in">
          <div className="bg-gradient-to-br from-delight-mint to-primary-500 rounded-full w-24 h-24 flex items-center justify-center">
            <Check className="w-12 h-12 text-white animate-check-draw" strokeWidth={3} />
          </div>
        </div>

        {/* Sparkles */}
        <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-delight-pink animate-sparkle-1" />
        <Sparkles className="absolute -bottom-2 -left-2 w-6 h-6 text-delight-purple animate-sparkle-2" />
        <Sparkles className="absolute top-1/2 -right-4 w-5 h-5 text-delight-mint animate-sparkle-3" />
      </div>

      {/* Message */}
      <div className="absolute bottom-1/3 text-center animate-fade-in-up">
        <p className="text-2xl font-bold text-gray-900 drop-shadow-lg">
          {message}
        </p>
      </div>

      <style jsx global>{`
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes check-draw {
          0% { stroke-dasharray: 100; stroke-dashoffset: 100; }
          100% { stroke-dasharray: 100; stroke-dashoffset: 0; }
        }
        @keyframes sparkle-1 {
          0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1) rotate(180deg); opacity: 1; }
        }
        @keyframes sparkle-2 {
          0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1) rotate(-180deg); opacity: 1; }
        }
        @keyframes sparkle-3 {
          0%, 100% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-in-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes ping-slower {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-check-draw {
          animation: check-draw 0.5s ease-out 0.2s forwards;
        }
        .animate-sparkle-1 {
          animation: sparkle-1 0.8s ease-out 0.3s;
        }
        .animate-sparkle-2 {
          animation: sparkle-2 0.8s ease-out 0.4s;
        }
        .animate-sparkle-3 {
          animation: sparkle-3 0.8s ease-out 0.5s;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out 0.6s forwards;
          opacity: 0;
        }
        .animate-ping-slow {
          animation: ping-slow 1s ease-out;
        }
        .animate-ping-slower {
          animation: ping-slower 1.5s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out;
        }
      `}</style>
    </div>
  );
}
