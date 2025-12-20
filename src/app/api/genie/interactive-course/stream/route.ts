import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const {
            userMessage,
            sessionId,
            courseId,
            learningStage,
            conversationHistory,
            chatSummary
        } = await request.json();

        if (!userMessage || !sessionId) {
            return new Response(
                JSON.stringify({ error: 'Message and session ID required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { data: { session: authSession } } = await supabase.auth.getSession();
        let courseContext = '';

        if (authSession && courseId) {
            const { data: course } = await supabase
                .from('courses')
                .select('title, description, category')
                .eq('id', courseId)
                .single();

            if (course) {
                courseContext = `Course: "${course.title}" (${course.category})\nDescription: ${course.description || 'Interactive learning'}`;
            }
        }

      // --- Replace your current systemPrompt construction with this ---

const systemPrompt = `You are Genie, a premium AI learning companion, designed to guide the learner through a structured Explain -> Quiz -> Challenge cadence.

## CURRENT CONTEXT:
${courseContext}
Learning Stage: ${learningStage || 'EXPLAIN'}
Summary: ${chatSummary || 'New session started.'}

## YOUR RESPONSE INSTRUCTIONS:
Your tone must be professional, encouraging, and tech-forward.
Your response MUST be based on the current Learning Stage:

1. **EXPLAIN (Stage: EXPLAIN):**
   - Provide a vivid, concise explanation (2-3 sentences maximum).
   - If the explanation is complete, conclude by saying you will check their understanding next.

2. **QUIZ (Stage: QUIZ):**
   - Provide ONLY a single multiple-choice question.
   - You MUST prefix the response with \`[QUIZ]\` followed by a valid JSON object with the quiz data.
   - JSON format: \`{"question": "...", "options": ["...", "...", "..."], "correctAnswer": "...", "explanation": "..."}\`

3. **CHALLENGE (Stage: CHALLENGE):**
   - Provide ONLY a hands-on task or prompt.
   - You MUST prefix the response with \`[CHALLENGE]\` followed by a valid JSON object with the challenge data.
   - JSON format: \`{"description": "...", "challengeId": "challenge_${Date.now()}"}\`

## CONVERSATION HISTORY (for context):
${conversationHistory?.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') || 'None'}

## LEARNER INPUT:
Learner: "${userMessage}"

Genie:`;
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const result = await generateWithRetry({
                        prompt: userMessage,
                        systemPrompt,
                        temperature: 0.7,
                        maxTokens: 500,
                    });
                    console.log('AI Generation Result:', result);
                    const genieResponse = result.text || "Let's keep learning! What's on your mind?";

                    if (genieResponse.includes('[QUIZ]')) {
                        const [content, quizJson] = genieResponse.split('[QUIZ]');
                        await streamText(content, controller, encoder);
                        try {
                            const quizData = JSON.parse(quizJson.trim());
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'quiz', quizData })}\n\n`));
                        } catch (e) {
                            console.error('Quiz JSON Parse Error:', e);
                        }
                    } else if (genieResponse.includes('[CHALLENGE]')) {
                        const [content, challengeJson] = genieResponse.split('[CHALLENGE]');
                        await streamText(content, controller, encoder);
                        try {
                            const challengeData = JSON.parse(challengeJson.trim());
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'challenge_trigger', challengeData })}\n\n`));
                        } catch (e) {
                            console.error('Challenge JSON Parse Error:', e);
                        }
                    } else {
                        await streamText(genieResponse, controller, encoder);
                    }

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', content: genieResponse })}\n\n`));
                    controller.close();
                } catch (error) {
                    console.error('Streaming error:', error);
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

async function streamText(text: string, controller: ReadableStreamDefaultController, encoder: TextEncoder) {
    if (!text.trim()) return;
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
        const chunk = {
            type: 'content',
            content: words[i] + (i < words.length - 1 ? ' ' : '')
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        await new Promise(r => setTimeout(r, 20));
    }
}
