// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';

type ChatRole = 'system' | 'user' | 'assistant' | 'tool' | 'developer' | 'function';
console.log("ENV:", process.env.GROK_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // Secure auth (use getUser which verifies with Supabase Auth server)
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request JSON safely
        let body: any;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const { conversationId, message } = body ?? {};
        if (!message || !(typeof message === 'string') || !message.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Create Supabase conversation if missing
        let currentConversationId = conversationId;
        if (!currentConversationId) {
            const { data: newConversation, error: convError } = await supabase
                .from('chat_conversations')
                .insert({
                    user_id: user.id,
                    title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
                })
                .select()
                .single();

            if (convError) throw convError;
            currentConversationId = (newConversation as any).id;
        }

        // Save user message
        const { data: userMessageData, error: userMsgError } = await supabase
            .from('chat_messages')
            .insert({
                conversation_id: currentConversationId,
                role: 'user',
                content: message,
            })
            .select('id')
            .single();

        if (userMsgError) throw userMsgError;

        // Fetch profile for personalization (optional)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('education, country, age')
            .eq('id', user.id)
            .single();

        if (profileError) {
            // don't fail the whole request for missing profile; just log
            console.warn('Profile fetch error:', profileError);
        }

        const educationLevel = (profile as any)?.education || 'General Learner';
        const userCountry = (profile as any)?.country || 'Global';
        const userAge = (profile as any)?.age ? `, Age: ${(profile as any).age}` : '';

        // Get recent conversation history for context (exclude the message we just inserted)
        const { data: recentHistory } = await supabase
            .from('chat_messages')
            .select('role, content, id, created_at')
            .eq('conversation_id', currentConversationId)
            .neq('id', (userMessageData as any).id)
            .order('created_at', { ascending: false })
            .limit(30);

        const history = recentHistory ? [...recentHistory].reverse() : [];

        // Build messages array with strict literal roles and string content
        const conversationHistory: Array<{ role: ChatRole; content: string }> = history.map((msg: any) => {
            const role: ChatRole = msg.role === 'user' ? 'user' : 'assistant';
            return { role, content: String(msg.content ?? '') };
        });

        const systemPrompt = `Role: Act as a student companion for EdBox — part mentor, part friend, part challenger.
User education: ${educationLevel}
User country: ${userCountry}${userAge}
Be concise, help with code and curriculum, ask clarifying questions only when necessary.`;

        // Create Groq client at request-time (prevents server import-time crash)
        const groqApiKey =
            process.env.GROQ_API_KEY ?? 
            process.env.GROQ_API_KEY_3 ?? 
            process.env.GROQ_API_KEY_4;

        if (!groqApiKey) {
            // Return a helpful error JSON instead of crashing the server

            return NextResponse.json(
                { error: 'GROQ API key not configured. Set up your GROQ API key in your .env.local.' },
                { status: 500 }
            );
        }

        const groq = new Groq({ apiKey: groqApiKey });

        // pick model from env or fallback
        const model = process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';

        // Build final messages array (system + history + current user message)
        const messages: Array<{ role: ChatRole; content: string }> = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: String(message) },
        ];

        // Groq SDK types can be strict; cast at call site to avoid TS mismatch while keeping runtime shape correct
        const completion = await groq.chat.completions.create({
            messages: messages as any, // runtime shape is correct; cast to satisfy TS declarations
            model,
            temperature: 0.7,
            max_tokens: 1000,
        } as any);

        const aiResponse =
            (completion as any)?.choices?.[0]?.message?.content ?? 
            "I apologize, I couldn't generate a response.";

        // Save AI response
        const { error: aiMsgError } = await supabase.from('chat_messages').insert({
            conversation_id: currentConversationId,
            role: 'assistant',
            content: aiResponse,
        });

        if (aiMsgError) throw aiMsgError;

        return NextResponse.json({
            conversationId: currentConversationId,
            response: aiResponse,
        });
    } catch (error: any) {
        console.error('Full Error Object:', JSON.stringify(error, null, 2));

        console.error('Chat API error:', error);
        const status = error?.status ?? 500;
        return NextResponse.json(
            { error: error?.message ?? 'Failed to process chat message' },
            { status }
        );
    }
}

// GET endpoint to fetch conversation history
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');

        if (conversationId) {
            const { data: messages, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return NextResponse.json({ messages });
        } else {
            const { data: conversations, error } = await supabase
                .from('chat_conversations')
                .select('*, chat_messages(count)')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return NextResponse.json({ conversations });
        }
    } catch (error: any) {
        console.error('Chat GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}

// DELETE endpoint to delete a conversation
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');

        if (!conversationId) {
            return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
        }

        // Verify ownership
        const { data: conversation } = await supabase
            .from('chat_conversations')
            .select('user_id')
            .eq('id', conversationId)
            .single();

        if (!conversation || conversation.user_id !== user.id) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Delete messages first (cascade might not be configured)
        await supabase
            .from('chat_messages')
            .delete()
            .eq('conversation_id', conversationId);

        // Delete conversation
        const { error } = await supabase
            .from('chat_conversations')
            .delete()
            .eq('id', conversationId)
            .eq('user_id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Chat DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }
}

// PATCH endpoint to rename a conversation
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body: any;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const { conversationId, title } = body ?? {};

        if (!conversationId || !title || typeof title !== 'string' || !title.trim()) {
            return NextResponse.json({ error: 'conversationId and title are required' }, { status: 400 });
        }

        // Update conversation title with ownership check
        const { error } = await supabase
            .from('chat_conversations')
            .update({ title: title.trim() })
            .eq('id', conversationId)
            .eq('user_id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Chat PATCH error:', error);
        return NextResponse.json({ error: 'Failed to rename conversation' }, { status: 500 });
    }
}