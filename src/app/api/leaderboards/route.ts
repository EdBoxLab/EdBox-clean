import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // For now, we'll just fetch the all-time leaderboards.
    // The timeframe parameter can be used in the future to fetch daily/weekly data.
    const { data: users, error: usersError } = await supabase.rpc('get_top_users', { limit_count: 10 });
    if (usersError) throw usersError;

    const { data: circles, error: circlesError } = await supabase.rpc('get_top_circles', { limit_count: 5 });
    if (circlesError) throw circlesError;

    // We need to know the current user's rank as well, even if they are not in the top 10
    // Let's create another function for that later. For now, we just add the `isUser` flag.
    const leaderboardUsers = users.map(u => ({ ...u, isUser: u.user_id === user.id }));

    return NextResponse.json({ users: leaderboardUsers, circles });

  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
