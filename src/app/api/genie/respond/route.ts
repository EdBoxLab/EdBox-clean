import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';
import { handleAPIError } from '@/lib/utils/errorHandler';
import { bufferToBase64, extractTextFromPPTX, extractTextFromPDF, isImageType, isPDFType } from '@/lib/utils/fileProcessing';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const contentType = request.headers.get('content-type') || '';

        let userMessage = '';
        let skillTitle = '';
        let context = '';
        let attachments: { mimeType: string; data: string }[] = [];
        let extraContextFromFiles = '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            userMessage = formData.get('userMessage') as string;
            skillTitle = formData.get('skillTitle') as string;
            context = formData.get('context') as string;

            const files = formData.getAll('files') as File[];
            for (const file of files) {
                const buffer = Buffer.from(await file.arrayBuffer());

                if (isImageType(file.type)) {
                    attachments.push({
                        mimeType: file.type,
                        data: bufferToBase64(buffer)
                    });
                } else if (isPDFType(file.type)) {
                    const extractedText = await extractTextFromPDF(buffer);
                    extraContextFromFiles += `\n\nContent from PDF (${file.name}):\n${extractedText}`;
                } else if (file.name.endsWith('.pptx')) {
                    const extractedText = await extractTextFromPPTX(buffer);
                    extraContextFromFiles += `\n\nContent from PPTX (${file.name}):\n${extractedText}`;
                } else {
                    // For other text files, just read the content
                    const textContent = buffer.toString('utf-8');
                    extraContextFromFiles += `\n\nContent from File (${file.name}):\n${textContent}`;
                }
            }
        } else {
            const json = await request.json();
            userMessage = json.userMessage;
            skillTitle = json.skillTitle;
            context = json.context;
        }

        if (!userMessage) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }

        const { data: { session } } = await supabase.auth.getSession();
        let userProfileContext = '';
        let studySetsContext = '';
        let notesContext = '';
        let competencyContext = '';
        let recentSummaryContext = '';

        if (session) {
            const userId = session.user.id;

            // 1. Get user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('education, country, age')
                .eq('id', userId)
                .single();

            if (profile) {
                userProfileContext = `
User Profile:
- Education: ${profile.education || 'General'}
- Country: ${profile.country || 'Global'}
- Age: ${profile.age || 'Unknown'}`;
            }

            // 2. Get user's study sets
            const { data: studySets } = await supabase
                .from('skill_graphs')
                .select('id,goal,nodes,edges')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (studySets && studySets.length > 0) {
                studySetsContext = `\n\nUser's Study Sets:\n${studySets.map(set =>
                    `- "${set.goal}" (${set.nodes?.length || 0} nodes, ${set.edges?.length || 0} edges)`
                ).join('\n')}`;
            }

            // 3. Get user's notes
            const { data: notes } = await supabase
                .from('notes')
                .select('id, title, content')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (notes && notes.length > 0) {
                notesContext = `\n\nUser's Recent Notes:\n${notes.map(note =>
                    `- "${note.title}"${note.content ? `: ${note.content.substring(0, 100)}...` : ''}`
                ).join('\n')}`;
            }

            // 4. Get Competency (Anthropic Memory style)
            if (skillTitle) {
                const { data: competencies } = await supabase
                    .from('user_competency')
                    .select('concept, confidence, mastery_state')
                    .eq('user_id', userId)
                    .eq('topic', skillTitle);

                if (competencies && competencies.length > 0) {
                    competencyContext = `\n\nUser Competency for "${skillTitle}":\n${competencies.map(c =>
                        `- ${c.concept}: ${Math.round(c.confidence * 100)}% mastery (${JSON.stringify(c.mastery_state)})`
                    ).join('\n')}`;
                }

                // 5. Get Recent Summary (Supermemory style)
                const { data: summary } = await supabase
                    .from('chat_summaries')
                    .select('summary_text, key_insights')
                    .eq('user_id', userId)
                    .eq('topic', skillTitle)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (summary) {
                    recentSummaryContext = `\n\nRecent Learning Session Summary:\n${summary.summary_text}\nKey Insights: ${JSON.stringify(summary.key_insights)}`;
                }
            }
        }

        // Enhanced system prompt for interactive course context
        const isInteractiveCourse = context && (
            context.includes('Currently learning:') || 
            context.includes('comprehension level') ||
            context.includes('mastered:')
        );

        let systemPrompt;
        
        if (isInteractiveCourse) {
            // Interactive course-specific prompt
            systemPrompt = `You are Genie, an enthusiastic AI learning companion guiding users through an interactive course experience on "${skillTitle}".
${userProfileContext}${studySetsContext}${notesContext}${competencyContext}${recentSummaryContext}

INTERACTIVE COURSE CONTEXT: ${context}
${extraContextFromFiles}

INTERACTIVE COURSE GUIDELINES:
- You are conducting a conversational learning session, not just answering questions
- Build on the user's current learning context and previously mastered concepts
- ALWAYS check user competency. If they have low confidence (e.g., < 0.5) in a prerequisite concept, address it BEFORE moving forward.
- NEVER go "back to basics" if the competency shows they have already mastered those basics (e.g., > 0.8).
- Adapt explanations to their comprehension level (shown in context)
- Use a natural, conversational tone as if you're sitting together learning
- Transform static content into engaging dialogue
- Connect new concepts to what they already know
- Ask follow-up questions to check understanding
- Suggest when they might be ready for practice or challenges
- Keep responses conversational but informative (aim for 2-3 sentences)
- Reference their learning progress and celebrate achievements
- If they're struggling with concepts, offer different explanations or analogies

MULTIMEDIA INTEGRATION:
- When course content includes images, videos, or interactive elements, reference them naturally
- Example: "Looking at the diagram we just discussed..." or "Remember the video example..."
- Make multimedia feel part of the conversation, not separate

User said: "${userMessage}"

Respond as their learning companion in this interactive course:`;
        } else {
            // Standard Genie prompt for general interactions
            systemPrompt = `You are Genie, an enthusiastic AI learning companion helping users master "${skillTitle}".
${userProfileContext}${studySetsContext}${notesContext}${competencyContext}${recentSummaryContext}

Current context: ${context || 'User is learning this skill'}
${extraContextFromFiles}

Guidelines:
- You have full knowledge of the user's study materials, notes, and learning progress above.
- Use the User Competency and Recent Summary to avoid repeating things they know or going back to basics unnecessarily.
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
        }

        const result = await generateWithRetry({
            prompt: userMessage,
            systemPrompt,
            schema: {},
            temperature: 0.7,
            maxTokens: 150,
            attachments,
        });

        const genieResponse = result.text || "Hey! I'm Genie, your study buddy. What would you like to know?";

        // Background: Update summary and competency (Supermemory/Anthropic style)
        if (session && skillTitle) {
            const userId = session.user.id;
            
            // This is a simplified "background" process
            // In a real production app, you might use a queue or a separate edge function
            (async () => {
                try {
                    const summaryPrompt = `Summarize this learning exchange for user mastery tracking. 
User said: "${userMessage}"
Genie responded: "${genieResponse}"

Return a JSON with:
"summary": a one-sentence summary of the exchange.
"mastery_update": { "concept": string, "confidence_delta": number (-0.5 to 0.5) } (only if mastery changed)
"key_insights": string[] (e.g. ["struggling with hypothesis", "mastered base case"])`;

                    const summaryResult = await generateWithRetry({
                        prompt: summaryPrompt,
                        systemPrompt: "You are a learning progress analyzer. Be concise.",
                        temperature: 0.1,
                    });

                    const summaryData = JSON.parse(summaryResult.text || '{}');

                    if (summaryData.summary) {
                        await supabase.from('chat_summaries').insert({
                            user_id: userId,
                            topic: skillTitle,
                            summary_text: summaryData.summary,
                            key_insights: summaryData.key_insights || []
                        });
                    }

                    if (summaryData.mastery_update?.concept) {
                        const concept = summaryData.mastery_update.concept;
                        const delta = summaryData.mastery_update.confidence_delta || 0;

                        const { data: existing } = await supabase
                            .from('user_competency')
                            .select('confidence')
                            .eq('user_id', userId)
                            .eq('topic', skillTitle)
                            .eq('concept', concept)
                            .single();

                        const newConfidence = Math.max(0, Math.min(1.0, (existing?.confidence || 0) + delta));

                        await supabase.from('user_competency').upsert({
                            user_id: userId,
                            topic: skillTitle,
                            concept: concept,
                            confidence: newConfidence,
                            last_updated: new Date().toISOString()
                        }, { onConflict: 'user_id,topic,concept' });
                    }
                } catch (e) {
                    console.error('Failed to update learning state:', e);
                }
            })();
        }

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