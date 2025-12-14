'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface ComponentLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  retryCount?: number;
}

interface LoadingFallbackProps {
  message?: string;
}

function LoadingFallback({ message = "Loading learning path..." }: LoadingFallbackProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
}

interface ErrorFallbackProps {
  error?: Error;
  onRetry: () => void;
  retryCount: number;
  maxRetries: number;
}

function ErrorFallback({ error, onRetry, retryCount, maxRetries }: ErrorFallbackProps) {
  const isSourceMapError = error?.message.includes('source map') || 
                           error?.message.includes('sourceMapURL');

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center max-w-md p-6">
        <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">
          {isSourceMapError ? 'Loading Issue Detected' : 'Component Load Failed'}
        </h2>
        <p className="text-gray-400 mb-6">
          {isSourceMapError 
            ? 'We detected a development tool issue that doesn\'t affect functionality. The learning path should still work normally.'
            : 'We encountered an issue loading the learning path component. This might be a temporary network issue.'
          }
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 mb-2">
              Technical Details (Development)
            </summary>
            <div className="bg-gray-800 p-3 rounded text-xs font-mono text-orange-300 overflow-auto max-h-32">
              <div className="mb-2">
                <strong>Error:</strong> {error.message}
              </div>
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap text-xs">{error.stack.slice(0, 500)}...</pre>
                </div>
              )}
            </div>
          </details>
        )}

        <div className="flex gap-3 justify-center">
          {retryCount < maxRetries && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again ({maxRetries - retryCount} left)
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ComponentLoader({ 
  children, 
  fallback, 
  errorFallback, 
  retryCount = 3 
}: ComponentLoaderProps) {
  const [error, setError] = useState<Error | null>(null);
  const [currentRetryCount, setCurrentRetryCount] = useState(0);
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Reset error state when children change
    setError(null);
    setCurrentRetryCount(0);
  }, [children]);

  const handleRetry = () => {
    if (currentRetryCount < retryCount) {
      setError(null);
      setCurrentRetryCount(prev => prev + 1);
      setKey(prev => prev + 1); // Force re-render
    }
  };

  const handleError = (error: Error) => {
    console.warn('ComponentLoader caught error:', error.message);
    
    // Check if it's a source map error
    const isSourceMapError = error.message.includes('source map') || 
                             error.message.includes('sourceMapURL');
    
    if (isSourceMapError) {
      console.warn('Source map error detected, continuing with degraded debugging experience');
      // For source map errors, we log but don't show error UI
      return;
    }

    setError(error);
  };

  if (error) {
    if (errorFallback) {
      return <>{errorFallback}</>;
    }
    
    return (
      <ErrorFallback 
        error={error} 
        onRetry={handleRetry}
        retryCount={currentRetryCount}
        maxRetries={retryCount}
      />
    );
  }

  return (
    <Suspense fallback={fallback || <LoadingFallback />}>
      <div key={key}>
        {children}
      </div>
    </Suspense>
  );
}