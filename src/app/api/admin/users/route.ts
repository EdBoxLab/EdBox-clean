import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
    try {
        await requireAdmin();

        const supabase = await createSupabaseServerClient();
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // Get users with their auth data
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, role, country, education, age, onboarding_completed')
            .order('id', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // Get corresponding auth user data
        const userIds = profiles?.map(p => p.id) || [];

        // Note: We can't directly query auth.users from client
        // So we'll need to get email from session or use service role
        // For now, let's get usage data
        const { data: usageData } = await supabase
            .from('user_usage')
            .select('*')
            .in('user_id', userIds);

        const { data: subscriptionData } = await supabase
            .from('user_subscriptions')
            .select('*')
            .in('user_id', userIds);

        // Combine data
        const users = profiles?.map(profile => {
            const usage = usageData?.find(u => u.user_id === profile.id);
            const subscription = subscriptionData?.find(s => s.user_id === profile.id);

            return {
                id: profile.id,
                role: profile.role || 'user',
                country: profile.country,
                education: profile.education,
                age: profile.age,
                onboardingCompleted: profile.onboarding_completed,
                usage: {
                    coursesCreated: usage?.courses_created_month || 0,
                    studyKitsCreated: usage?.study_kits_created_week || 0,
                    researchQueries: usage?.research_queries_week || 0,
                },
                subscription: {
                    plan: subscription?.plan_id || 'free',
                    status: subscription?.status || 'active',
                },
            };
        });

        // Get total count for pagination
        const { count: totalCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        return NextResponse.json({
            users,
            pagination: {
                page,
                limit,
                total: totalCount || 0,
                totalPages: Math.ceil((totalCount || 0) / limit),
            },
        });
    } catch (error: any) {
        console.error('Admin users GET error:', error);

        if (error.message === 'Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await requireAdmin();

        const supabase = await createSupabaseServerClient();
        const { userId, role } = await request.json();

        if (!userId || !role) {
            return NextResponse.json(
                { error: 'userId and role are required' },
                { status: 400 }
            );
        }

        if (!['user', 'admin'].includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be "user" or "admin"' },
                { status: 400 }
            );
        }

        // Update user role
        const { data, error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            user: data,
        });
    } catch (error: any) {
        console.error('Admin users PATCH error:', error);

        if (error.message === 'Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(
            { error: 'Failed to update user role' },
            { status: 500 }
        );
    }
}
