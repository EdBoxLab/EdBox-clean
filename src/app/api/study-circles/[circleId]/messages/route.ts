import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/admin';

// GET - Get all messages for a circle
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ circleId: string }> }
) {
  const supabaseAuth = await createSupabaseServerClient();  // For auth
  const supabaseAdmin = createServerSupabaseClient();       // For queries (bypasses RLS)
  
  const { circleId } = await context.params;
  const numericCircleId = Number(circleId);

  try {
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify membership using admin client
    const { data: memberCheck, error: memberError } = await supabaseAdmin
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', numericCircleId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError) {
      console.error('Member check error:', memberError);
      return NextResponse.json({ error: 'Failed to verify membership' }, { status: 500 });
    }

    if (!memberCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use admin client for RPC call
    const { data, error } = await supabaseAdmin.rpc('get_messages_for_circle', { 
      p_circle_id: numericCircleId 
    });

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
  context: { params: Promise<{ circleId: string }> }
) {
  const supabaseAuth = await createSupabaseServerClient();  // For auth
  const supabaseAdmin = createServerSupabaseClient();       // For queries (bypasses RLS)
  
  const { circleId } = await context.params;
  const numericCircleId = Number(circleId);

  try {
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify membership using admin client
    const { data: memberCheck, error: memberError } = await supabaseAdmin
      .from('circle_members')
      .select('user_id')
      .eq('circle_id', numericCircleId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError) {
      console.error('Member check error:', memberError);
      return NextResponse.json({ error: 'Failed to verify membership' }, { status: 500 });
    }

    if (!memberCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { content, username, shared_content, mentions } = await request.json();

    if (!content && !shared_content) {
      return NextResponse.json({ error: 'Message content or shared content is required' }, { status: 400 });
    }

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Use admin client for insert
    const messageData: any = { 
      content: content || '', 
      user_id: user.id, 
      circle_id: numericCircleId, 
      username 
    };

    // Add shared content if provided
    if (shared_content) {
      messageData.shared_content = shared_content;
    }
    
    // Add mentions if provided
    if (mentions) {
      messageData.mentions = mentions;
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert([messageData])
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