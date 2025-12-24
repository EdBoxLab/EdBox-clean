import { NextRequest } from 'next/server';
import { createSupabaseServerClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';
import { LearningGoal } from '@/types/interactive-course';

// ============================================
// BEHAVIORAL PATTERN DETECTION
// ============================================
function detectBehavioralPatterns(userMessage: string, conversationHistory: any[]) {
    const explicitUnderstanding = [
        'i understand', 'got it', 'makes sense', 'i see', 'clear now',
        'i get it', 'okay', 'alright', 'cool', 'thanks', 'that helps',
        'perfect'
    ];

    const explicitConfusion = [
        'confused', "don't get", "don't understand", 'what?', 'huh?',
        'lost', 'not sure', 'unclear', 'wait', 'can you explain', 'help'
    ];

    const challengeRequest = [
        "i'm ready for a challenge", "ready for a challenge", "give me a challenge",
        "let's do a challenge", "challenge me", "practical task", "ready to build"
    ];

    const quizRequest = [
        "quiz me", "test me", "give me a quiz", "ready for a quiz"
    ];

    const msg = userMessage.toLowerCase();

    return {
        showsUnderstanding: explicitUnderstanding.some(phrase => msg.includes(phrase)),
        showsConfusion: explicitConfusion.some(phrase => msg.includes(phrase)),
        wantsChallenge: challengeRequest.some(phrase => msg.includes(phrase)),
        wantsQuiz: quizRequest.some(phrase => msg.includes(phrase)),
        isEngaged: userMessage.split(' ').length > 8 || msg.includes('?'),
        responseLength: userMessage.split(' ').length,
        exchangeCount: conversationHistory ? conversationHistory.filter((m: any) => m.role === 'assistant').length : 0
    };
}

// ============================================
// HELPER: ROBUST JSON EXTRACTION
// ============================================
function extractJSON(text: string): any {
    try {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            let jsonStr = text.substring(firstBrace, lastBrace + 1).trim();
            jsonStr = jsonStr.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
            return JSON.parse(jsonStr);
        }
    } catch (e) {
        console.warn('Failed to parse JSON from text:', e);
    }
    return null;
}

// ============================================
// AI UNDERSTANDING ANALYZER
// ============================================
async function analyzeUnderstanding(
    userMessage: string,
    conversationHistory: any[],
    currentTopic: string,
    goals: LearningGoal[] = []
) {
    // Extract recent history for context
    const recentHistory = conversationHistory?.slice(-3).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n') || 'None';

    const analysisPrompt = `Analyze student comprehension and progress toward learning goals based on their message and the recent conversation.
Return ONLY valid JSON.

TOPIC: ${currentTopic}
RECENT HISTORY:
${recentHistory}

STUDENT MESSAGE: "${userMessage}"
CURRENT GOALS: ${JSON.stringify(goals)}

YOUR TASK:
1. Identify if the student successfully completed a quiz or challenge.
2. If they did, increase the confidence adjustment (+15 to +30) for the MOST RELEVANT goal(s).
3. If they show confusion, decrease confidence adjustment (-10 to -20).
4. Provide evidence for each adjustment.

Return format:
{
  "comprehensionLevel": "high"|"medium"|"low"|"confused",
  "confidence": 0.0-1.0,
  "updatedGoals": [
    {
      "id": "string",
      "confidenceAdjustment": number,
      "evidence": "brief string"
    }
  ],
  "readyForQuiz": boolean,
  "readyForChallenge": boolean,
  "reasoning": "brief"
}`;

    try {
        const result = await Promise.race([
            generateWithRetry({
                prompt: analysisPrompt,
                systemPrompt: 'You are an educational psychologist and tracking engine. Be critical, fair, and context-aware. Return only valid JSON.',
                temperature: 0.2,
                maxTokens: 500,
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 5000)
            )
        ]) as any;

        const text = result.text || '';
        return extractJSON(text);
    } catch (error) {
        console.error('Analysis Error:', error);
        return null;
    }
}

