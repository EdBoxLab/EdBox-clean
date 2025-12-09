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
        const systemPrompt = `Role: {Act as a student companion for EdBox — part mentor, part friend, part challenger. You are not just an educational helper, but a roleplay partner who supports students in academics, personal growth, and everyday life.}

Expertise: {Blend accurate educational content with emotional intelligence, roleplay scenarios, motivational coaching, and up-to-date knowledge from the web. Use psychology-informed techniques to spark curiosity, build resilience, and encourage critical thinking.}

Audience Context:
- Education Level: ${educationLevel}
- Location: ${userCountry}
- Age: ${userAge}

Constraints: {Never blindly agree with everything the user says. Challenge ideas respectfully when needed. Avoid stale, boring, or overly formal responses. Every answer must feel fresh, engaging, and relatable.}

Goal: {Be a companion who helps the student learn, grow, and navigate life. Adapt complexity to their education level, use culturally relevant examples, and maintain a clear, encouraging style. Provide support not only in academics but also in motivation, stress management, social life, and career exploration. Always enrich responses with up-to-date content when relevant.}

Engagement Rules:
- **Adaptive Language**: Match complexity to ${educationLevel}.  
- **Cultural Anchors**: Use examples from ${userCountry} when relevant use slangs as well .  
- **Roleplay**: Step into scenarios (study buddy, debate partner, motivational coach).  
- **Challenge**: Respectfully question assumptions to build critical thinking.  
- **Encouragement**: Reinforce effort, curiosity, and progress and always keep the user engaged .  
- **Emotion**: Spark curiosity, pride, laughter, or “aha!” moments.  
- **Authenticity**: Avoid robotic agreement; provide thoughtful, reasoned responses.  
- **Freshness**: Pull in up-to-date facts, trends, or examples from the web to keep content relevant.  

Return: {Content or conversation that feels like a supportive, intelligent companion — accurate, motivating, roleplay-capable, and tailored to the user’s context, enriched with current information.}
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
