import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invite_code } = await request.json();

    if (!invite_code || invite_code.trim() === '') {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    const { data: circle, error: circleError } = await supabase
      .from('study_circles')
      .select('id, name')
      .eq('invite_code', invite_code.trim().toUpperCase())
      .single();

    if (circleError || !circle) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

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