// ============================================
// SMART DECISION ENGINE (STATE-BASED)
// ============================================
async function makeSmartDecision(
    userMessage: string,
    aiAnalysis: any,
    patterns: any,
    context: any
) {
    const userMsg = userMessage.toLowerCase();
    const goals = context.learningContext?.goals || [];
    const turnCount = context.turnCount || 0;

    // 1. Force GOALS stage if no goals exist
    if (goals.length === 0) {
        return {
            action: 'generate_roadmap',
            forcedStage: 'GOALS',
            transition: "Let's set our roadmap for today! 🎯"
        };
    }

    // 2. Explicit Challenge Request
    if (patterns.wantsChallenge || aiAnalysis?.readyForChallenge) {
        return {
            action: 'send_challenge',
            forcedStage: 'CHALLENGE',
            transition: "Alright, let's jump into a practical challenge! 🚀"
        };
    }

    // 3. Explicit Quiz Request
    if (patterns.wantsQuiz || aiAnalysis?.readyForQuiz) {
        return {
            action: 'send_quiz',
            forcedStage: 'QUIZ',
            transition: "Let's see what you've got! 🧠"
        };
    }

    // 4. Initial Challenge Stage (Placement)
    const hasDoneChallenge = goals.some((g: any) => g.status === 'mastered' || (g.confidence > 50));
    const challengeRelated = userMsg.includes('challenge') || userMsg.includes('task') || userMsg.includes('approach');
    
    if (turnCount >= 1 && turnCount <= 4 && !hasDoneChallenge && !challengeRelated) {
         return {
            action: 'send_challenge',
            forcedStage: 'CHALLENGE',
            transition: "To kick things off, let's see where you stand with a practical challenge! 🚀"
        };
    }

    // 5. Handle Completion of Challenge/Quiz
    if (userMsg.includes('challenge answer') || userMsg.includes('my submission') || userMsg.includes('mastered the challenge') || userMsg.includes('correctly answered')) {
        // If they just finished a challenge, maybe give them a quiz or move to EXPLAIN
        if (userMsg.includes('challenge')) {
            return {
                action: 'send_quiz',
                forcedStage: 'QUIZ',
                transition: "Excellent mastery of that challenge! Let's do a quick knowledge check to solidify it. 🎯"
            };
        }
        
        return {
            action: 'continue_explaining',
            forcedStage: 'EXPLAIN',
            transition: "Great job on that check! Let's move forward."
        };
    }

    // 6. Competency-Based Transition
    const avgConfidence = goals.length > 0 
        ? goals.reduce((acc: number, g: any) => acc + (g.confidence || 0), 0) / goals.length 
        : 0;

    const allGoalsMastered = goals.length > 0 && goals.every((g: any) => (g.confidence || 0) >= 70);

    if (allGoalsMastered) {
        return {
            action: 'complete_session',
            forcedStage: 'EXPLAIN',
            transition: "You've absolutely crushed all your learning goals (70%+ confidence)! You're ready for the next skill. 🏆"
        };
    }

    // 7. Default: Intelligent Tutoring (EXPLAIN)
    if (avgConfidence > 40 && turnCount % 3 === 0) {
        return {
            action: 'send_quiz',
            forcedStage: 'QUIZ',
            transition: "You're getting the hang of this. Let's test it! 🧠"
        };
    }

    return {
        action: 'continue_explaining',
        forcedStage: 'EXPLAIN',
        transition: "Let's dive deeper."
    };
}

