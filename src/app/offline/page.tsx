'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-blue-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
            <div className="relative bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-xl border border-blue-500/30 rounded-full p-8">
              <WifiOff className="w-16 h-16 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white">
            You&apos;re Offline
          </h1>
          <p className="text-gray-400 text-lg">
            No internet connection detected. Some features may be limited, but you can still access cached content.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 space-y-3">
            <h3 className="text-white font-semibold text-left">Available Offline:</h3>
            <ul className="text-gray-400 text-sm space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">✓</span>
                <span>View cached courses and study materials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">✓</span>
                <span>Access saved notes and flashcards</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">✓</span>
                <span>Review skill graphs and progress</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">✓</span>
                <span>Continue learning with offline content</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-gray-500 text-sm">
          Your progress will sync automatically when you&apos;re back online
        </p>
      </div>
    </div>
  );
}
