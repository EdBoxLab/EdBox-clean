

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { id } = await params; // ✅ Await params

  try {
    const circleId = parseInt(id, 10);
    if (isNaN(circleId)) {
      return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
    }

    // ✅ Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Check membership
    const { data: memberCheck, error: memberCheckError } = await supabase
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', circleId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberCheckError) {
      console.error('Member check error:', memberCheckError);
      return NextResponse.json({ error: 'Failed to verify membership' }, { status: 500 });
    }
    if (!memberCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ✅ Get circle details - WITHOUT .single() to avoid issues
    const { data: circleDetailsRaw, error: detailsError } = await supabase
      .rpc('get_circle_details', { p_circle_id: circleId });

    if (detailsError) {
      console.error('Circle details RPC error:', detailsError);
      return NextResponse.json({ error: 'Failed to fetch circle details' }, { status: 500 });
    }

    // Handle array or single object response
    const circleDetails = Array.isArray(circleDetailsRaw) 
      ? circleDetailsRaw[0] 
      : circleDetailsRaw;
    
    if (!circleDetails) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    // ✅ Get circle members
    const { data: circleMembersRaw, error: membersError } = await supabase
      .rpc('get_circle_members', { p_circle_id: circleId });

    if (membersError) {
      console.error('Circle members RPC error:', membersError);
      // Don't fail the whole request, just return empty members
    }

    // Ensure members is always an array
    const circleMembers = Array.isArray(circleMembersRaw) 
      ? circleMembersRaw 
      : [];

    // ✅ Always return valid JSON with explicit status
    const response = {
      ...circleDetails,
      members: circleMembers,
    };

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Circle API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    );
  }
}