// ============================================
// HUMAN-LIKE STREAMING
// ============================================
function getHumanDelay(word: string, isStartOfSentence: boolean): number {
    const base = 25 + Math.random() * 25;
    if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) return base + 100;
    if (word.endsWith(',')) return base + 40;
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
// MAIN API ROUTE
// ============================================
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const body = await request.json();
        const {
            userMessage,
            sessionId,
            courseId,
            currentSkillId,
            skillTitle,
            learningStage,
            conversationHistory,
            turnCount,
            learningContext = {}
        } = body;

        if (!userMessage || !sessionId) {
            return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400 });
        }

        const persistenceClient = await createServerSupabaseClient();

        const { data: sessionData } = await persistenceClient
            .from('interactive_course_sessions')
            .select('learning_context')
            .eq('id', sessionId)
            .single();

        const currentContext = sessionData?.learning_context || learningContext;
        let goals: LearningGoal[] = currentContext.goals || [];

        const aiAnalysis = await analyzeUnderstanding(userMessage, conversationHistory, skillTitle || currentSkillId, goals);
        
        if (aiAnalysis?.updatedGoals) {
            goals = goals.map(goal => {
                const update = aiAnalysis.updatedGoals.find((u: any) => u.id === goal.id);
                if (update) {
                    const newConfidence = Math.max(0, Math.min(100, (goal.confidence || 0) + update.confidenceAdjustment));
                    return {
                        ...goal,
                        confidence: newConfidence,
                        status: newConfidence >= 80 ? 'mastered' : newConfidence > 0 ? 'in_progress' : 'pending',
                        evidence: update.evidence || goal.evidence,
                        timestamp: new Date().toISOString()
                    };
                }
                return goal;
            });
        }

        const decision = await makeSmartDecision(userMessage, aiAnalysis, detectBehavioralPatterns(userMessage, conversationHistory), {
            turnCount,
            learningContext: { ...currentContext, goals }
        });

        const effectiveStage = decision.forcedStage;

        await persistenceClient
            .from('interactive_course_sessions')
            .update({
                learning_context: {
                    ...currentContext,
                    goals,
                    comprehensionLevel: aiAnalysis?.confidence || currentContext.comprehensionLevel || 0.5
                },
                last_interaction: new Date().toISOString()
            })
            .eq('id', sessionId);

        let systemPrompt = `You are Genie, a world-class mentor for "${skillTitle || currentSkillId}".
Your goal is to guide the student through the "${effectiveStage}" stage.

CRITICAL INSTRUCTIONS:
1. INTERNAL STAGE PROTECTION: Never reveal the current stage (e.g., "STAGE IS QUIZ") or any technical labels to the student. Speak naturally.
2. CONCISE CONVERSATION: If STAGE is "QUIZ" or "CHALLENGE", minimize conversational filler. Provide the JSON block immediately.
3. IF STAGE IS "GOALS": Output ONLY a [ROADMAP] JSON block.
4. IF STAGE IS "QUIZ": Output ONLY a [QUIZ] JSON block.
5. IF STAGE IS "CHALLENGE": Output ONLY a [CHALLENGE] JSON block.
6. IF STAGE IS "EXPLAIN": Engage in deep, conversational Socratic tutoring.

GOALS TO MASTER:
${goals.map(g => `- ${g.text} (Current: ${g.confidence}%)`).join('\n')}

[ROADMAP] STRUCTURE:
{"title": "...", "description": "...", "items": [{"id": "g1", "text": "Goal Title", "description": "Goal Details", "confidence": 0}, ...]}

[QUIZ] STRUCTURE:
{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "...", "explanation": "..."}

[CHALLENGE] STRUCTURE:
{"title": "...", "description": "...", "hint": "...", "expectedOutcome": "...", "difficulty": "..."}`;

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    await persistenceClient.rpc('add_conversation_message', {
                        p_session_id: sessionId,
                        p_role: 'learner',
                        p_content: userMessage,
                        p_message_type: 'explanation',
                        p_metadata: {}
                    });

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                        type: 'goals_updated', 
                        goals,
                        comprehensionLevel: aiAnalysis?.confidence || currentContext.comprehensionLevel || 0.5
                    })}\n\n`));

                    const finalPrompt = effectiveStage === 'GOALS' 
                        ? `Generate the learning roadmap for ${skillTitle || currentSkillId} based on: ${userMessage}. Return ONLY the [ROADMAP] JSON block.`
                        : userMessage;

                    const result = await generateWithRetry({
                        prompt: finalPrompt,
                        systemPrompt,
                        temperature: effectiveStage === 'EXPLAIN' ? 0.7 : 0.05,
                        maxTokens: 1200,
                    });

                    const genieResponse = result.text || "Let's keep going!";

                    // ROBUST COMPONENT DETECTION
                    const extractedData = extractJSON(genieResponse);
                    const hasRoadmap = genieResponse.includes('[ROADMAP]') || (extractedData && extractedData.items && extractedData.title);
                    const hasQuiz = genieResponse.includes('[QUIZ]') || (extractedData && extractedData.question && extractedData.options);
                    const hasChallenge = genieResponse.includes('[CHALLENGE]') || (extractedData && extractedData.title && extractedData.description && !extractedData.items);

                    if (hasRoadmap) {
                        const [intro] = genieResponse.split('[ROADMAP]');
                        const roadmapData = extractedData || extractJSON(genieResponse.split('[ROADMAP]')[1]);
                        
                        if (intro && !genieResponse.startsWith('[ROADMAP]')) {
                            await streamText(intro.trim(), controller, encoder);
                        }

                        if (roadmapData) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'roadmap', roadmapData })}\n\n`));
                            const newGoals = roadmapData.items.map((it: any) => ({
                                id: it.id,
                                text: it.text,
                                description: it.description,
                                status: 'pending',
                                confidence: it.confidence || 0
                            }));
                            await persistenceClient.from('interactive_course_sessions').update({
                                learning_context: { ...currentContext, goals: newGoals }
                            }).eq('id', sessionId);
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'goals_updated', goals: newGoals })}\n\n`));
                            
                            await persistenceClient.rpc('add_conversation_message', {
                                p_session_id: sessionId,
                                p_role: 'genie',
                                p_content: intro?.trim() || 'Here is our roadmap:',
                                p_message_type: 'summary',
                                p_metadata: { roadmapData }
                            });
                        }
                    } else if (hasQuiz) {
                        const [intro] = genieResponse.split('[QUIZ]');
                        const quizData = extractedData || extractJSON(genieResponse.split('[QUIZ]')[1]);

                        if (intro && !genieResponse.startsWith('[QUIZ]')) {
                            await streamText(intro.trim(), controller, encoder);
                        }

                        if (quizData) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'quiz', quizData })}\n\n`));
                            await persistenceClient.rpc('add_conversation_message', {
                                p_session_id: sessionId,
                                p_role: 'genie',
                                p_content: quizData.question,
                                p_message_type: 'assessment',
                                p_metadata: quizData
                            });
                        }
                    } else if (hasChallenge) {
                        const [intro] = genieResponse.split('[CHALLENGE]');
                        const challengeData = extractedData || extractJSON(genieResponse.split('[CHALLENGE]')[1]);

                        if (intro && !genieResponse.startsWith('[CHALLENGE]')) {
                            await streamText(intro.trim(), controller, encoder);
                        }

                        if (challengeData) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'challenge_trigger', challengeData })}\n\n`));
                            await persistenceClient.rpc('add_conversation_message', {
                                p_session_id: sessionId,
                                p_role: 'genie',
                                p_content: challengeData.description,
                                p_message_type: 'challenge',
                                p_metadata: challengeData
                            });
                        }
                    } else {
                        await streamText(genieResponse, controller, encoder);
                        await persistenceClient.rpc('add_conversation_message', {
                            p_session_id: sessionId,
                            p_role: 'genie',
                            p_content: genieResponse,
                            p_message_type: 'explanation',
                            p_metadata: {}
                        });
                    }
                    controller.close();
                } catch (e) { controller.close(); }
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
