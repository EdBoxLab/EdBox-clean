'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/serviceWorkerRegistration';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import { ThemeProvider } from '@/lib/contexts/ThemeContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ThemeProvider>
      <ErrorBoundary>
        {children}
        <PWAInstallPrompt />
      </ErrorBoundary>
    </ThemeProvider>
  );
}