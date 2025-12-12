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
        let studySetsContext = '';
        let notesContext = '';

        if (session) {
            // Get user profile
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

            // Get user's study sets
            const { data: studySets } = await supabase
                .from('study_sets')
                .select('id, title, description, flashcards')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (studySets && studySets.length > 0) {
                studySetsContext = `\n\nUser's Study Sets:\n${studySets.map(set => 
                    `- "${set.title}"${set.description ? `: ${set.description}` : ''} (${set.flashcards?.length || 0} flashcards)`
                ).join('\n')}`;
            }

            // Get user's notes
            const { data: notes } = await supabase
                .from('notes')
                .select('id, title, content')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (notes && notes.length > 0) {
                notesContext = `\n\nUser's Recent Notes:\n${notes.map(note => 
                    `- "${note.title}"${note.content ? `: ${note.content.substring(0, 100)}...` : ''}`
                ).join('\n')}`;
            }
        }

        const systemPrompt = `You are Genie, an enthusiastic AI learning companion helping users master "${skillTitle}".
${userProfileContext}${studySetsContext}${notesContext}

Current context: ${context || 'User is learning this skill'}

Guidelines:
- You have full knowledge of the user's study materials, notes, and learning progress above.
- Adapt to the user's education level and region.
- Be encouraging, friendly, and supportive like a study buddy.
- Explain concepts clearly and simply.
- Use analogies and examples.
- **CRITICAL: Keep responses under 50 words for voice output.**
- If user is stuck, give hints not answers.
- Reference their study sets and notes when relevant.
- Celebrate their progress.

User said: "${userMessage}"

Respond naturally as a friendly companion:`;

        const result = await generateWithRetry({
            prompt: userMessage,
            systemPrompt,
            schema: {},
            temperature: 0.7,
            maxTokens: 150,
        });

        const genieResponse = result.text || "Hey! I'm Genie, your study buddy. What would you like to know?";

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