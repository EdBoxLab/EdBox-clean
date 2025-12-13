import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ circleId: string }> } // ✅ params must be a Promise
) {
  try {
    const { circleId } = await context.params; // ✅ unwrap the circleId
    const numericCircleId = parseInt(circleId, 10);
    if (isNaN(numericCircleId)) {
      return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // Fetch user via SSR cookies
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, target_user_id } = await request.json();
    if (!action || !target_user_id) {
      return NextResponse.json({ error: 'Missing action or target_user_id' }, { status: 400 });
    }

    // Check if requester is admin
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from('circle_members')
      .select('is_admin')
      .eq('circle_id', numericCircleId)
      .eq('user_id', user.id)
      .single();

    if (adminCheckError || !adminCheck?.is_admin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    // Perform action
    if (action === 'promote') {
      const { error: updateError } = await supabase
        .from('circle_members')
        .update({ is_admin: true })
        .eq('circle_id', numericCircleId)
        .eq('user_id', target_user_id);

      if (updateError) throw updateError;
      return NextResponse.json({ success: true, message: 'User promoted to admin' });
    } else if (action === 'demote') {
      const { error: updateError } = await supabase
        .from('circle_members')
        .update({ is_admin: false })
        .eq('circle_id', numericCircleId)
        .eq('user_id', target_user_id);

      if (updateError) throw updateError;
      return NextResponse.json({ success: true, message: 'User demoted from admin' });
    } else if (action === 'remove') {
      const { error: deleteError } = await supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', numericCircleId)
        .eq('user_id', target_user_id);

      if (deleteError) throw deleteError;
      return NextResponse.json({ success: true, message: 'Member removed from circle' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
