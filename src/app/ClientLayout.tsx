'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/serviceWorkerRegistration';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ErrorBoundary>
      {children}
      <PWAInstallPrompt />
    </ErrorBoundary>
  );
}