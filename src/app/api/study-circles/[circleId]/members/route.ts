import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/admin';

// GET - Get all members of a circle with their profiles
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ circleId: string }> }
) {
  try {
    const { circleId } = await context.params;
    const numericCircleId = parseInt(circleId, 10);

    const supabase = createServerSupabaseClient();

    // First, get member user IDs
    const { data: memberData, error: memberError } = await supabase
      .from('circle_members')
      .select('user_id, joined_at')
      .eq('circle_id', numericCircleId);

    if (memberError) throw memberError;

    if (!memberData || memberData.length === 0) {
      return NextResponse.json([]);
    }

    // Get user IDs
    const userIds = memberData.map(m => m.user_id);

    // Then fetch profiles for those users
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      // Continue without profiles if they fail to fetch
    }

    // Create a map of profiles by user ID
    const profileMap = new Map();
    if (profileData) {
      profileData.forEach(p => profileMap.set(p.id, p));
    }

    // Combine member data with profiles
    const members = memberData.map((m: any) => {
      const profile = profileMap.get(m.user_id);
      return {
        id: m.user_id,
        full_name: profile?.full_name || 'Anonymous',
        avatar_url: profile?.avatar_url,
        joined_at: m.joined_at
      };
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

// POST - Add a member to a circle
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ circleId: string }> } // ✅ App Router requires params to be a Promise
) {
  try {
    const { circleId } = await context.params;
    const numericCircleId = parseInt(circleId, 10);
    if (isNaN(numericCircleId)) {
      return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is already a member
    const { data: existingMember, error: checkError } = await supabase
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', numericCircleId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking membership:', checkError);
      return NextResponse.json({ error: 'Failed to process membership' }, { status: 500 });
    }

    if (existingMember) {
      return NextResponse.json({ message: 'User is already a member' }, { status: 200 });
    }

    // Add user to the circle
    const { error: insertError } = await supabase
      .from('circle_members')
      .insert({
        circle_id: numericCircleId,
        user_id: user.id,
        joined_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error joining circle:', insertError);
      return NextResponse.json({ error: 'Failed to join circle' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Successfully joined circle' }, { status: 201 });
  } catch (error) {
    console.error('Join circle error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a member from a circle
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ circleId: string }> } // ✅ params must be a Promise
) {
  try {
    const { circleId } = await context.params;
    const numericCircleId = parseInt(circleId, 10);
    if (isNaN(numericCircleId)) {
      return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove user from the circle
    const { error: deleteError } = await supabase
      .from('circle_members')
      .delete()
      .eq('circle_id', numericCircleId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error leaving circle:', deleteError);
      return NextResponse.json({ error: 'Failed to leave circle' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Successfully left circle' }, { status: 200 });
  } catch (error) {
    console.error('Leave circle error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
