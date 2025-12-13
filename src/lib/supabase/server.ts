// lib/supabase/server.ts
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies as getCookies } from 'next/headers';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Async server client for direct service-role operations
export const createServerSupabaseClient = async (): Promise<SupabaseClient> => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }

  return createClient(url, key);
};

// Client SSR supabase with cookies for normal user operations
export const createSupabaseServerClient = async () => {
  const cookieStore = await getCookies(); // <-- await here!

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll(); // now works
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options) // now works
            );
          } catch {
            // Ignore if called from a Server Component
          }
        },
      },
    }
  );
};

// Optional: Admin client for service-role operations
export const createSupabaseAdminClient = async () => {
  const cookieStore = await getCookies(); // <-- await here too!

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore if called from Server Component
          }
        },
      },
    }
  );
};
