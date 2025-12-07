import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Check if the current authenticated user is an admin
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
    try {
        const supabase = await createSupabaseServerClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return false;

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        return profile?.role === 'admin';
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Get the current user's role
 * @returns 'admin' | 'user' | null
 */
export async function getUserRole(): Promise<'admin' | 'user' | null> {
    try {
        const supabase = await createSupabaseServerClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        return profile?.role || 'user';
    } catch (error) {
        console.error('Error getting user role:', error);
        return null;
    }
}

/**
 * Require admin access - throws error if user is not admin
 * Use this in API routes to protect admin-only endpoints
 */
export async function requireAdmin(): Promise<void> {
    const admin = await isAdmin();
    if (!admin) {
        throw new Error('Admin access required');
    }
}
