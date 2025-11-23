'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [message, setMessage] = useState('Confirming your account...');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        setMessage('Something went wrong. Please try signing in again.');
        return;
      }

      if (user) {
        setMessage('Your email has been confirmed! Redirecting...');
        setTimeout(() => {
          router.push('/home');
          router.refresh();
        }, 2000);
      } else {
        setMessage('No user found. Please sign in.');
      }
    };

    checkUser();
  }, [router, supabase]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <p className="text-lg text-center">{message}</p>
    </div>
  );
}
