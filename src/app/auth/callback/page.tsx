'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // Exchange code for session
      await supabase.auth.exchangeCodeForSession(window.location.href);

      // Check user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 👇 Redirect to your actual homepage
        router.replace('/'); // if homepage is app/page.tsx
        // or router.replace('/home'); if homepage is app/home/page.tsx
      } else {
        router.replace('/login');
      }
    };

    handleAuth();
  }, [router, supabase]);

  return <p>Confirming your account…</p>;
}
