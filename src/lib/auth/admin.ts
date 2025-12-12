import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function isAdmin(): Promise<boolean> {
    try {
        const supabase = await createSupabaseServerClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return false;

        const { data: admin } = await supabase
            .from('admins')
            .select('is_active, role')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single();

        return !!admin;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

export async function getAdminRole(): Promise<'super_admin' | 'admin' | 'moderator' | null> {
    try {
        const supabase = await createSupabaseServerClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const { data: admin } = await supabase
            .from('admins')
            .select('role, is_active')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single();

        return admin?.role || null;
    } catch (error) {
        console.error('Error getting admin role:', error);
        return null;
    }
}

export async function getAdminPermissions(): Promise<Record<string, boolean> | null> {
    try {
        const supabase = await createSupabaseServerClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const { data: admin } = await supabase
            .from('admins')
            .select('permissions, is_active')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single();

        return admin?.permissions || null;
    } catch (error) {
        console.error('Error getting admin permissions:', error);
        return null;
    }
}

export async function requireAdmin(): Promise<void> {
    const admin = await isAdmin();
    if (!admin) {
        throw new Error('Admin access required');
    }
}

export async function requireSuperAdmin(): Promise<void> {
    const role = await getAdminRole();
    if (role !== 'super_admin') {
        throw new Error('Super admin access required');
    }
}

export async function updateAdminLastLogin(): Promise<void> {
    try {
        const supabase = await createSupabaseServerClient();
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase
            .from('admins')
            .update({ last_login: new Date().toISOString() })
            .eq('user_id', session.user.id);
    } catch (error) {
        console.error('Error updating admin last login:', error);
    }
}

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