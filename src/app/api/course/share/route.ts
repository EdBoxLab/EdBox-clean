import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { skillGraphId } = await request.json();

        if (!skillGraphId) {
            return NextResponse.json({ error: 'Skill graph ID required' }, { status: 400 });
        }

        // Verify ownership
        const { data: graph } = await supabase
            .from('skill_graphs')
            .select('*')
            .eq('id', skillGraphId)
            .eq('user_id', user.id)
            .single();

        if (!graph) {
            return NextResponse.json({ error: 'Skill graph not found' }, { status: 404 });
        }

        // Generate shareable token
        const shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Store share record
        const { data: shareRecord, error } = await supabase
            .from('course_shares')
            .insert({
                skill_graph_id: skillGraphId,
                owner_id: user.id,
                share_token: shareToken,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            throw new Error('Failed to create share link');
        }

        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shared/${shareToken}`;

        return NextResponse.json({
            success: true,
            shareUrl,
            shareToken,
        });

    } catch (error: any) {
        console.error('Course Share Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to share course' },
            { status: 500 }
        );
    }
}
