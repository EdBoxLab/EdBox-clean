import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET all messages for a circle
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = await params;
    
    const circleId = parseInt(id, 10);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a member
    const { data: memberCheck } = await supabase
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', circleId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!memberCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get messages
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('circle_id', circleId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fetch messages error:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json(data || [], { status: 200 });

  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST a new message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = await params;
    
    const circleId = parseInt(id, 10);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a member
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
      return NextResponse.json(
        { error: 'Message content and username are required' }, 
        { status: 400 }
      );
    }

    // Insert message
    const { data, error } = await supabase
      .from('messages')
      .insert([{ 
        content, 
        user_id: user.id, 
        circle_id: circleId, 
        username 
      }])
      .select()
      .single();
      
    if (error) {
      console.error('Insert message error:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    );
  }
}