
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

        // 0. FETCH & MANAGE RETRY COUNT
        // ---------------------------------------------------------
        const { data: sessionData } = await persistenceClient
            .from('interactive_course_sessions')
            .select('retry_count')
            .eq('id', sessionId)
            .single();

        const retryCount = sessionData?.retry_count || 0;

        if (retryCount >= 5) {
            return new Response(
                `data: ${JSON.stringify({ type: 'content', content: "I'm temporarily unavailable, so sorry about that." })}\n\n`,
                { headers: { 'Content-Type': 'text/event-stream' } }
            );
        }

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
            order_index: 0,
            prerequisite_ids: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
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

        // 3. CHECK MASTERY (Robustly)
        // ---------------------------------------------------------
        // Ensure we don't crash if an ID is not a valid UUID
        const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

        let mastery = null;
        if (user.id && currentNode.id && isUUID(user.id) && isUUID(currentNode.id)) {
            try {
                mastery = await MasteryTracker.getMastery(user.id, currentNode.id);
            } catch (err) {
                console.warn(`[GENIE_BRAIN] Mastery check failed for node ${currentNode.id}`, err);
            }
        } else {
            console.warn(`[GENIE_BRAIN] Skipping mastery check. Invalid UUIDs - User: ${user.id}, Node: ${currentNode.id}`);
        }

        // 4. COGNITIVE REASONING (The Decision)
        // ---------------------------------------------------------
        const decision = await CognitiveReasoning.determineNextAction(
            userMessage,
            currentNode,
            mastery,
            relatedContext,
            conversationHistory || []
        );

        console.log('[GENIE_BRAIN] Decision:', decision.action, decision.thought_process);

        // 5. STREAM RESPONSE
        // ---------------------------------------------------------
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Log user message into the current session context if needed
                    // (The brain uses conversationHistory, but we can log for persistence)
                    const { SessionManager } = await import('@/lib/genie/brain/session');

                    // Create/Get an iteration for this interaction if it's a new concept
                    // For simplicity, we'll use the retry_count or a timestamp-based iteration
                    const iteration = await SessionManager.startIteration(sessionId, 1, currentNode.title);

                    // A. Handle Roadmap
                    if (decision.action === 'roadmap') {
                        const { KnowledgeManager } = await import('@/lib/genie/brain/knowledge');
                        const nodes = await KnowledgeManager.getNodesForCourse(courseId);

                        const roadmapData = {
                            title: skillTitle || "Your Learning Journey",
                            description: decision.content.text || `Welcome! Here's the roadmap we've designed to help you master ${skillTitle}.`,
                            items: nodes.map(n => ({
                                id: n.id,
                                text: n.title,
                                description: n.description,
                                confidence: 0
                            }))
                        };

                        const intro = decision.content.text || "Here is your learning roadmap for this course.";
                        await streamText(intro, controller, encoder);

                        // Send Roadmap Data
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'roadmap', roadmapData })}\n\n`));

                        await SessionManager.completeIterationStep(iteration.id, 'explanation');
                    }
                    // B. Handle Quiz
                    else if (decision.action === 'quiz') {
                        let intro = decision.content.text || "Let's check your understanding.";
                        
                        // If AI leaked question into intro, truncate intro
                        if (decision.content.quiz?.question && intro.includes(decision.content.quiz.question)) {
                            intro = "Let's see how much you've learned so far:";
                        } else if (intro.length > 100) {
                            intro = "Here is a quick check to verify your understanding:";
                        }

                        await streamText(intro, controller, encoder);

                        if (decision.content.quiz) {
                            // Send Quiz Data
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'quiz', quizData: decision.content.quiz })}\n\n`));

                            // Log to understanding_assessments
                            await SessionManager.logAssessment({
                                session_id: sessionId,
                                concept: currentNode.title,
                                question_type: 'multiple_choice',
                                question_data: decision.content.quiz,
                                created_at: new Date().toISOString()
                            });
                        }

                        await SessionManager.completeIterationStep(iteration.id, 'assessment');
                    }
                    // C. Handle Challenge
                    else if (decision.action === 'challenge') {
                        let intro = decision.content.text || "Time to apply what you've learned!";

                        // If AI leaked description into intro, truncate intro
                        if (decision.content.challenge?.description && intro.includes(decision.content.challenge.description)) {
                            intro = "Time for a practical challenge!";
                        } else if (intro.length > 100) {
                            intro = "Let's apply your knowledge with a real-world task:";
                        }

                        await streamText(intro, controller, encoder);

                        if (decision.content.challenge) {
                            // Send Challenge Data
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'challenge_trigger', challengeData: decision.content.challenge })}\n\n`));
                        }

                        await SessionManager.completeIterationStep(iteration.id, 'challenge');
                    }
                    // C. Handle Explanation / Remediation / Advance
                    else {
                        // If it's a simple transition text from reasoning
                        if (decision.content.text && decision.content.text.length > 50) {
                            await streamText(decision.content.text, controller, encoder);
                            await SessionManager.completeIterationStep(iteration.id, 'explanation');
                        } else {
                            // GENERATE REAL STREAMING EXPLANATION
                            const explanationStream = CognitiveReasoning.generatePersonalizedContentStream(
                                currentNode,
                                userMessage
                            );

                            let fullExplanation = '';
                            for await (const chunk of explanationStream) {
                                fullExplanation += chunk;
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`));
                            }

                            if (fullExplanation.trim()) {
                                await persistenceClient
                                    .from('interactive_course_sessions')
                                    .update({ retry_count: 0 })
                                    .eq('id', sessionId);

                                await SessionManager.completeIterationStep(iteration.id, 'explanation');
                            }
                        }
                    }

                    controller.close();
                } catch (e) {

                    console.error('Stream Error:', e);

                    // Increment retry count on failure
                    const { SessionManager } = await import('@/lib/genie/brain/session');
                    await SessionManager.incrementSessionRetry(sessionId);

                    const errorMessage = "I encountered an issue, please retry.";
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: errorMessage })}\n\n`));
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
