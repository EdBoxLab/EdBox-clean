'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/serviceWorkerRegistration';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { ErrorBoundary } from '@/components/ErrorBoundary';


import { GenieProvider } from '@/lib/contexts/GenieContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <GenieProvider>
      <ErrorBoundary>
        {children}
        <PWAInstallPrompt />
      </ErrorBoundary>
    </GenieProvider>
  );
}