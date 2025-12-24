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
        "i'm ready", "let's do this", 'quiz me', 'test me', 'perfect'
    ];

    const explicitConfusion = [
        'confused', "don't get", "don't understand", 'what?', 'huh?',
        'lost', 'not sure', 'unclear', 'wait', 'can you explain', 'help'
    ];

    const msg = userMessage.toLowerCase();

    return {
        showsUnderstanding: explicitUnderstanding.some(phrase => msg.includes(phrase)),
        showsConfusion: explicitConfusion.some(phrase => msg.includes(phrase)),
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
        // Find the first '{' and the last '}'
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            let jsonStr = text.substring(firstBrace, lastBrace + 1).trim();
            // Remove markdown code blocks if present
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
    const analysisPrompt = `Analyze student comprehension and progress toward learning goals.
Return ONLY valid JSON.

TOPIC: ${currentTopic}
STUDENT: "${userMessage}"
CURRENT GOALS: ${JSON.stringify(goals)}

Return:
{
  "comprehensionLevel": "high"|"medium"|"low"|"confused",
  "confidence": 0.0-1.0,
  "updatedGoals": [
    {
      "id": "string",
      "confidenceAdjustment": number (-20 to +30),
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
                systemPrompt: 'Return only valid JSON. Be critical but fair.',
                temperature: 0.2,
                maxTokens: 300,
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 4000)
            )
        ]) as any;

        const text = result.text || '';
        return extractJSON(text);
    } catch (error) {
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

    // 2. Initial Challenge Stage (Placement)
    // If goals exist but we haven't done a challenge yet (first few turns)
    const hasDoneChallenge = goals.some((g: any) => g.status === 'mastered' || (g.confidence > 50));
    const challengeRelated = userMsg.includes('challenge') || userMsg.includes('task') || userMsg.includes('approach');
    
    if (turnCount >= 1 && turnCount <= 3 && !hasDoneChallenge && !challengeRelated) {
         return {
            action: 'send_challenge',
            forcedStage: 'CHALLENGE',
            transition: "To kick things off, let's see where you stand with a practical challenge! 🚀"
        };
    }

    // 3. Handle Completion of Challenge/Quiz
    if (userMsg.includes('challenge answer') || userMsg.includes('my submission') || (challengeRelated && patterns.showsUnderstanding)) {
        return {
            action: 'send_quiz',
            forcedStage: 'QUIZ',
            transition: "Solid effort! Let's double-check that with a quick pulse check. 🎯"
        };
    }

    // 4. Competency-Based Transition
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

    // 5. Default: Intelligent Tutoring (EXPLAIN)
    // Transition to QUIZ if confidence is high but not mastered
    if (aiAnalysis?.readyForQuiz || (avgConfidence > 40 && turnCount % 3 === 0)) {
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
    const startTime = Date.now();
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

        const { data: { session: authSession } } = await supabase.auth.getSession();
        const persistenceClient = await createServerSupabaseClient();

        // 1. Fetch Session State
        const { data: sessionData } = await persistenceClient
            .from('interactive_course_sessions')
            .select('learning_context')
            .eq('id', sessionId)
            .single();

        const currentContext = sessionData?.learning_context || learningContext;
        let goals: LearningGoal[] = currentContext.goals || [];

        // 2. AI Analysis & Goal Updates
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

        // 3. Make Decision
        const decision = await makeSmartDecision(userMessage, aiAnalysis, detectBehavioralPatterns(userMessage, conversationHistory), {
            turnCount,
            learningContext: { ...currentContext, goals }
        });

        const effectiveStage = decision.forcedStage;

        // 4. Update Database Session
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

    // 5. Build System Prompt
    let systemPrompt = `You are Genie, a world-class mentor for "${skillTitle || currentSkillId}".
Your goal is to help the learner achieve 100% confidence in these goals:
${goals.map(g => `- ${g.text} (Current: ${g.confidence}%)`).join('\n')}

CURRENT STAGE: ${effectiveStage}
DECISION: ${decision.action}

RULES:
- Be direct, conversational, and focus strictly on the subject.
- If effectiveStage is GOALS and action is generate_roadmap: 
  Return a [ROADMAP] JSON. 
  Example: [ROADMAP] {"title": "Mastering Market Analysis", "description": "...", "items": [{"id": "g1", "text": "Identify Target Audience", "description": "...", "confidence": 0}, ...]}
- If effectiveStage is QUIZ: Send a [QUIZ] JSON.
- If effectiveStage is CHALLENGE: Send a [CHALLENGE] JSON.
- If effectiveStage is EXPLAIN: Provide deep insights and check progress.

FORMATS:
[QUIZ] {"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "...", "explanation": "..."}
[CHALLENGE] {"title": "...", "description": "...", "hint": "...", "expectedOutcome": "...", "difficulty": "..."}`;


        // 6. Stream Response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // 6a. Persist Learner Message (to ensure history is complete)
                    await persistenceClient.rpc('add_conversation_message', {
                        p_session_id: sessionId,
                        p_role: 'learner',
                        p_content: userMessage,
                        p_message_type: 'explanation',
                        p_metadata: {}
                    });

                    // Send Goal Updates First
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                        type: 'goals_updated', 
                        goals,
                        comprehensionLevel: aiAnalysis?.confidence || currentContext.comprehensionLevel || 0.5
                    })}\n\n`));

                    const result = await generateWithRetry({
                        prompt: userMessage,
                        systemPrompt,
                        temperature: 0.7,
                        maxTokens: 600,
                    });

                    const genieResponse = result.text || "Let's keep going!";

                    if (genieResponse.includes('[ROADMAP]')) {
                        const [intro, roadmap] = genieResponse.split('[ROADMAP]');
                        if (intro) await streamText(intro.trim(), controller, encoder);
                        try {
                            const roadmapData = extractJSON(roadmap);
                            if (roadmapData) {
                                // 1. Send Roadmap UI
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'roadmap', roadmapData })}\n\n`));
                                
                                // 2. Persist Goals
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

                                // 3. Persist Roadmap Message
                                await persistenceClient.rpc('add_conversation_message', {
                                    p_session_id: sessionId,
                                    p_role: 'genie',
                                    p_content: intro.trim() || 'Here is our roadmap:',
                                    p_message_type: 'summary',
                                    p_metadata: { roadmapData }
                                });

                                // 4. IMMEDIATELY TRIGGER CHALLENGE (As requested: "send a challenge imediately")
                                const challengeResult = await generateWithRetry({
                                    prompt: `Create a first practical challenge for these goals: ${JSON.stringify(newGoals)}`,
                                    systemPrompt: `Return ONLY valid JSON: [CHALLENGE] {"title": "...", "description": "...", "hint": "...", "expectedOutcome": "...", "difficulty": "Easy"}`,
                                    temperature: 0.7
                                });
                                
                                const challengeText = challengeResult.text || '';
                                if (challengeText.includes('[CHALLENGE]')) {
                                    const cData = extractJSON(challengeText.split('[CHALLENGE]')[1]);
                                    if (cData) {
                                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'challenge_trigger', challengeData: cData })}\n\n`));
                                        
                                        // Persist Challenge Message
                                        await persistenceClient.rpc('add_conversation_message', {
                                            p_session_id: sessionId,
                                            p_role: 'genie',
                                            p_content: cData.description,
                                            p_message_type: 'challenge',
                                            p_metadata: cData
                                        });
                                    }
                                }
                            }
                        } catch (e) { }
                    } else if (genieResponse.includes('[QUIZ]')) {
                        const [intro, quiz] = genieResponse.split('[QUIZ]');
                        if (intro) await streamText(intro.trim(), controller, encoder);
                        try {
                            const quizData = extractJSON(quiz);
                            if (quizData) {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'quiz', quizData })}\n\n`));
                                
                                // Persist Quiz Message
                                await persistenceClient.rpc('add_conversation_message', {
                                    p_session_id: sessionId,
                                    p_role: 'genie',
                                    p_content: quizData.question,
                                    p_message_type: 'assessment',
                                    p_metadata: quizData
                                });
                            } else {
                                await streamText('[QUIZ] ' + quiz, controller, encoder);
                            }
                        } catch (e) { await streamText('[QUIZ] ' + quiz, controller, encoder); }
                    } else if (genieResponse.includes('[CHALLENGE]')) {
                        const [intro, challenge] = genieResponse.split('[CHALLENGE]');
                        if (intro) await streamText(intro.trim(), controller, encoder);
                        try {
                            const challengeData = extractJSON(challenge);
                            if (challengeData) {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'challenge_trigger', challengeData })}\n\n`));
                                
                                // Persist Challenge Message
                                await persistenceClient.rpc('add_conversation_message', {
                                    p_session_id: sessionId,
                                    p_role: 'genie',
                                    p_content: challengeData.description,
                                    p_message_type: 'challenge',
                                    p_metadata: challengeData
                                });
                            } else {
                                await streamText('[CHALLENGE] ' + challenge, controller, encoder);
                            }
                        } catch (e) { await streamText('[CHALLENGE] ' + challenge, controller, encoder); }
                    } else {
                        await streamText(genieResponse, controller, encoder);
                        
                        // Persist Regular Explanation Message
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
