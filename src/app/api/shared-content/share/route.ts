import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    const supabaseAuth = await createSupabaseServerClient();
    const supabaseAdmin = createServerSupabaseClient();

    try {
        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { contentType, contentId, circleId, message } = body;

        if (!contentType || !contentId || !circleId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Convert circleId to number (study_circles uses integer IDs)
        const numericCircleId = Number(circleId);

        // Verify membership
        const { data: membership, error: memberError } = await supabaseAdmin
            .from('circle_members')
            .select('user_id')
            .eq('circle_id', numericCircleId)
            .eq('user_id', user.id)
            .single();

        if (memberError || !membership) {
            console.error('Membership check error:', memberError);
            return NextResponse.json({ error: 'Not a member of this circle' }, { status: 403 });
        }

        // Insert into shared_content table
        const { data: sharedContent, error: insertError } = await supabaseAdmin
            .from('shared_content')
            .insert({
                content_type: contentType,
                content_id: contentId,
                shared_by: user.id,
                circle_id: numericCircleId,
                message: message || null
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error sharing content:', insertError);
            return NextResponse.json({
                error: 'Failed to share content',
                details: insertError.message
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, sharedContent });
    } catch (error: any) {
        console.error('Share endpoint error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error?.message
        }, { status: 500 });
    }
}

