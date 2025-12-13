import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET - Get all messages for a circle
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ circleId: string }> } // App Router requires params to be a Promise
) {
  const supabase = await createSupabaseServerClient();
  const { circleId } = await context.params; // ✅ Await the Promise

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify membership
    const { data: memberCheck } = await supabase
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', circleId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!memberCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase.rpc('get_messages_for_circle', { p_circle_id: circleId });

    if (error) {
      console.error('RPC error:', error);
      throw error;
    }

    const messages = Array.isArray(data) ? data : [];
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// POST - Post a new message to a circle
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ circleId: string }> } // App Router requires params to be a Promise
) {
  const supabase = await createSupabaseServerClient();
  const { circleId } = await context.params; // ✅ Await the Promise

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify membership
    const { data: memberCheck } = await supabase
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', circleId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!memberCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { content, username } = await request.json();

    if (!content || !username) {
      return NextResponse.json({ error: 'Message content and username are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([{ content, user_id: user.id, circle_id: circleId, username }])
      .select()
      .single();

    if (error) {
      console.error('Insert message error:', error);
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Post message error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
