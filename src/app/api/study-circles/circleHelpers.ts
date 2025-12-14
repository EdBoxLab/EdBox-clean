import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/admin';

export async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

export async function getSupabaseAdmin() {
  try {
    return createServerSupabaseClient();
  } catch (err) {
    // Fallback to regular server client (useful in tests or when service-role isn't available)
    return await createSupabaseServerClient();
  }
}
