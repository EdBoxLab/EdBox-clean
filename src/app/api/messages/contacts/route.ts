import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get contacts from recent conversations
    const { data: conversations, error } = await supabase
      .from('messages')
      .select(`
        sender_id,
        recipient_id,
        profiles!messages_sender_id_fkey(id, full_name, avatar_url),
        profiles!messages_recipient_id_fkey(id, full_name, avatar_url)
      `)
      .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to get conversations:', error);
      return NextResponse.json(
        { error: 'Failed to get contacts' },
        { status: 500 }
      );
    }

    // Extract unique contacts
    const contactsMap = new Map();
    
    conversations?.forEach((msg: any) => {
      // Add sender if not current user
      if (msg.sender_id !== session.user.id && !contactsMap.has(msg.sender_id)) {
        const profile = msg.profiles;
        if (profile) {
          contactsMap.set(msg.sender_id, {
            id: msg.sender_id,
            name: profile.full_name || 'Unknown User',
            avatar: profile.avatar_url
          });
        }
      }
      
      // Add recipient if not current user
      if (msg.recipient_id !== session.user.id && !contactsMap.has(msg.recipient_id)) {
        const profile = msg.profiles;
        if (profile) {
          contactsMap.set(msg.recipient_id, {
            id: msg.recipient_id,
            name: profile.full_name || 'Unknown User',
            avatar: profile.avatar_url
          });
        }
      }
    });

    // Also get contacts from study circle members
    const { data: circleMembers } = await supabase
      .from('circle_members')
      .select(`
        user_id,
        profiles(id, full_name, avatar_url)
      `)
      .neq('user_id', session.user.id);

    circleMembers?.forEach((member: any) => {
      if (!contactsMap.has(member.user_id) && member.profiles) {
        contactsMap.set(member.user_id, {
          id: member.user_id,
          name: member.profiles.full_name || 'Unknown User',
          avatar: member.profiles.avatar_url
        });
      }
    });

    const contacts = Array.from(contactsMap.values());

    return NextResponse.json({ 
      contacts: contacts.slice(0, 20) // Limit to 20 most recent contacts
    });

  } catch (error) {
    console.error('Contacts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}