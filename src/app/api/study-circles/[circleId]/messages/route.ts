import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Get all messages for a circle
export async function GET(request: Request, { params }: { params: { circleId: string } }) {
  const supabase = createSupabaseServerClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const circleId = params.circleId;

    const { data, error } = await supabase.rpc('get_messages_for_circle', { p_circle_id: circleId });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// Post a new message to a circle
export async function POST(request: Request, { params }: { params: { circleId: string } }) {
  const supabase = createSupabaseServerClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const circleId = params.circleId;
    const { content, username } = await request.json();

    if (!content || !username) {
        return NextResponse.json({ error: 'Message content and username are required' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('messages')
        .insert([{ content, user_id: user.id, circle_id: circleId, username }])
        .select()
        .single();
        
    if (error) throw error;

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
