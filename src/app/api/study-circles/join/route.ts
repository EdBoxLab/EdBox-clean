import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const invite_code = body?.invite_code?.trim().toUpperCase();

    if (!invite_code) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    // Find circle by invite code
    const { data: circle, error: circleError } = await supabase
      .from('study_circles')
      .select('id, name')
      .eq('invite_code', invite_code)
      .single();

    if (circleError || !circle) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // Check if user is already a member
    const { data: existingMember, error: checkError } = await supabase
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', circle.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking membership:', checkError);
      return NextResponse.json({ error: 'Failed to process membership' }, { status: 500 });
    }

    if (existingMember) {
      return NextResponse.json({ 
        success: true, 
        message: 'Already a member', 
        circle_id: circle.id 
      }, { status: 200 });
    }

    // Add user to circle
    const { error: insertError } = await supabase
      .from('circle_members')
      .insert({
        circle_id: circle.id,
        user_id: user.id,
        is_admin: false
      });

    if (insertError) {
      console.error('Error joining circle:', insertError);
      return NextResponse.json({ error: 'Failed to join circle' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully joined ${circle.name}`,
      circle_id: circle.id
    }, { status: 201 });

  } catch (error) {
    console.error('Join circle by code error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
