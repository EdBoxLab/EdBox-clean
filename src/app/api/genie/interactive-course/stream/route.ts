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
        "quiz me", "test me", "give me a quiz", "ready for a quiz", "quiz me on what we've learned"
    ];

    const msg = userMessage.toLowerCase();

    // Detect quiz completion with success
    const quizSuccess = msg.includes('correctly answered') || 
        msg.includes('quiz: correct') || 
        (msg.includes('quiz') && msg.includes('correct'));
    
    // Detect quiz completion with failure
    const quizFail = (msg.includes('struggled with the quiz') || 
        (msg.includes('quiz') && msg.includes('struggled')));

    // Detect challenge completion with success
    const challengeSuccess = msg.includes('successfully mastered the challenge') || 
        msg.includes('challenge completed') || 
        msg.includes('mastered the challenge') ||
        (msg.includes('challenge') && msg.includes('mastered'));
    
    // Detect challenge completion with failure
    const challengeFail = (msg.includes('struggled with the challenge') || 
        (msg.includes('challenge') && msg.includes('need more practice')));

    return {
        showsUnderstanding: explicitUnderstanding.some(phrase => msg.includes(phrase)) || quizSuccess || challengeSuccess,
        showsConfusion: explicitConfusion.some(phrase => msg.includes(phrase)) || quizFail || challengeFail,
        wantsChallenge: challengeRequest.some(phrase => msg.includes(phrase)),
        wantsQuiz: quizRequest.some(phrase => msg.includes(phrase)),
        isEngaged: userMessage.split(' ').length > 8 || msg.includes('?'),
        responseLength: userMessage.split(' ').length,
        exchangeCount: conversationHistory ? conversationHistory.filter((m: any) => m.role === 'assistant').length : 0,
        justFinishedChallenge: challengeSuccess,
        justFinishedQuiz: quizSuccess,
        challengeFailed: challengeFail,
        quizFailed: quizFail
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
    const goals = context.learningContext?.goals || [];
    const turnCount = context.turnCount || 0;

    console.log('[DECISION_DEBUG] Analysis Start');
    console.log('[DECISION_DEBUG] context.currentStage:', context.currentStage);
    console.log('[DECISION_DEBUG] turnCount:', turnCount);
    console.log('[DECISION_DEBUG] patterns.justFinishedChallenge:', patterns.justFinishedChallenge);
    console.log('[DECISION_DEBUG] patterns.justFinishedQuiz:', patterns.justFinishedQuiz);

    // Turn 0-1: Send goals first
    if (turnCount <= 1 && !context.goalsGiven) {
        return {
            action: 'generate_roadmap',
            forcedStage: 'GOALS',
            transition: "Let's set our roadmap for today! \ud83c\udfaf"
        };
    }

    // Handle quiz/challenge completion - provide appropriate feedback
    if (patterns.justFinishedQuiz) {
        return {
            action: 'quiz_feedback',
            forcedStage: 'EXPLAIN',
            transition: "Great job on the quiz! \ud83c\udf1f Your progress has been recorded.",
            progressUpdate: { type: 'quiz_success', boost: 20 }
        };
    }

    if (patterns.quizFailed) {
        return {
            action: 'quiz_retry',
            forcedStage: 'EXPLAIN',
            transition: "No worries! Let me explain this concept differently. \ud83d\udca1",
            progressUpdate: { type: 'quiz_fail', boost: -5 }
        };
    }

    if (patterns.justFinishedChallenge) {
        return {
            action: 'challenge_feedback',
            forcedStage: 'EXPLAIN',
            transition: "Excellent work on that challenge! \ud83d\ude80 You're making great progress!",
            progressUpdate: { type: 'challenge_success', boost: 30 }
        };
    }

    if (patterns.challengeFailed) {
        return {
            action: 'challenge_retry',
            forcedStage: 'EXPLAIN',
            transition: "That was a tough one! Let's review the concepts and try again. \ud83d\udcaa",
            progressUpdate: { type: 'challenge_fail', boost: -10 }
        };
    }

    // 2. Explicit Challenge/Quiz Requests
    if (patterns.wantsChallenge || aiAnalysis?.readyForChallenge) {
        return {
            action: 'send_challenge',
            forcedStage: 'CHALLENGE',
            transition: "Alright, let's jump into a practical challenge! \ud83d\ude80"
        };
    }
    if (patterns.wantsQuiz || aiAnalysis?.readyForQuiz) {
        return {
            action: 'send_quiz',
            forcedStage: 'QUIZ',
            transition: "Let's test your knowledge with a quick quiz! \u26a1"
        };
    }

    // Calculate readiness score for automatic transitions
    let readinessScore = 50;
    if (patterns.showsUnderstanding) readinessScore += 30;
    if (patterns.isEngaged) readinessScore += 10;
    if (aiAnalysis) {
        const levelScores: any = { high: 30, medium: 15, low: 5, confused: 0 };
        readinessScore += levelScores[aiAnalysis.comprehensionLevel] || 0;
        readinessScore += Math.round((aiAnalysis.confidence || 0) * 10);
    }
    readinessScore = Math.max(0, Math.min(100, readinessScore));

    if (readinessScore > 85 && turnCount > 3) {
        return {
            action: 'send_quiz',
            forcedStage: 'QUIZ',
            transition: "You're showing great understanding! Ready for a quick check? \u26a1"
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
    const base = 20 + Math.random() * 20;
    if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) return base + 80;
    if (word.endsWith(',')) return base + 30;
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
        const currentTopic = skillTitle || currentSkillId || 'this topic';

        // 1. Fetch current session state
        const { data: sessionData } = await persistenceClient
            .from('interactive_course_sessions')
            .select('learning_context, progress_state')
            .eq('id', sessionId)
            .single();

        const currentContext = sessionData?.learning_context || learningContext;
        const currentProgress = sessionData?.progress_state || {
            completedTopics: [],
            currentTopicProgress: 0,
            overallCourseProgress: 0,
            masteredSkills: [],
            strugglingSkills: [],
            totalTimeSpent: 0,
            challengesCompleted: 0,
            assessmentsCompleted: 0
        };
        let goals: LearningGoal[] = currentContext.goals || [];

        // 2. Detect patterns and analyze comprehension
        const patterns = detectBehavioralPatterns(userMessage, conversationHistory || []);
        const aiAnalysis = await analyzeUnderstanding(userMessage, conversationHistory || [], currentTopic, goals);
        
        // 3. Update goals based on analysis
        if (aiAnalysis?.updatedGoals) {
            goals = goals.map(g => {
                const update = aiAnalysis.updatedGoals.find((u: any) => u.id === g.id);
                if (update) {
                    const newConfidence = Math.max(0, Math.min(100, (g.confidence || 0) + (update.confidenceAdjustment || 0)));
                    return {
                        ...g,
                        confidence: newConfidence,
                        status: newConfidence >= 80 ? 'mastered' : (newConfidence > 0 ? 'in_progress' : 'pending'),
                        evidence: update.evidence || g.evidence,
                        timestamp: new Date().toISOString()
                    };
                }
                return g;
            });
        }

        // 4. Make a smart decision on the next stage
        const decision = await makeSmartDecision(userMessage, aiAnalysis, patterns, {
            currentStage: learningStage || 'EXPLAIN',
            turnCount: turnCount || conversationHistory?.length || 0,
            learningContext: { ...currentContext, goals },
            goalsGiven: !!goals.length,
            sessionId
        });

        const effectiveStage = decision.forcedStage || 'EXPLAIN';

        // 4b. Apply progress updates from decision (quiz/challenge completion)
        if (decision.progressUpdate && goals.length > 0) {
            const boost = decision.progressUpdate.boost || 0;
            // Find the first in_progress goal to update
            const inProgressGoalIndex = goals.findIndex(g => g.status === 'in_progress');
            if (inProgressGoalIndex >= 0) {
                const g = goals[inProgressGoalIndex];
                const newConfidence = Math.max(0, Math.min(100, (g.confidence || 0) + boost));
                goals[inProgressGoalIndex] = {
                    ...g,
                    confidence: newConfidence,
                    status: newConfidence >= 80 ? 'mastered' : (newConfidence > 0 ? 'in_progress' : 'pending'),
                    timestamp: new Date().toISOString()
                };
            }
        }

        // 5. Update session in background
        const updatedProgress = { ...currentProgress };
        const totalConfidence = goals.reduce((acc, g) => acc + (g.confidence || 0), 0);
        updatedProgress.overallCourseProgress = goals.length > 0 ? Math.round(totalConfidence / goals.length) : 0;

        // Track quiz and challenge completions
        if (patterns.justFinishedQuiz) {
            updatedProgress.assessmentsCompleted = (updatedProgress.assessmentsCompleted || 0) + 1;
        }
        if (patterns.justFinishedChallenge) {
            updatedProgress.challengesCompleted = (updatedProgress.challengesCompleted || 0) + 1;
        }

        await persistenceClient
            .from('interactive_course_sessions')
            .update({
                learning_context: {
                    ...currentContext,
                    goals,
                    comprehensionLevel: aiAnalysis?.confidence || currentContext.comprehensionLevel || 0.5,
                    lastDecision: decision
                },
                progress_state: updatedProgress,
                last_interaction: new Date().toISOString()
            })
            .eq('id', sessionId);

        // 6. Construct system prompt
        const courseContext = `CONTEXT: You are teaching "${currentTopic}". The learner is currently in the ${effectiveStage} phase.`;
        let systemPrompt = '';

        if (effectiveStage === 'GOALS') {
            systemPrompt = `You are Genie, a world-class mentor for "${currentTopic}".
CRITICAL: You MUST output exactly one [ROADMAP] block containing the JSON.
[ROADMAP]
{
  "title": "Mastering ${currentTopic}",
  "description": "Our journey through ${currentTopic}",
  "items": [
    {"id": "g1", "text": "Foundation", "description": "...", "confidence": 0},
    {"id": "g2", "text": "Core Concepts", "description": "...", "confidence": 0},
    {"id": "g3", "text": "Advanced Mastery", "description": "...", "confidence": 0}
  ]
}`;
        } else if (effectiveStage === 'QUIZ') {
            systemPrompt = `You are Genie, an expert AI tutor. 
${courseContext}
YOUR MISSION:
Deliver a single multiple-choice question testing "${currentTopic}".
INSTRUCTIONS:
1. Provide a brief encouraging transition text.
2. Follow it with the [QUIZ] tag and the JSON object.
CRITICAL: You MUST include the [QUIZ] tag.

Example:
Great progress! Let's check your understanding.
[QUIZ]
{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "A|B|C|D", "explanation": "..."}`;
        } else if (effectiveStage === 'CHALLENGE') {
            systemPrompt = `You are Genie, a practical mentor for "${currentTopic}".
${courseContext}
YOUR MISSION:
Present a small hands-on task.
INSTRUCTIONS:
1. Provide a brief encouraging transition text.
2. Follow it with the [CHALLENGE] tag and the JSON object.
CRITICAL: You MUST include the [CHALLENGE] tag.

Example:
Time for some action!
[CHALLENGE]
{"title": "...", "description": "...", "hint": "...", "expectedOutcome": "...", "difficulty": "beginner"}`;
        } else {
            systemPrompt = `You are Genie, a subject matter expert in "${currentTopic}". 
${courseContext}
RULES:
- Be concise (2-4 sentences).
- Stay interactive.
- Use 1-2 emojis max.
- Student readiness: ${aiAnalysis?.comprehensionLevel || 'medium'}.`;
        }

        // 7. Stream the response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Record user message
                    await persistenceClient.rpc('add_conversation_message', {
                        p_session_id: sessionId,
                        p_role: 'learner',
                        p_content: userMessage,
                        p_message_type: 'explanation'
                    });

                    // Send metadata update
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                        type: 'goals_updated', 
                        goals,
                        comprehensionLevel: aiAnalysis?.confidence || currentContext.comprehensionLevel || 0.5
                    })}\n\n`));

                    const finalPrompt = effectiveStage === 'GOALS' 
                        ? `Generate a 3-step learning roadmap for ${currentTopic}. Return only the JSON block.`
                        : userMessage;

                    const aiResult = await generateWithRetry({
                        prompt: finalPrompt,
                        systemPrompt,
                        temperature: effectiveStage === 'EXPLAIN' ? 0.7 : 0.1,
                        maxTokens: 1000,
                    });

                    const genieResponse = aiResult.text || "I'm here to help! What's next?";
                    const extractedData = extractJSON(genieResponse);

                    if (genieResponse.includes('[ROADMAP]') || (extractedData && extractedData.items)) {
                        const parts = genieResponse.split('[ROADMAP]');
                        const intro = parts[0]?.trim();
                        const roadmapData = extractedData || extractJSON(parts[1]);
                        if (intro) await streamText(intro, controller, encoder);
                        if (roadmapData) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'roadmap', roadmapData })}\n\n`));
                            await persistenceClient.rpc('add_conversation_message', {
                                p_session_id: sessionId,
                                p_role: 'genie',
                                p_content: intro || 'Here is our roadmap:',
                                p_message_type: 'summary',
                                p_metadata: { roadmapData }
                            });
                        }
                    } else if (genieResponse.includes('[QUIZ]') || (extractedData && extractedData.question)) {
                        const parts = genieResponse.split('[QUIZ]');
                        const intro = parts[0]?.trim();
                        const quizData = extractedData || extractJSON(parts[1]);
                        if (intro) await streamText(intro, controller, encoder);
                        if (quizData) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'quiz', quizData })}\n\n`));
                            await persistenceClient.rpc('add_conversation_message', {
                                p_session_id: sessionId,
                                p_role: 'genie',
                                p_content: intro || quizData.question,
                                p_message_type: 'assessment',
                                p_metadata: quizData
                            });
                        }
                    } else if (genieResponse.includes('[CHALLENGE]') || (extractedData && extractedData.description && !extractedData.items)) {
                        const parts = genieResponse.split('[CHALLENGE]');
                        const intro = parts[0]?.trim();
                        const challengeData = extractedData || extractJSON(parts[1]);
                        if (intro) await streamText(intro, controller, encoder);
                        if (challengeData) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'challenge_trigger', challengeData })}\n\n`));
                            await persistenceClient.rpc('add_conversation_message', {
                                p_session_id: sessionId,
                                p_role: 'genie',
                                p_content: intro || challengeData.description,
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
                            p_message_type: 'explanation'
                        });
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
        console.error('POST Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
