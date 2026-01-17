'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Suspense } from 'react';

function AuthCallbackContent() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code');

      // If no code is present, check if we already have a session
      if (!code) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.replace('/dashboard');
        } else {
          router.replace('/login');
        }
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) {
        router.replace('/login');
        return;
      }

      const type = searchParams.get('type');
      if (type === 'recovery') {
        router.replace('/reset-password');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    };

    handleAuth();
  }, [router, supabase, searchParams]);

  return <p className="text-center mt-20 text-gray-400">Confirming your account...</p>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p className="text-center mt-20 text-gray-400">Loading...</p>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
