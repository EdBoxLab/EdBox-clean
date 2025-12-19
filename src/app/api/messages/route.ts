import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId, message, shared_content } = body;

    if (!recipientId || !message) {
      return NextResponse.json({ error: 'Recipient and message are required' }, { status: 400 });
    }

    const messageData: any = {
      sender_id: user.id,
      recipient_id: recipientId,
      message,
      read: false,
    };

    // Add shared content if provided
    if (shared_content) {
      messageData.shared_content = shared_content;
    }

    const { data: newMessage, error: messageError } = await supabase
      .from('direct_messages')
      .insert(messageData)
      .select()
      .single();

    if (messageError) throw messageError;

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.error('Send Message Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationWith = searchParams.get('with');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    if (conversationWith) {
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${conversationWith}),and(sender_id.eq.${conversationWith},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      await supabase
        .from('direct_messages')
        .update({ read: true })
        .eq('recipient_id', user.id)
        .eq('sender_id', conversationWith)
        .eq('read', false);

      return NextResponse.json({ messages });
    } else {
      const query = supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query.eq('recipient_id', user.id).eq('read', false);
      }

      const { data: messages, error } = await query;

      if (error) throw error;

      const conversationsMap = new Map();
      for (const msg of messages) {
        const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            userId: otherUserId,
            lastMessage: msg,
            unreadCount: 0,
          });
        }
        if (msg.recipient_id === user.id && !msg.read) {
          conversationsMap.get(otherUserId).unreadCount++;
        }
      }

      const conversations = Array.from(conversationsMap.values());

      return NextResponse.json({ conversations });
    }
  } catch (error: any) {
    console.error('Get Messages Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, read } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('direct_messages')
      .update({ read: read ?? true })
      .eq('id', messageId)
      .eq('recipient_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: data });
  } catch (error: any) {
    console.error('Mark Message Read Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update message' }, { status: 500 });
  }
}
