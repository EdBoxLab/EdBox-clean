import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET all study circles for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user || !user.id) {
      // Capture cookie names to help debug missing session state (do NOT log cookie values)
      try {
        const headers = await import('next/headers');
        const cookieStore = await headers.cookies();
        const cookieNames = cookieStore.getAll().map((c: any) => c.name);
        const supabaseCookiePresent = cookieNames.some((n: any) => /supabase|sb/i.test(n));
        console.warn('Unauthorized request - missing user id', { user, userError, cookieNames, supabaseCookiePresent });
      } catch (cookieErr) {
        console.warn('Unauthorized request - missing user id', { user, userError });
      }

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
    if (userError || !user || !user.id) {
      // Capture cookie names to help debug missing session state (do NOT log cookie values)
      try {
        const headers = await import('next/headers');
        const cookieStore = await headers.cookies();
        const cookieNames = cookieStore.getAll().map((c: any) => c.name);
        const supabaseCookiePresent = cookieNames.some((n: any) => /supabase|sb/i.test(n));
        console.warn('Unauthorized request - missing user id', { user, userError, cookieNames, supabaseCookiePresent });
      } catch (cookieErr) {
        console.warn('Unauthorized request - missing user id', { user, userError });
      }

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
    const memberPayload = { circle_id: newCircle.id, user_id: user.id, is_admin: true, joined_at: new Date().toISOString() };
    try {
      const { error: memberError } = await supabase.from('circle_members').insert([memberPayload]);
      if (memberError) {
        console.error('Add creator as admin error:', memberError, { payload: memberPayload });

        // Attempt to roll back the created circle to avoid orphaned circles when member insert fails
        try {
          await supabase.from('study_circles').delete().eq('id', newCircle.id);
          console.warn('Rolled back circle creation due to member insert failure', { circleId: newCircle.id });
        } catch (rollbackErr) {
          console.error('Failed to roll back circle after member insert failure', rollbackErr);
        }

        // If user_id null error, provide more actionable message
        if (memberError.code === '23502' || /null value in column "user_id"/.test(memberError.message || '')) {
          return NextResponse.json({ error: 'Creator user id is missing; cannot add member' }, { status: 500 });
        }

        return NextResponse.json({ error: 'Failed to add creator as admin' }, { status: 500 });
      }
    } catch (err) {
      console.error('Unexpected error adding creator as admin:', err, { payload: memberPayload });
      try {
        await supabase.from('study_circles').delete().eq('id', newCircle.id);
        console.warn('Rolled back circle creation due to unexpected member insert exception', { circleId: newCircle.id });
      } catch (rollbackErr) {
        console.error('Failed to roll back circle after unexpected member insert exception', rollbackErr);
      }
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
