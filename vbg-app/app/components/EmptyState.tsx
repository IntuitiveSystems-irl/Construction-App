'use client';

import { FileText, Inbox, Smile } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: 'inbox' | 'files' | 'smile';
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ 
  title = "Nothing here yet",
  message = "Get started by adding your first item",
  icon = 'inbox',
  actionLabel,
  onAction
}: EmptyStateProps) {
  
  const icons = {
    inbox: Inbox,
    files: FileText,
    smile: Smile
  };

  const Icon = icons[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Friendly mascot wink animation */}
      <div className="relative mb-6">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <Icon className="w-16 h-16 text-gray-400 animate-float" />
        </div>
        
        {/* Wink effect */}
        <div className="absolute -top-2 -right-2 w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center animate-wink shadow-lg">
          <span className="text-2xl">😉</span>
        </div>

        {/* Floating sparkles */}
        <div className="absolute top-0 left-0 w-3 h-3 bg-delight-mint rounded-full animate-float-sparkle-1" />
        <div className="absolute bottom-4 right-0 w-2 h-2 bg-delight-pink rounded-full animate-float-sparkle-2" />
        <div className="absolute top-8 -left-4 w-2 h-2 bg-delight-purple rounded-full animate-float-sparkle-3" />
      </div>

      {/* Text content */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 text-center max-w-md mb-6">
        {message}
      </p>

      {/* Action button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          {actionLabel}
        </button>
      )}

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes wink {
          0%, 90%, 100% { transform: scale(1); opacity: 1; }
          95% { transform: scale(0.8); opacity: 0.8; }
        }
        @keyframes float-sparkle-1 {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(-10px, -20px); opacity: 1; }
        }
        @keyframes float-sparkle-2 {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(10px, -15px); opacity: 1; }
        }
        @keyframes float-sparkle-3 {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(-5px, -25px); opacity: 1; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-wink {
          animation: wink 4s ease-in-out infinite;
        }
        .animate-float-sparkle-1 {
          animation: float-sparkle-1 3s ease-in-out infinite;
        }
        .animate-float-sparkle-2 {
          animation: float-sparkle-2 3.5s ease-in-out infinite 0.5s;
        }
        .animate-float-sparkle-3 {
          animation: float-sparkle-3 4s ease-in-out infinite 1s;
        }
      `}</style>
    </div>
  );
}
