'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/serviceWorkerRegistration';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <>{children}</>;
}
