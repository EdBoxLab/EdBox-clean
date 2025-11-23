import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET all study circles
export async function GET(request: Request) {
  console.log('=== Study Circles GET Called ===');
  
  try {
    console.log('1. Creating Supabase client...');
    const supabase = await createSupabaseServerClient();
    console.log('✓ Supabase client created');

    console.log('2. Getting user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('✓ User:', user?.id, 'Error:', userError);
    
    if (userError) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('3. Fetching all circles...');
    
    // Get ALL circles
    const { data: allCircles, error: allCirclesError } = await supabase
      .from('circles')
      .select('id, name, description, created_at, creator_id')
      .order('created_at', { ascending: false });

    if (allCirclesError) {
      console.error('❌ All circles fetch error:', allCirclesError);
      return NextResponse.json({ error: 'Failed to fetch circles' }, { status: 500 });
    }

    console.log('✓ All circles fetched:', allCircles?.length);

    console.log('4. Getting member counts...');
    
    // Get member counts for all circles
    const { data: memberCounts, error: memberCountsError } = await supabase
      .from('circle_members')
      .select('circle_id');

    if (memberCountsError) {
      console.error('❌ Member counts error:', memberCountsError);
    }

    console.log('5. Getting user memberships...');
    
    // Get circles the user is a member of
    const { data: userMemberships, error: membershipsError } = await supabase
      .from('circle_members')
      .select('circle_id')
      .eq('user_id', user.id);

    if (membershipsError) {
      console.error('❌ Memberships error:', membershipsError);
    }

    console.log('✓ User memberships:', userMemberships?.length);

    // Create a map of member counts
    const countMap: Record<string, number> = {};
    memberCounts?.forEach(m => {
      countMap[m.circle_id] = (countMap[m.circle_id] || 0) + 1;
    });

    // Create a set of circles the user is a member of
    const userCircleIds = new Set(userMemberships?.map(m => m.circle_id) || []);

    console.log('6. Enriching circle data...');

    // Enrich circles with member_count and is_member
    const enrichedCircles = allCircles?.map(circle => ({
      ...circle,
      member_count: countMap[circle.id] || 0,
      is_member: userCircleIds.has(circle.id),
    })) || [];

    console.log('✓ Enriched circles:', enrichedCircles.length);

    return NextResponse.json(enrichedCircles, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('❌ FULL ERROR:', error);
    console.error('❌ ERROR STACK:', (error as Error).stack);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST - Create a new study circle
export async function POST(request: Request) {
  console.log('=== Study Circles POST Called ===');
  
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

    console.log('Creating circle:', { name, description });

    // Create the circle
    const { data: newCircle, error: createError } = await supabase
      .from('circles')
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

    console.log('✓ Circle created:', newCircle.id);

    // Add creator as a member
    const { error: memberError } = await supabase
      .from('circle_members')
      .insert([{ 
        circle_id: newCircle.id, 
        user_id: user.id 
      }]);

    if (memberError) {
      console.error('Add creator as member error:', memberError);
    } else {
      console.log('✓ Creator added as member');
    }

    return NextResponse.json(newCircle, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('❌ Create circle error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    );
  }
}