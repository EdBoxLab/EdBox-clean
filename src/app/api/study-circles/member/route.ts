import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { circleId, targetUserId } = await req.json();
  if (!circleId || !targetUserId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const selfAction = user.id === targetUserId;

  const { data: requester } = await supabase
    .from('circle_members')
    .select('is_admin')
    .eq('circle_id', circleId)
    .eq('user_id', user.id)
    .single();

  if (!selfAction && !requester?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: circle } = await supabase
    .from('study_circles')
    .select('creator_id')
    .eq('id', circleId)
    .single();

  if (circle?.creator_id === targetUserId) {
    return NextResponse.json({ error: 'Creator cannot be removed' }, { status: 400 });
  }

  const { error } = await supabase
    .from('circle_members')
    .delete()
    .eq('circle_id', circleId)
    .eq('user_id', targetUserId);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
