import { createBrowserClient } from '@supabase/ssr';

// ✅ Default client (ready-to-use everywhere)
export const supabase = (typeof window !== 'undefined' || process.env.NEXT_PUBLIC_SUPABASE_URL) 
  ? createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'
    )
  : null as any;

// ✅ Factory function (if you want to create a fresh client per component)
export const createSupabaseBrowserClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
