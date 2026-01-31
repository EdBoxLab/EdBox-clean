
import { NextRequest } from 'next/server';
import { createSupabaseServerClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';
import { skillProgressionIntegration } from '@/lib/services/skill-progression-integration';
import { CognitiveReasoning } from '@/lib/genie/brain/reasoning';
import { VectorBrain } from '@/lib/genie/brain/vector';
import { MasteryTracker } from '@/lib/genie/brain/mastery';
import { DecisionLogger, GenieDecision } from '@/lib/genie/brain/decision-logger';
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

        // Save User Message
        const { SessionManager } = await import('@/lib/genie/brain/session');
        await SessionManager.saveMessage(sessionId, 'learner', userMessage, 'question');

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

        // Try to fetch real node content from genie_knowledge_nodes first
        let resolvedNodeId: string | null = null;
        if (currentSkillId) {
            const { data: nodeData } = await persistenceClient
                .from('genie_knowledge_nodes')
                .select('*')
                .eq('id', currentSkillId)
                .single();

            if (nodeData) {
                resolvedNodeId = nodeData.id;
                currentNode = {
                    id: nodeData.id,
                    course_id: nodeData.course_id,
                    title: nodeData.title,
                    description: nodeData.description || '',
                    content: nodeData.content || nodeData.title,
                    level: nodeData.level || 1,
                    order_index: nodeData.order_index || 0,
                    prerequisite_ids: nodeData.prerequisite_ids || [],
                    created_at: nodeData.created_at,
                    updated_at: nodeData.updated_at
                };
            }
        }

        // If no node found yet, try to find by course_id (first node for that course)
        if (!resolvedNodeId) {
            const { data: nodeByCourse } = await persistenceClient
                .from('genie_knowledge_nodes')
                .select('*')
                .eq('course_id', courseId)
                .order('order_index', { ascending: true })
                .limit(1)
                .single();

            if (nodeByCourse) {
                resolvedNodeId = nodeByCourse.id;
                currentNode = {
                    id: nodeByCourse.id,
                    course_id: nodeByCourse.course_id,
                    title: nodeByCourse.title,
                    description: nodeByCourse.description || '',
                    content: nodeByCourse.content || nodeByCourse.title,
                    level: nodeByCourse.level || 1,
                    order_index: nodeByCourse.order_index || 0,
                    prerequisite_ids: nodeByCourse.prerequisite_ids || [],
                    created_at: nodeByCourse.created_at,
                    updated_at: nodeByCourse.updated_at
                };
            }
        }

        // Fallback: use currentSkillId if it's a valid UUID, even if not in knowledge_nodes
        // The MasteryTracker will handle non-existent nodes gracefully
        if (!resolvedNodeId && currentSkillId) {
            resolvedNodeId = currentSkillId;
        }

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
        const nodeIdForMastery = resolvedNodeId || currentNode.id;
        if (user.id && nodeIdForMastery && isUUID(user.id) && isUUID(nodeIdForMastery)) {
            try {
                mastery = await MasteryTracker.getMastery(user.id, nodeIdForMastery);
            } catch (err) {
                console.warn(`[GENIE_BRAIN] Mastery check failed for node ${nodeIdForMastery}`, err);
            }
        } else {
            console.warn(`[GENIE_BRAIN] Skipping mastery check. Invalid UUIDs - User: ${user.id}, Node: ${nodeIdForMastery}`);
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

        // Log the decision for analytics and debugging
        let decisionLog: GenieDecision = {
            session_id: sessionId,
            user_id: user.id,
            node_id: nodeIdForMastery || currentNode.id,
            concept: currentNode.title,
            action: decision.action,
            thought_process: decision.thought_process || '',
            evaluation_score: decision.evaluation_score || 0,
            feedback: decision.feedback || '',
            remediation_node_id: decision.remediation_node_id,
            mastery_status: mastery?.status || 'not_started',
            mastery_score: mastery?.mastery_score || 0,
            conversation_history_length: (conversationHistory || []).length,
            context_sources_count: relatedContext.length,
            input_message: userMessage,
            full_decision: decision as Record<string, any>
        };

        // Log asynchronously (don't block the response)
        const logId = await DecisionLogger.logDecision(decisionLog);
        decisionLog.id = logId || undefined;

        // 5. UPDATE MASTERY & TRANSITIONS (Persistence)
        // ---------------------------------------------------------
        let masteryAchieved = false;
        if (user.id && nodeIdForMastery) {
            const masteryResult = await MasteryTracker.updateMastery(
                user.id,
                nodeIdForMastery,
                decision.evaluation_score,
                courseId,
                currentNode.title
            );
            masteryAchieved = decision.evaluation_score >= 80;
        }

        let nextNodeId = currentNode.id;
        if (decision.action === 'advance') {
            const eligibleNodes = await MasteryTracker.getEligibleNodes(user.id, courseId);
            if (eligibleNodes.length > 0) {
                nextNodeId = eligibleNodes[0];
            }
        } else if (decision.action === 'remediate' && decision.remediation_node_id) {
            nextNodeId = decision.remediation_node_id;
        }

        // 6. STREAM RESPONSE
        // ---------------------------------------------------------
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Update current node in session if changed
                    const { SessionManager } = await import('@/lib/genie/brain/session');
                    if (nextNodeId !== currentNode.id) {
                        await SessionManager.updateCurrentNode(sessionId, nextNodeId);
                        // Notify frontend about node transition via metadata
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'node_transition', nodeId: nextNodeId })}\n\n`));
                    }

                    // Create/Get an iteration for this interaction
                    const iteration = await SessionManager.startIteration(sessionId, 1, currentNode.title);

                    // Update decision log with iteration ID
                    if (decisionLog.id) {
                        await persistenceClient
                            .from('genie_decision_logs')
                            .update({ iteration_id: iteration.id })
                            .eq('id', decisionLog.id);
                    }

                    // Mark evaluation as completed if there's an evaluation score
                    if (decision.evaluation_score !== undefined && decision.evaluation_score !== null) {
                        await SessionManager.markEvaluationCompleted(iteration.id, masteryAchieved);
                    }

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

                        // Save Genie Intro Message
                        await SessionManager.saveMessage(sessionId, 'genie', intro, 'summary', { roadmap: roadmapData }); // Type 'summary' fits roadmap well

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

                        // Save Genie Intro Message
                        await SessionManager.saveMessage(sessionId, 'genie', intro, 'assessment');

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

                        // Save Genie Intro Message
                        await SessionManager.saveMessage(sessionId, 'genie', intro, 'challenge');

                        await SessionManager.completeIterationStep(iteration.id, 'challenge');
                    }
                    // C. Handle Explanation / Remediation / Advance
                    else {
                        // If it's a simple transition text from reasoning
                        if (decision.content.text && decision.content.text.length > 50) {
                            await streamText(decision.content.text, controller, encoder);
                            await SessionManager.completeIterationStep(iteration.id, 'explanation');
                            // Save Genie Message
                            await SessionManager.saveMessage(sessionId, 'genie', decision.content.text, 'explanation');
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

                                // Save Genie Message (Full Explanation)
                                await SessionManager.saveMessage(sessionId, 'genie', fullExplanation, 'explanation');
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
