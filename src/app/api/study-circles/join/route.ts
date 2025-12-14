// app/api/study-circles/join/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { invite_code } = await req.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Prefer RPC if available (prod), but fallback to SQL path for tests and environments without RPC
  if (typeof (supabase as any).rpc === 'function') {
    const { data, error } = await (supabase as any).rpc('join_circle_by_invite', { invite: invite_code });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, circle_id: (data as any)?.circle_id || null }, { status: 201 });
  }

  // Fallback: find circle by invite_code
  const { data: circle, error: circleError } = await supabase
    .from('study_circles')
    .select('id')
    .eq('invite_code', invite_code)
    .single();

  if (circleError || !circle) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', user.id)
    .eq('circle_id', circle.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, circle_id: circle.id }, { status: 200 });
  }

  // Add member
  const { error: insertError } = await supabase
    .from('circle_members')
    .insert({ circle_id: circle.id, user_id: user.id, is_admin: false, joined_at: new Date().toISOString() });

  if (insertError) {
    return NextResponse.json({ error: insertError.message || 'Failed to join circle' }, { status: 500 });
  }

  return NextResponse.json({ success: true, circle_id: circle.id }, { status: 201 });
}
