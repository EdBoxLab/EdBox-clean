import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: creators, error } = await supabase.rpc('get_creators', { limit_count: 20 });
    if (error) throw error;
    
    // Check which of these creators the current user is following
    const creatorIds = creators.map(c => c.user_id);
    const { data: following, error: followingError } = await supabase
        .from('followers')
        .select('followed_id')
        .in('followed_id', creatorIds)
        .eq('follower_id', user.id);

    if (followingError) throw followingError;

    const followingIds = new Set(following.map(f => f.followed_id));
    const creatorsWithFollowingStatus = creators.map(c => ({
        ...c,
        is_following: followingIds.has(c.user_id),
    }));

    return NextResponse.json(creatorsWithFollowingStatus);

  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
