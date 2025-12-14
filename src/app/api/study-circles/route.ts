import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/admin';

// =========================
// GET – list study circles
// =========================
export async function GET() {
  try {
    const supabaseAuth = await createSupabaseServerClient();  // For auth only
    const supabaseAdmin = createServerSupabaseClient();       // For queries (bypasses RLS)

    const { data: { user }, error } = await supabaseAuth.auth.getUser();
    if (error || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS issues
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from('circle_members')
      .select('circle_id, is_admin')
      .eq('user_id', user.id);

    if (membershipsError) {
      console.error('Memberships error:', membershipsError);
      return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const circleIds = memberships.map(m => m.circle_id);
    const adminMap = new Map(memberships.map(m => [m.circle_id, m.is_admin]));

    const { data: circles, error: circlesError } = await supabaseAdmin
      .from('study_circles')
      .select('id, name, description, created_at, creator_id, invite_code')
      .in('id', circleIds)
      .order('created_at', { ascending: false });

    if (circlesError) {
      console.error('Circles error:', circlesError);
      return NextResponse.json({ error: 'Failed to fetch circles' }, { status: 500 });
    }

    const { data: members } = await supabaseAdmin
      .from('circle_members')
      .select('circle_id')
      .in('circle_id', circleIds);

    const countMap: Record<string, number> = {};
    members?.forEach(m => {
      countMap[m.circle_id] = (countMap[m.circle_id] || 0) + 1;
    });

    const enriched = circles.map(circle => ({
      ...circle,
      member_count: countMap[circle.id] || 0,
      is_member: true,
      is_admin: adminMap.get(circle.id) || false,
    }));

    return NextResponse.json(enriched, { status: 200 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =========================
// POST – create study circle
// =========================
export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = await createSupabaseServerClient();   // auth
    const supabaseAdmin = createServerSupabaseClient();       // writes

    const { data: { user }, error } = await supabaseAuth.auth.getUser();
    if (error || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const name = body?.name?.trim();
    const description = body?.description?.trim() || null;

    if (!name) {
      return NextResponse.json({ error: 'Circle name is required' }, { status: 400 });
    }

    const { data: inviteCode, error: inviteError } =
      await supabaseAdmin.rpc('generate_invite_code');

    if (inviteError) {
      console.error('Invite code error:', inviteError);
      return NextResponse.json({ error: 'Failed to generate invite code' }, { status: 500 });
    }

    const { data: newCircle, error: createError } = await supabaseAdmin
      .from('study_circles')
      .insert({
        name,
        description,
        creator_id: user.id,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (createError || !newCircle) {
      console.error('Create circle error:', createError);
      return NextResponse.json({ error: 'Failed to create circle' }, { status: 500 });
    }

    const { error: memberError } = await supabaseAdmin
      .from('circle_members')
      .insert({
        circle_id: newCircle.id,
        user_id: user.id,
        is_admin: true,
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error('Add member error:', memberError);
      // rollback
      await supabaseAdmin.from('study_circles').delete().eq('id', newCircle.id);
      return NextResponse.json({ error: 'Failed to add creator as admin' }, { status: 500 });
    }

    return NextResponse.json(newCircle, { status: 201 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}