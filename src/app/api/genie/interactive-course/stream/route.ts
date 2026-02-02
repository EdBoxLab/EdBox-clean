import { NextRequest } from 'next/server';
import { createSupabaseServerClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { CognitiveReasoning } from '@/lib/genie/brain/reasoning';
import { VectorBrain } from '@/lib/genie/brain/vector';
import { MasteryTracker } from '@/lib/genie/brain/mastery';
import { DecisionLogger, GenieDecision } from '@/lib/genie/brain/decision-logger';
import { KnowledgeNode, MasteryRecord, NodeStateMetadata } from '@/lib/genie/brain/types';
import { SessionManager } from '@/lib/genie/brain/session';

// ============================================
// NEAR-INSTANT STREAMING HELPER
// ============================================
function getHumanDelay(word: string, isStartOfSentence: boolean): number {
    return 0; // Near instant as requested
}

async function streamText(
    text: string,
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder
): Promise<void> {
    if (!text || !text.trim()) return;
    // Split by character for smoother "near instant" feel if needed, 
    // or just send chunks. Sending whole text at once might be too fast 
    // to feel like streaming, but user asked for "near instant".
    // Let's send it in small chunks to maintain the stream interface.
    const chunks = text.split(' ');
    for (let i = 0; i < chunks.length; i++) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: chunks[i] + (i < chunks.length - 1 ? ' ' : '') })}\n\n`));
        // Minimal delay to prevent UI freezing and allow React to process
        await new Promise(r => setTimeout(r, 2)); 
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
            learningStage,
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
        await SessionManager.saveMessage(sessionId, 'learner', userMessage, 'question');

        // 0. FETCH & MANAGE RETRY COUNT
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
        let currentNode: KnowledgeNode = {
            id: currentSkillId || courseId,
            course_id: courseId,
            title: skillTitle || 'General Course',
            description: 'Current Topic',
            content: skillTitle || 'this topic',
            level: 1,
            order_index: 0,
            prerequisite_ids: [],
            learning_objectives: [],
            passing_criteria: { type: 'challenge', requirement: 'Master the concept', threshold: 80 },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        let { data: nodeData } = await persistenceClient
            .from('genie_atomic_nodes')
            .select('*')
            .eq('id', currentSkillId)
            .single();

        if (!nodeData) {
            const { data: legacyNode } = await persistenceClient
                .from('genie_knowledge_nodes')
                .select('*')
                .eq('id', currentSkillId)
                .single();
            nodeData = legacyNode;
        }

        if (nodeData) {
            currentNode = {
                ...nodeData,
                learning_objectives: nodeData.learning_objectives || [],
                passing_criteria: nodeData.passing_criteria || { type: 'challenge', requirement: 'Master the concept', threshold: 80 }
            };
        }

        // 2. FETCH V3 METADATA
        const metadata = await SessionManager.getNodeMetadata(sessionId, currentNode.id);

        // 3. CHECK MASTERY
        let mastery = null;
        try {
            mastery = await MasteryTracker.getMastery(user.id, currentNode.id);
        } catch (err) {
            console.warn(`[GENIE_BRAIN] Mastery check failed`, err);
        }

        // 4. COGNITIVE REASONING (V3 Strategist-led)
        // If stageOverride is provided (from buttons), force that action
        let forcedAction = undefined;
        if (learningStage === 'QUIZ') forcedAction = { action: 'quiz', sub_state: 'VALIDATION', reason: 'User explicitly requested a quiz via UI.' };
        if (learningStage === 'CHALLENGE') forcedAction = { action: 'challenge', sub_state: 'APPLICATION', reason: 'User explicitly requested a challenge via UI.' };

        const decision = await CognitiveReasoning.determineNextAction(
            userMessage,
            currentNode,
            mastery,
            metadata,
            conversationHistory || [],
            forcedAction
        );

        // 5. UPDATE METADATA & PERSISTENCE
        const updates: Partial<NodeStateMetadata> = {
            sub_state: decision.sub_state,
            remediation_flag: decision.remediation_flag
        };

        if (decision.action === 'explain') updates.explanation_count = (metadata.explanation_count || 0) + 1;
        if (decision.action === 'challenge') updates.interaction_count = (metadata.interaction_count || 0) + 1;
        
        // Handle successful completions from user message
        if (userMessage.includes("I correctly answered the quiz")) {
            updates.quizzes_completed = (metadata.quizzes_completed || 0) + 1;
        }
        if (userMessage.includes("I've successfully mastered the challenge")) {
            updates.challenges_completed = (metadata.challenges_completed || 0) + 1;
        }

        // Calculate new velocity
        const newVelocity = (decision.evaluation_score - (mastery?.mastery_score || 0));
        updates.mastery_velocity = newVelocity;

        await SessionManager.updateNodeMetadata(sessionId, currentNode.id, updates);

        // 6. UPDATE MASTERY
        // Only mark as 100% if the strategist explicitly decided to advance
        // Otherwise, progress is incremental but doesn't reach 'mastered' threshold (80)
        let finalScore = decision.action === 'advance' ? 100 : Math.min(decision.evaluation_score, 79);

        const masteryResult = await MasteryTracker.updateMastery(
            user.id,
            currentNode.id,
            finalScore,
            courseId,
            currentNode.title
        );
        const masteryAchieved = decision.action === 'advance';

        // 6.1 FETCH UPDATED GOALS FOR SIDEMENU
        // Prioritize atomic nodes
        const { data: nodes } = await persistenceClient
            .from('genie_atomic_nodes')
            .select('*')
            .eq('skill_id', courseId)
            .order('order_index', { ascending: true });

        let allNodes = nodes;
        if (!nodes || nodes.length === 0) {
            const { data: legacyNodes } = await persistenceClient
                .from('genie_knowledge_nodes')
                .select('*')
                .eq('course_id', courseId)
                .order('order_index', { ascending: true });
            allNodes = legacyNodes;
        }

        const { data: allMastery } = await persistenceClient
            .from('genie_user_mastery')
            .select('*')
            .eq('user_id', user.id);

        const { data: updatedSession } = await persistenceClient
            .from('interactive_course_sessions')
            .select('progress_state')
            .eq('id', sessionId)
            .single();

        const nodeMetadataMap = updatedSession?.progress_state?.node_metadata || {};

        const updatedGoals = allNodes?.map(node => {
            const nodeMastery = allMastery?.find(m => m.node_id === node.id);
            const nodeMeta = nodeMetadataMap[node.id] || {};
            return {
                id: node.id,
                text: node.title,
                status: nodeMastery?.status || 'not_started',
                confidence: nodeMastery?.mastery_score || 0,
                quizzes_completed: nodeMeta.quizzes_completed || 0,
                challenges_completed: nodeMeta.challenges_completed || 0,
                evidence: nodeMastery?.status === 'mastered' ? 'Mastered concept' : undefined,
                timestamp: new Date().toISOString()
            };
        });

        // 7. STREAM RESPONSE
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Send initial goal update to ensure UI is fresh
                    if (updatedGoals) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'goals_updated', goals: updatedGoals })}\n\n`));
                    }

                    const iteration = await SessionManager.startIteration(sessionId, 1, currentNode.title);
                    
                    // Log Decision
                    const logId = await DecisionLogger.logDecision({
                        session_id: sessionId,
                        iteration_id: iteration.id,
                        user_id: user.id,
                        node_id: currentNode.id,
                        concept: currentNode.title,
                        action: decision.action,
                        thought_process: decision.thought_process || '',
                        evaluation_score: decision.evaluation_score || 0,
                        feedback: decision.feedback || '',
                        mastery_status: masteryAchieved ? 'mastered' : 'in_progress',
                        mastery_score: decision.evaluation_score,
                        input_message: userMessage,
                        full_decision: decision
                    });

                    // A. Handle Quiz
                    if (decision.action === 'quiz') {
                        let intro = decision.content.text || "Let's check your understanding.";
                        await streamText(intro, controller, encoder);
                        if (decision.content.quiz) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'quiz', quizData: decision.content.quiz })}\n\n`));
                            await SessionManager.logAssessment({
                                session_id: sessionId,
                                concept: currentNode.title,
                                question_type: 'multiple_choice',
                                question_data: decision.content.quiz,
                            });
                        }
                        await SessionManager.saveMessage(sessionId, 'genie', intro, 'assessment');
                        await SessionManager.completeIterationStep(iteration.id, 'assessment');
                    }
                    // B. Handle Challenge
                    else if (decision.action === 'challenge') {
                        let intro = decision.content.text || "Time to apply what you've learned!";
                        await streamText(intro, controller, encoder);
                        if (decision.content.challenge) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'challenge_trigger', challengeData: decision.content.challenge })}\n\n`));
                        }
                        await SessionManager.saveMessage(sessionId, 'genie', intro, 'challenge');
                        await SessionManager.completeIterationStep(iteration.id, 'challenge');
                    }
                    // C. Handle Explanation / Advance / Remediation
                    else {
                        if (decision.content.text) {
                            await streamText(decision.content.text, controller, encoder);
                            await SessionManager.saveMessage(sessionId, 'genie', decision.content.text, 'explanation');
                            await SessionManager.completeIterationStep(iteration.id, 'explanation');
                        }
                    }

                    // D. Mastery Badge Check
                    if (masteryAchieved) {
                        const { data: allNodes } = await persistenceClient
                            .from('genie_knowledge_nodes')
                            .select('id')
                            .eq('course_id', courseId);
                        
                        const { data: userMastered } = await persistenceClient
                            .from('genie_user_mastery')
                            .select('node_id')
                            .eq('user_id', user.id)
                            .eq('status', 'mastered')
                            .in('node_id', allNodes?.map(n => n.id) || []);

                        if (userMastered?.length === allNodes?.length) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                                type: 'mastery_badge', 
                                badge: { name: skillTitle + ' Master', icon: 'award' } 
                            })}\n\n`));
                        }
                    }

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
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
