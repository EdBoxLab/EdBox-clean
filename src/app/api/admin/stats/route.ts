import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAdmin, updateAdminLastLogin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
    try {
        await requireAdmin();
        await updateAdminLastLogin();

        const supabase = await createSupabaseServerClient();

        // Get total users count
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Get admin count
        const { count: adminCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'admin');

        // Get users who joined in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentUsers } = await supabase
            .from('profiles')
            .select('id')
            .gte('id', sevenDaysAgo.toISOString());

        // Get total notes
        const { count: totalNotes } = await supabase
            .from('notes')
            .select('*', { count: 'exact', head: true });

        // Get total chat conversations
        const { count: totalConversations } = await supabase
            .from('chat_conversations')
            .select('*', { count: 'exact', head: true });

        // Get total chat messages
        const { count: totalMessages } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true });

        // Get total study kit content
        const { count: totalStudyKits } = await supabase
            .from('study_kit_content')
            .select('*', { count: 'exact', head: true });

        // Get subscription stats
        const { data: subscriptionStats } = await supabase
            .from('user_subscriptions')
            .select('plan_id, status');

        const planBreakdown = subscriptionStats?.reduce((acc: any, sub: any) => {
            acc[sub.plan_id] = (acc[sub.plan_id] || 0) + 1;
            return acc;
        }, {});

        const activeSubscriptions = subscriptionStats?.filter(
            (sub: any) => sub.status === 'active'
        ).length;

        // Get activity metrics (messages created in last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { count: messagesLast24h } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', yesterday.toISOString());

        const { count: notesLast24h } = await supabase
            .from('notes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', yesterday.toISOString());

        // Calculate active users (users who created content in last 7 days)
        const { data: activeUserData } = await supabase
            .from('chat_messages')
            .select('conversation_id')
            .gte('created_at', sevenDaysAgo.toISOString());

        const { data: activeConversations } = await supabase
            .from('chat_conversations')
            .select('user_id')
            .in('id', activeUserData?.map(m => m.conversation_id) || []);

        const activeUsersCount = new Set(activeConversations?.map(c => c.user_id)).size;

        return NextResponse.json({
            users: {
                total: totalUsers || 0,
                admins: adminCount || 0,
                newLast7Days: recentUsers?.length || 0,
                activeLast7Days: activeUsersCount,
            },
            content: {
                notes: totalNotes || 0,
                conversations: totalConversations || 0,
                messages: totalMessages || 0,
                studyKits: totalStudyKits || 0,
            },
            activity: {
                messagesLast24h: messagesLast24h || 0,
                notesLast24h: notesLast24h || 0,
            },
            subscriptions: {
                active: activeSubscriptions || 0,
                planBreakdown: planBreakdown || {},
            },
        });
    } catch (error: any) {
        console.error('Admin stats error:', error);

        if (error.message === 'Admin access required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}