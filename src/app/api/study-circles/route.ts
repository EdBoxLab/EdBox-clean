import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET all study circles
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get only circles where user is a member
    const { data: userMemberships, error: membershipsError } = await supabase
      .from('circle_members')
      .select('circle_id, is_admin')
      .eq('user_id', user.id);

    if (membershipsError) {
      console.error('Memberships error:', membershipsError);
      return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
    }

    if (!userMemberships || userMemberships.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const circleIds = userMemberships.map(m => m.circle_id);
    const adminMap = new Map(userMemberships.map(m => [m.circle_id, m.is_admin]));

    // Fetch only circles user is a member of
    const { data: circles, error: circlesError } = await supabase
      .from('study_circles')
      .select('id, name, description, created_at, creator_id, invite_code')
      .in('id', circleIds)
      .order('created_at', { ascending: false });

    if (circlesError) {
      console.error('Circles fetch error:', circlesError);
      return NextResponse.json({ error: 'Failed to fetch circles' }, { status: 500 });
    }

    // Get member counts for circles
    const { data: memberCounts, error: memberCountsError } = await supabase
      .from('circle_members')
      .select('circle_id')
      .in('circle_id', circleIds);

    if (memberCountsError) {
      console.error('Member counts error:', memberCountsError);
    }

    // Create a map of member counts
    const countMap: Record<string, number> = {};
    memberCounts?.forEach(m => {
      countMap[m.circle_id] = (countMap[m.circle_id] || 0) + 1;
    });

    // Enrich circles with member_count, is_member, and is_admin
    const enrichedCircles = circles?.map(circle => ({
      ...circle,
      member_count: countMap[circle.id] || 0,
      is_member: true,
      is_admin: adminMap.get(circle.id) || false,
    })) || [];

    return NextResponse.json(enrichedCircles, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Study circles error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST - Create a new study circle
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Circle name is required' }, { status: 400 });
    }

    // Generate unique invite code
    const { data: inviteCodeData, error: inviteCodeError } = await supabase
      .rpc('generate_invite_code');

    if (inviteCodeError) {
      console.error('Generate invite code error:', inviteCodeError);
      return NextResponse.json({ error: 'Failed to generate invite code' }, { status: 500 });
    }

    // Create circle with invite code
    const { data: newCircle, error: createError } = await supabase
      .from('study_circles')
      .insert([{ 
        name: name.trim(), 
        description: description?.trim() || null,
        creator_id: user.id,
        invite_code: inviteCodeData
      }])
      .select()
      .single();

    if (createError) {
      console.error('Create circle error:', createError);
      return NextResponse.json({ error: 'Failed to create circle' }, { status: 500 });
    }

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('circle_members')
      .insert([{ 
        circle_id: newCircle.id, 
        user_id: user.id,
        is_admin: true
      }]);

    if (memberError) {
      console.error('Add creator as admin error:', memberError);
      return NextResponse.json({ error: 'Failed to add creator as admin' }, { status: 500 });
    }

    return NextResponse.json(newCircle, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Create circle error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    );
  }
}