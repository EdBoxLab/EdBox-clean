import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET all study circles for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from('circle_members')
      .select('circle_id, is_admin')
      .eq('user_id', user.id);

    if (membershipsError) {
      console.error('Membership fetch error:', membershipsError);
      return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const circleIds = memberships.map(m => m.circle_id);
    const adminMap = new Map(memberships.map(m => [m.circle_id, m.is_admin]));

    // Fetch circle details
    const { data: circles, error: circlesError } = await supabase
      .from('study_circles')
      .select('id, name, description, created_at, creator_id, invite_code')
      .in('id', circleIds)
      .order('created_at', { ascending: false });

    if (circlesError) {
      console.error('Circles fetch error:', circlesError);
      return NextResponse.json({ error: 'Failed to fetch circles' }, { status: 500 });
    }

    // Fetch member counts
    const { data: members, error: membersError } = await supabase
      .from('circle_members')
      .select('circle_id')
      .in('circle_id', circleIds);

    const countMap: Record<string, number> = {};
    members?.forEach(m => {
      countMap[m.circle_id] = (countMap[m.circle_id] || 0) + 1;
    });

    const enrichedCircles = circles?.map(circle => ({
      ...circle,
      member_count: countMap[circle.id] || 0,
      is_member: true,
      is_admin: adminMap.get(circle.id) || false
    })) || [];

    return NextResponse.json(enrichedCircles, { status: 200 });
  } catch (error) {
    console.error('Study circles GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - create a new study circle
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = body?.name?.trim();
    const description = body?.description?.trim() || null;

    if (!name) {
      return NextResponse.json({ error: 'Circle name is required' }, { status: 400 });
    }

    // Generate invite code
    const { data: inviteCodeData, error: inviteCodeError } = await supabase.rpc('generate_invite_code');
    if (inviteCodeError) {
      console.error('Invite code generation error:', inviteCodeError);
      return NextResponse.json({ error: 'Failed to generate invite code' }, { status: 500 });
    }

    // Create circle
    const { data: newCircle, error: createError } = await supabase
      .from('study_circles')
      .insert([{ name, description, creator_id: user.id, invite_code: inviteCodeData }])
      .select()
      .single();

    if (createError || !newCircle) {
      console.error('Circle creation error:', createError);
      return NextResponse.json({ error: 'Failed to create circle' }, { status: 500 });
    }

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('circle_members')
      .insert([{ circle_id: newCircle.id, user_id: user.id, is_admin: true }]);

    if (memberError) {
      console.error('Add creator as admin error:', memberError);
      return NextResponse.json({ error: 'Failed to add creator as admin' }, { status: 500 });
    }

    return NextResponse.json(newCircle, { status: 201 });
  } catch (error) {
    console.error('Study circles POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
