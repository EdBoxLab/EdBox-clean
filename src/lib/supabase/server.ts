'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Service-role client (admin tasks, bypasses RLS)
export const createServerSupabaseClient = async (): Promise<SupabaseClient> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  }

  const cookieStore = await cookies();

  // Attach cookies to client for server-side operations
  return createClient(url, key, {
    global: { fetch },
    auth: { persistSession: false }
  });
};

// SSR client with cookies (normal user operations)
export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore if called from a Server Component
          }
        },
      },
    }
  );
};

// Admin client (service-role + cookies)
export const createSupabaseAdminClient = async (): Promise<SupabaseClient> => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
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
