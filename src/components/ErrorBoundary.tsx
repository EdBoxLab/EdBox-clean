'use client';

import React, { Component, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ContactSupport } from './ContactSupport';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  showSupport: boolean;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, showSupport: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, showSupport: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to support
    if (typeof window !== 'undefined') {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        })
      }).catch(console.error);
    }
  }

  handleGoHome = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <>
          <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl p-8 text-center">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-3">
                Oops! Something went wrong
              </h1>
              
              <p className="text-zinc-400 mb-2">
                We encountered an unexpected error (Error 500)
              </p>
              
              <p className="text-zinc-500 text-sm mb-8">
                Don't worry, our team has been notified and is working on it.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleGoHome}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                >
                  Go to Homepage
                </button>
                
                <button
                  onClick={() => this.setState({ showSupport: true })}
                  className="px-6 py-3 bg-zinc-800 text-white font-semibold rounded-lg hover:bg-zinc-700 border border-zinc-700 transition-all"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
          
          {this.state.showSupport && (
            <ContactSupport
              onClose={() => this.setState({ showSupport: false })}
              error="I encountered an error on the platform"
            />
          )}
        </>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }: Props) {
  return <ErrorBoundaryClass>{children}</ErrorBoundaryClass>;
}
