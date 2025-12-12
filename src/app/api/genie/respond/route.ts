import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { userMessage, skillTitle, context } = await request.json();

        if (!userMessage) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }

        const { data: { session } } = await supabase.auth.getSession();
        let userProfileContext = '';

        if (session) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('education, country, age')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                userProfileContext = `
User Profile:
- Education: ${profile.education || 'General'}
- Country: ${profile.country || 'Global'}
- Age: ${profile.age || 'Unknown'}`;
            }
        }

        const systemPrompt = `You are Genie, an enthusiastic AI learning companion helping users master "${skillTitle}".
${userProfileContext}

Current context: ${context || 'User is learning this skill'}

Guidelines:
- Adapt to the user's education level and region.
- Be encouraging and supportive.
- Explain concepts clearly and simply.
- Use analogies and examples.
- **CRITICAL: Keep responses under 50 words for voice output.**
- If user is stuck, give hints not answers.
- Celebrate their progress.

User said: "${userMessage}"

Respond naturally as if speaking to them:`;

        const result = await generateWithRetry({
            prompt: userMessage,
            systemPrompt,
            schema: {},
            temperature: 0.7,
            maxTokens: 150,
        });

        const genieResponse = result.text || "I'm here to help! What would you like to know?";

        return NextResponse.json({
            success: true,
            response: genieResponse,
        });

    } catch (error: any) {
        console.error('Genie Response Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get Genie response' },
            { status: 500 }
        );
    }
}