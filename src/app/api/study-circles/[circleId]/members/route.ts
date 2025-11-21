import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Join a circle
export async function POST(request: Request, { params }: { params: { circleId: string } }) {
  const supabase = createSupabaseServerClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const circleId = params.circleId;

    const { error } = await supabase.from('circle_members').insert({ circle_id: circleId, user_id: user.id });
    if (error) throw error;

    return NextResponse.json({ message: 'Successfully joined circle' });

  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// Leave a circle
export async function DELETE(request: Request, { params }: { params: { circleId: string } }) {
  const supabase = createSupabaseServerClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const circleId = params.circleId;

    const { error } = await supabase
      .from('circle_members')
      .delete()
      .match({ circle_id: circleId, user_id: user.id });
      
    if (error) throw error;

    return NextResponse.json({ message: 'Successfully left circle' });

  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
