import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { circleId: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { circleId } = params;
    
    const numericCircleId = parseInt(circleId, 10);
    if (isNaN(numericCircleId)) {
      return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, target_user_id } = await request.json();

    if (!action || !target_user_id) {
      return NextResponse.json({ error: 'Missing action or target_user_id' }, { status: 400 });
    }

    const { data: adminCheck, error: adminCheckError } = await supabase
      .from('circle_members')
      .select('is_admin')
      .eq('circle_id', numericCircleId)
      .eq('user_id', user.id)
      .single();

    if (adminCheckError || !adminCheck?.is_admin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    if (action === 'promote') {
      const { error: updateError } = await supabase
        .from('circle_members')
        .update({ is_admin: true })
        .eq('circle_id', numericCircleId)
        .eq('user_id', target_user_id);

      if (updateError) {
        console.error('Promote admin error:', updateError);
        return NextResponse.json({ error: 'Failed to promote user' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'User promoted to admin' }, { status: 200 });
    } else if (action === 'demote') {
      const { error: updateError } = await supabase
        .from('circle_members')
        .update({ is_admin: false })
        .eq('circle_id', numericCircleId)
        .eq('user_id', target_user_id);

      if (updateError) {
        console.error('Demote admin error:', updateError);
        return NextResponse.json({ error: 'Failed to demote user' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'User demoted from admin' }, { status: 200 });
    } else if (action === 'remove') {
      const { error: deleteError } = await supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', numericCircleId)
        .eq('user_id', target_user_id);

      if (deleteError) {
        console.error('Remove member error:', deleteError);
        return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Member removed from circle' }, { status: 200 });
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
