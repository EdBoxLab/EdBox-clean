import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { conversationId, message } = await request.json();

        if (!message || !message.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        let currentConversationId = conversationId;

        // If no conversation ID, create a new conversation
        if (!currentConversationId) {
            const { data: newConversation, error: convError } = await supabase
                .from('chat_conversations')
                .insert({
                    user_id: session.user.id,
                    title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
                })
                .select()
                .single();

            if (convError) throw convError;
            currentConversationId = newConversation.id;
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

        // Fetch User Profile for Personalization
        const { data: profile } = await supabase
            .from('profiles')
            .select('education, country, age')
            .eq('id', session.user.id)
            .single();

        const educationLevel = profile?.education || 'General Learner';
        const userCountry = profile?.country || 'Global';
        const userAge = profile?.age ? `, Age: ${profile.age}` : '';

        // Get conversation history for context (fetch recent messages)
        const { data: recentHistory } = await supabase
            .from('chat_messages')
            .select('role, content, id')
            .eq('conversation_id', currentConversationId)
            .neq('id', userMessageData.id) // Exclude the current message we just added
            .order('created_at', { ascending: false }) // Get newest first
            .limit(30); // Context window

        // Reverse to get chronological order (oldest -> newest)
        const history = recentHistory ? [...recentHistory].reverse() : [];

        // Build Gemini-style history for Groq (converting roles where necessary)
        const conversationHistory = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
        }));

        // System Prompt with Personalization
        const systemPrompt = `You are an intelligent educational AI assistant for EdBox.
        
        User Context:
        - Education Level: ${educationLevel}
        - Location: ${userCountry}
        ${userAge}
        
        Instructions:
        - Adapt your language and complexity to the user's education level.
        - Use culturally relevant examples based on their location if applicable.
        - Be encouraging, clear, and concise.
        - Provide accurate and helpful educational content.
        `;

        // Generate Response using Groq
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                ...conversationHistory,
                { role: 'user', content: message }
            ],
            model: 'llama3-70b-8192',
            temperature: 0.7,
            max_tokens: 1000,
        });

        const aiResponse = completion.choices[0]?.message?.content || "I apologize, I couldn't generate a response.";

        // Save AI response
        const { error: aiMsgError } = await supabase
            .from('chat_messages')
            .insert({
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
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process chat message' },
            { status: 500 }
        );
    }
}

// GET endpoint to fetch conversation history
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');

        if (conversationId) {
            // Get specific conversation messages
            const { data: messages, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return NextResponse.json({ messages });
        } else {
            // Get all user conversations
            const { data: conversations, error } = await supabase
                .from('chat_conversations')
                .select('*, chat_messages(count)')
                .eq('user_id', session.user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return NextResponse.json({ conversations });
        }

    } catch (error) {
        console.error('Chat GET error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch conversations' },
            { status: 500 }
        );
    }
}
