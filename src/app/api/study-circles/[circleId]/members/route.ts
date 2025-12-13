import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// POST - Add a member to a circle
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ circleId: string }> } // ✅ App Router requires params to be a Promise
) {
  try {
    const { circleId } = await context.params;
    const numericCircleId = parseInt(circleId, 10);
    if (isNaN(numericCircleId)) {
      return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is already a member
    const { data: existingMember, error: checkError } = await supabase
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', numericCircleId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking membership:', checkError);
      return NextResponse.json({ error: 'Failed to process membership' }, { status: 500 });
    }

    if (existingMember) {
      return NextResponse.json({ message: 'User is already a member' }, { status: 200 });
    }

    // Add user to the circle
    const { error: insertError } = await supabase
      .from('circle_members')
      .insert({
        circle_id: numericCircleId,
        user_id: user.id,
      });

    if (insertError) {
      console.error('Error joining circle:', insertError);
      return NextResponse.json({ error: 'Failed to join circle' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Successfully joined circle' }, { status: 201 });
  } catch (error) {
    console.error('Join circle error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a member from a circle
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ circleId: string }> } // ✅ params must be a Promise
) {
  try {
    const { circleId } = await context.params;
    const numericCircleId = parseInt(circleId, 10);
    if (isNaN(numericCircleId)) {
      return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove user from the circle
    const { error: deleteError } = await supabase
      .from('circle_members')
      .delete()
      .eq('circle_id', numericCircleId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error leaving circle:', deleteError);
      return NextResponse.json({ error: 'Failed to leave circle' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Successfully left circle' }, { status: 200 });
  } catch (error) {
    console.error('Leave circle error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
