
import { NextRequest } from 'next/server';
import { createSupabaseServerClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';
import { skillProgressionIntegration } from '@/lib/services/skill-progression-integration';
import { CognitiveReasoning } from '@/lib/genie/brain/reasoning';
import { VectorBrain } from '@/lib/genie/brain/vector';
import { MasteryTracker } from '@/lib/genie/brain/mastery';
import { KnowledgeNode, MasteryRecord } from '@/lib/genie/brain/types';

// ============================================
// HUMAN-LIKE STREAMING HELPER
// ============================================
function getHumanDelay(word: string, isStartOfSentence: boolean): number {
    const base = 15 + Math.random() * 15; // Faster than before
    if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) return base + 50;
    if (word.endsWith(',')) return base + 20;
    return base;
}

async function streamText(
    text: string,
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder
): Promise<void> {
    if (!text || !text.trim()) return;
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const isStartOfSentence = i === 0 || /[.!?]$/.test(words[i - 1] || '');
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: word + (i < words.length - 1 ? ' ' : '') })}\n\n`));
        await new Promise(r => setTimeout(r, getHumanDelay(word, isStartOfSentence)));
    }
}

// ============================================
// MAIN GENIE BRAIN HANDLER
// ============================================
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            userMessage,
            sessionId,
            courseId,
            currentSkillId,
            skillTitle,
            conversationHistory
        } = body;

        if (!userMessage || !sessionId) {
            return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400 });
        }

        const persistenceClient = await createServerSupabaseClient();
        const authClient = await createSupabaseServerClient();
        const { data: { user } } = await authClient.auth.getUser();

        if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

        // 1. RESOLVE CONTEXT (Knowledge Graph)
        // ---------------------------------------------------------
        // We need to identify exactly which node/concept the user is currently on.
        let currentNode: KnowledgeNode = {
            id: currentSkillId || courseId,
            course_id: courseId,
            title: skillTitle || 'General Course',
            description: 'Current Topic',
            content: skillTitle || 'this topic', // Fallback if no content found
            level: 1,
            prerequisites: [],
            created_at: new Date().toISOString()
        };

        // Try to fetch real node content from the graph or new knowledge table
        const { data: graphData } = await persistenceClient
            .from('skill_graphs')
            .select('nodes')
            .eq('id', courseId)
            .single();

        if (graphData?.nodes) {
            const matched = graphData.nodes.find((n: any) => n.id === currentSkillId);
            if (matched) {
                currentNode = {
                    ...currentNode,
                    title: matched.title,
                    description: matched.data?.description || matched.title,
                    content: matched.data?.description || matched.title // Ideally we'd have full content here
                };
            }
        }

        // 2. RETRIEVE KNOWLEDGE (RAG)
        // ---------------------------------------------------------
        // Find related snippets from the vector DB to ground the response
        let relatedContext: any[] = [];
        try {
            relatedContext = await VectorBrain.findRelatedNodes(userMessage + " " + currentNode.title);
        } catch (e) {
            console.warn('Vector retrieval failed (skipping RAG):', e);
        }

        // 3. CHECK MASTERY
        // ---------------------------------------------------------
        const mastery = await MasteryTracker.getMastery(user.id, currentNode.id);

        // 4. COGNITIVE REASONING (The Decision)
        // ---------------------------------------------------------
        const decision = await CognitiveReasoning.determineNextAction(
            userMessage,
            currentNode,
            mastery,
            relatedContext
        );

        console.log('[GENIE_BRAIN] Decision:', decision.action, decision.thought_process);

        // 5. STREAM RESPONSE
        // ---------------------------------------------------------
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Log user message
                    await persistenceClient.rpc('add_conversation_message', {
                        p_session_id: sessionId,
                        p_role: 'learner',
                        p_content: userMessage,
                        p_message_type: 'explanation'
                    });

                    // A. Handle Quiz
                    if (decision.action === 'quiz' && decision.content.quiz) {
                        const intro = decision.content.text || "Let's check your understanding.";
                        await streamText(intro, controller, encoder);

                        // Send Quiz Data
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'quiz', quizData: decision.content.quiz })}\n\n`));

                        await persistenceClient.rpc('add_conversation_message', {
                            p_session_id: sessionId,
                            p_role: 'genie',
                            p_content: decision.content.quiz.question,
                            p_message_type: 'assessment',
                            p_metadata: { quizData: decision.content.quiz }
                        });
                    }
                    // B. Handle Challenge
                    else if (decision.action === 'challenge' && decision.content.challenge) {
                        const intro = decision.content.text || "Time to apply what you've learned!";
                        await streamText(intro, controller, encoder);

                        // Send Challenge Data
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'challenge_trigger', challengeData: decision.content.challenge })}\n\n`));

                        await persistenceClient.rpc('add_conversation_message', {
                            p_session_id: sessionId,
                            p_role: 'genie',
                            p_content: decision.content.challenge.description,
                            p_message_type: 'challenge',
                            p_metadata: { challengeData: decision.content.challenge }
                        });
                    }
                    // C. Handle Explanation / Remediation / Advance
                    else {
                        // If it's a simple transition text from reasoning
                        if (decision.content.text && decision.content.text.length > 50) {
                            await streamText(decision.content.text, controller, encoder);
                            await persistenceClient.rpc('add_conversation_message', {
                                p_session_id: sessionId,
                                p_role: 'genie',
                                p_content: decision.content.text,
                                p_message_type: 'explanation'
                            });
                        } else {
                            // GENERATE FULL EXPLANATION (grounded in context)
                            const explanation = await CognitiveReasoning.generatePersonalizedContent(
                                currentNode,
                                userMessage
                            );
                            await streamText(explanation, controller, encoder);

                            await persistenceClient.rpc('add_conversation_message', {
                                p_session_id: sessionId,
                                p_role: 'genie',
                                p_content: explanation,
                                p_message_type: 'explanation'
                            });
                        }
                    }

                    // Update Mastery & Goals (Background)
                    // We interpret the "status" from the decision to update progress
                    // ... (This logic is simplified for now, as mastery updates usually happen AFTER quiz completion)

                    controller.close();
                } catch (e) {
                    console.error('Stream Error:', e);
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
        console.error('Genie Brain Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
