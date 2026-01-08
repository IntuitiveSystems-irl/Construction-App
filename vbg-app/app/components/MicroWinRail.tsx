'use client';

import { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';

interface MicroWinRailProps {
  maxWins?: number;
  onStreakComplete?: () => void;
}

export default function MicroWinRail({ maxWins = 5, onStreakComplete }: MicroWinRailProps) {
  const [wins, setWins] = useState<number[]>([]);
  const [showDelighter, setShowDelighter] = useState(false);
  const [totalCompletions, setTotalCompletions] = useState(0);

  useEffect(() => {
    // Load from sessionStorage
    const stored = sessionStorage.getItem('microWins');
    const storedTotal = sessionStorage.getItem('totalCompletions');
    if (stored) setWins(JSON.parse(stored));
    if (storedTotal) setTotalCompletions(parseInt(storedTotal));

    // Listen for completion events
    const handleCompletion = () => {
      if (wins.length < maxWins) {
        const newWins = [...wins, Date.now()];
        setWins(newWins);
        sessionStorage.setItem('microWins', JSON.stringify(newWins));
        
        const newTotal = totalCompletions + 1;
        setTotalCompletions(newTotal);
        sessionStorage.setItem('totalCompletions', newTotal.toString());

        // Haptic feedback (if supported)
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }

        // Show delighter every 6-10 completions
        if (newTotal % 7 === 0 || newTotal % 10 === 0) {
          setShowDelighter(true);
          setTimeout(() => setShowDelighter(false), 3000);
        }

        // Streak complete callback
        if (newWins.length === maxWins && onStreakComplete) {
          onStreakComplete();
        }
      }
    };

    window.addEventListener('taskComplete', handleCompletion);
    return () => window.removeEventListener('taskComplete', handleCompletion);
  }, [wins, maxWins, totalCompletions, onStreakComplete]);

  const resetStreak = () => {
    setWins([]);
    sessionStorage.setItem('microWins', JSON.stringify([]));
  };

  if (wins.length === 0) return null;

  return (
    <>
      {/* Micro-Win Rail */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-3">
          <div className="flex flex-col gap-2">
            {Array.from({ length: maxWins }).map((_, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  i < wins.length
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 scale-100 animate-bounce-once'
                    : 'bg-gray-100 scale-90'
                }`}
              >
                {i < wins.length && (
                  <Check className="w-5 h-5 text-white animate-check-pop" />
                )}
              </div>
            ))}
          </div>
          {wins.length === maxWins && (
            <button
              onClick={resetStreak}
              className="mt-3 w-full text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Delighter Popup */}
      {showDelighter && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in-right">
          <div className="bg-gradient-to-br from-delight-pink to-delight-purple text-white rounded-2xl shadow-2xl p-4 max-w-xs">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">You're on fire! 🔥</h4>
                <p className="text-xs mt-1 opacity-90">
                  {totalCompletions} tasks completed! Keep up the momentum.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Done for Today Nudge */}
      {wins.length === maxWins && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in-up">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-full p-2">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Great work today!</h4>
                <p className="text-sm text-gray-600 mt-1">
                  You've completed {maxWins} tasks. Take a break and come back refreshed! 🎉
                </p>
                <button
                  onClick={resetStreak}
                  className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Continue anyway →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes check-pop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-in-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-bounce-once {
          animation: bounce-once 0.5s ease-out;
        }
        .animate-check-pop {
          animation: check-pop 0.3s ease-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out;
        }
        .animate-slide-in-up {
          animation: slide-in-up 0.4s ease-out;
        }
      `}</style>
    </>
  );
}

// Helper function to trigger completions
export function triggerMicroWin() {
  window.dispatchEvent(new Event('taskComplete'));
}
