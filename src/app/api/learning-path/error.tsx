'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Learning path error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 text-center space-y-6">
        <div className="text-6xl">😢</div>
        <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
        <p className="text-gray-400">
          We couldn't load your learning path. This might be temporary.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}