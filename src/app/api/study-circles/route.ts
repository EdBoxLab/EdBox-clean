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
    console.log('Env check:', {
  hasPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasPublicKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  hasUrl: !!process.env.SUPABASE_URL,
  hasKey: !!process.env.SUPABASE_ANON_KEY
});
    // ✅ Changed from 'circles' to 'study_circles'
    const { data: allCircles, error: allCirclesError } = await supabase
      .from('study_circles')
      .select('id, name, description, created_at, creator_id')
      .order('created_at', { ascending: false });

    if (allCirclesError) {
      console.error('All circles fetch error:', allCirclesError);
      return NextResponse.json({ error: 'Failed to fetch circles' }, { status: 500 });
    }

    // Get member counts for all circles
    const { data: memberCounts, error: memberCountsError } = await supabase
      .from('circle_members')
      .select('circle_id');

    if (memberCountsError) {
      console.error('Member counts error:', memberCountsError);
    }

    // Get circles the user is a member of
    const { data: userMemberships, error: membershipsError } = await supabase
      .from('circle_members')
      .select('circle_id')
      .eq('user_id', user.id);

    if (membershipsError) {
      console.error('Memberships error:', membershipsError);
    }

    // Create a map of member counts
    const countMap: Record<string, number> = {};
    memberCounts?.forEach(m => {
      countMap[m.circle_id] = (countMap[m.circle_id] || 0) + 1;
    });

    // Create a set of circles the user is a member of
    const userCircleIds = new Set(userMemberships?.map(m => m.circle_id) || []);

    // Enrich circles with member_count and is_member
    const enrichedCircles = allCircles?.map(circle => ({
      ...circle,
      member_count: countMap[circle.id] || 0,
      is_member: userCircleIds.has(circle.id),
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

    // ✅ Changed from 'circles' to 'study_circles'
    const { data: newCircle, error: createError } = await supabase
      .from('study_circles')
      .insert([{ 
        name: name.trim(), 
        description: description?.trim() || null,
        creator_id: user.id 
      }])
      .select()
      .single();

    if (createError) {
      console.error('Create circle error:', createError);
      return NextResponse.json({ error: 'Failed to create circle' }, { status: 500 });
    }

    // Add creator as a member
    const { error: memberError } = await supabase
      .from('circle_members')
      .insert([{ 
        circle_id: newCircle.id, 
        user_id: user.id 
      }]);

    if (memberError) {
      console.error('Add creator as member error:', memberError);
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