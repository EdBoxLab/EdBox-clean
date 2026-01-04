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

    // Enrich messages with shared content
    const enrichedMessages = await Promise.all(
      messages.map(async (msg: any) => {
        // If message has shared_content array (legacy/old format), return as-is
        if (msg.shared_content && Array.isArray(msg.shared_content) && msg.shared_content.length > 0) {
          return msg;
        }

        // If message has shared_content_ids, fetch actual content
        if (msg.shared_content_ids && msg.shared_content_ids.length > 0) {
          const { data: sharedEntries } = await supabaseAdmin
            .from('shared_content')
            .select('*')
            .in('id', msg.shared_content_ids);

          if (sharedEntries && sharedEntries.length > 0) {
            // Fetch actual study kit data for each entry
            const fullContent = await Promise.all(
              sharedEntries.map(async (entry) => {
                if (entry.content_type === 'study_kit') {
                  const { data: kit } = await supabaseAdmin
                    .from('study_kit_content')
                    .select('id, title')
                    .eq('id', entry.content_id)
                    .single();

                  return kit ? {
                    ...kit,
                    type: 'study-kit',
                    description: 'Study Kit'
                  } : null;
                } else if (entry.content_type === 'course') {
                  const { data: course } = await supabaseAdmin
                    .from('skill_graphs')
                    .select('id, goal')
                    .eq('id', entry.content_id)
                    .single();

                  return course ? {
                    id: course.id,
                    title: course.goal,
                    type: 'course',
                    description: 'Learning Path'
                  } : null;
                }
                return null;
              })
            );

            return {
              ...msg,
              shared_content: fullContent.filter(Boolean)
            };
          }
        }

        return msg;
      })
    );

    return NextResponse.json(enrichedMessages, { status: 200 });
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

    const { content, username, shared_content, shared_content_ids, mentions } = await request.json();

    if (!content && !shared_content && !shared_content_ids) {
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

    // Add shared content ids if provided
    if (shared_content_ids) {
      messageData.shared_content_ids = shared_content_ids;
    }

    // Add legacy shared content if provided (for backward compat if needed, though we prefer IDs)
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

// DELETE - Delete a message (user can only delete their own messages)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ circleId: string }> }
) {
  const supabaseAuth = await createSupabaseServerClient();
  const supabaseAdmin = createServerSupabaseClient();

  const { circleId } = await context.params;
  const numericCircleId = Number(circleId);

  try {
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get message ID from URL search params
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Delete the message (only if it belongs to the user)
    const { error: deleteError, count } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', user.id)
      .eq('circle_id', numericCircleId);

    if (deleteError) {
      console.error('Delete message error:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ success: true, message: 'Message deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}