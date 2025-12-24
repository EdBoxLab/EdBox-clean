import { NextRequest } from 'next/server';
import { createSupabaseServerClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';

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
// AI UNDERSTANDING ANALYZER (WITH TIMEOUT)
// ============================================
async function analyzeUnderstanding(
    userMessage: string,
    conversationHistory: any[],
    currentTopic: string
) {
    const analysisPrompt = `Analyze student comprehension. Return ONLY valid JSON.

TOPIC: ${currentTopic}
STUDENT: "${userMessage}"

Return:
{
  "comprehensionLevel": "high"|"medium"|"low"|"confused",
  "confidence": 0.0-1.0,
  "readyForQuiz": boolean,
  "needsMoreExplanation": boolean,
  "reasoning": "brief"
}`;

    try {
        const result = await Promise.race([
            generateWithRetry({
                prompt: analysisPrompt,
                systemPrompt: 'Return only valid JSON.',
                temperature: 0.2,
                maxTokens: 200,
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 3000)
            )
        ]) as any;

        const text = result.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.comprehensionLevel && typeof parsed.confidence === 'number') {
                return parsed;
            }
        }

        throw new Error('Invalid response');
    } catch (error) {
        return null; // Fallback to keyword detection
    }
}

// ============================================
// SMART DECISION ENGINE
// ============================================
async function makeSmartDecision(
    userMessage: string,
    aiAnalysis: any,
    patterns: any,
    context: any
) {
    // Fast decisions for explicit stages
    const userMsg = userMessage.toLowerCase();
    const hasAcknowledged = userMsg.includes('ok') || userMsg.includes('ready') ||
        userMsg.includes('let\'s') || userMsg.includes('got it') ||
        userMsg.includes('sounds good') || userMsg.includes('yes') ||
        userMsg.includes('sure') || userMsg.includes('alright') || userMsg.includes('cool') ||
        userMsg.includes('send') || userMsg.includes('start') || userMsg.includes('go');

    // Use turnCount from context (passed from frontend) - much more reliable
    const turnCount = context.turnCount || 0;

    // DEBUG: Log all decision variables (VERBOSE)
    console.log('----------------------------------------------------');
    console.log('[DECISION_DEBUG] Analysis Start');
    console.log('[DECISION_DEBUG] userMessage:', userMessage.substring(0, 100));
    console.log('[DECISION_DEBUG] hasAcknowledged:', hasAcknowledged);
    console.log('[DECISION_DEBUG] context.currentStage:', context.currentStage);
    console.log('[DECISION_DEBUG] turnCount:', turnCount);
    console.log('[DECISION_DEBUG] goalsGiven:', context.goalsGiven);
    console.log('----------------------------------------------------');

    // Turn 0-1: Send goals first
    if (turnCount <= 1 && !context.goalsGiven) {
        console.log('[DECISION_DEBUG] -> Choosing GOALS (turn 0-1)');
        return {
            action: 'continue_explaining',
            confidence: 1.0,
            transition: "Welcome! Let me share our learning goals for this skill. 🎯",
            forcedStage: 'GOALS'
        };
    }

    // Turn 2-3: Challenge (if not just finished one and user acknowledged goals)
    const justFinishedChallenge = userMsg.includes('challenge answer') || userMsg.includes('my submission') || userMsg.includes('verify');

    if (turnCount >= 2 && turnCount <= 3 && !justFinishedChallenge) {
        console.log('[DECISION_DEBUG] -> Choosing CHALLENGE (turn 2-3)');
        return {
            action: 'send_challenge',
            confidence: 1.0,
            transition: "Now that we have our goals, let's jump into a practical challenge! 🚀"
        };
    }

    // Turn 4+: After challenge, verify with a Quiz
    // Turn 4+: After challenge, verify with a Quiz
    // Turn 4+: After challenge, verify with a Quiz
    if (justFinishedChallenge) {
        console.log('[DECISION_DEBUG] -> Switching to QUIZ after challenge');

        // Check for mastery of pending goals (Transactional Update)
        if (context.goals && context.goals.length > 0) {
            const supabase = await createSupabaseServerClient();

            // Find first pending goal
            const pendingGoal = context.goals.find((g: any) => g.status === 'pending');

            if (pendingGoal && context.sessionId) {
                // Mark as mastered
                const updatedGoals = context.goals.map((g: any) =>
                    g.id === pendingGoal.id
                        ? { ...g, status: 'mastered', evidence: 'Completed challenge successfully' }
                        : g
                );

                // Update DB
                await supabase
                    .from('interactive_course_sessions')
                    .update({
                        learning_context: {
                            ...context,
                            goals: updatedGoals
                        }
                    })
                    .eq('id', context.sessionId);
            }
        }

        return {
            action: 'send_quiz',
            confidence: 0.9,
            transition: "Great work on the challenge! Let's do a quick pulse check to confirm your mastery of that goal. 🎯"
        };
    }

    // ==========================================
    // LOGIC BLOCK: BREAK THE LOOP & DECIDE
    // ==========================================

    // 1. Check if user just answered a quiz (e.g. "I chose..." or "That's exactly right")
    const justFinishedQuiz = userMsg.includes('i chose') || userMsg.includes("exactly right") || userMsg.includes('quiz result');

    // Explicitly transition to explanation if we just finished a quiz OR if we are deep in conversation
    if (justFinishedQuiz || (turnCount >= 4 && !justFinishedChallenge)) {
        console.log('[DECISION_DEBUG] -> Switching to EXPLAIN after quiz/deep conversation');
        return {
            action: 'continue_explaining',
            confidence: 0.95,
            transition: "You've got this down! Let's dive deeper into some advanced nuances. 🧠"
        };
    }

    // 2. Calculate readiness score
    let readinessScore = 50;

    if (patterns.showsUnderstanding) readinessScore += 30;
    if (patterns.isEngaged) readinessScore += 10;
    if (patterns.exchangeCount >= 2 && patterns.exchangeCount <= 5) readinessScore += 20;

    if (aiAnalysis) {
        const levelScores: any = { high: 30, medium: 15, low: 5, confused: 0 };
        readinessScore += levelScores[aiAnalysis.comprehensionLevel] || 0;
        readinessScore += Math.round(aiAnalysis.confidence * 10);
    }

    readinessScore = Math.max(0, Math.min(100, readinessScore));

    console.log(`[DECISION_DEBUG] Readiness Score: ${readinessScore}, Turns: ${turnCount}`);

    // 3. High Readiness Check (Avoiding Loop)
    // If readiness is VERY high and we haven't just done a challenge, maybe suggest one
    // But default to explanation to avoid loops
    if (readinessScore > 90 && turnCount > 8 && !justFinishedChallenge && !justFinishedQuiz) {
        console.log('[DECISION_DEBUG] -> Very high readiness. Suggesting challenge/quiz.');
        return {
            action: 'send_quiz',
            confidence: 0.8,
            transition: "You're clearly mastering this! Quick check? ⚡"
        };
    }

    console.log('[DECISION] Defaulting to EXPLAIN. Score:', readinessScore, 'Turns:', patterns.exchangeCount);
    return {
        action: 'continue_explaining',
        confidence: 0.75,
        transition: "Let me explain this another way.",
        readinessScore
    };
}

// ============================================
// HUMAN-LIKE STREAMING
// ============================================
function getHumanDelay(word: string, isStartOfSentence: boolean): number {
    const base = 35 + Math.random() * 35;

    if (word.endsWith('.')) return base + 140;
    if (word.endsWith('!')) return base + 120;
    if (word.endsWith('?')) return base + 130;
    if (word.endsWith(',')) return base + 60;
    if (word.length > 12) return base + 35;
    if (isStartOfSentence) return base + 40;

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
        const previousWord = i > 0 ? words[i - 1] : '';
        const isStartOfSentence = i === 0 || /[.!?]$/.test(previousWord);

        const chunk = {
            type: 'content',
            content: word + (i < words.length - 1 ? ' ' : '')
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
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
            skillTitle: requestSkillTitle,  // Frontend can send skill title directly
            learningStage,
            conversationHistory,
            chatSummary,
            lastQuizScore,
            turnCount  // Explicit turn counter from frontend
        } = body;

        console.log('[API_REQUEST] Incoming:', {
            courseId,
            currentSkillId,
            learningStage,
            turns: conversationHistory?.length,
            message: userMessage.substring(0, 50) + '...'
        });

        // Validation
        if (!userMessage || !sessionId) {
            return new Response(
                JSON.stringify({ error: 'Message and session ID required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (userMessage.length > 2000) {
            return new Response(
                JSON.stringify({ error: 'Message too long (max 2000 chars)' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get skill graph context
        const { data: { session: authSession } } = await supabase.auth.getSession();

        console.log('[AUTH_DEBUG] authSession exists:', !!authSession, 'courseId:', courseId);

        let courseContext = '';
        // Use skill title from request if provided, otherwise default
        let currentTopic = requestSkillTitle || currentSkillId || 'the current concept';

        if (authSession && courseId) {
            try {
                const { data: skillGraph, error } = await supabase
                    .from('skill_graphs')
                    .select('goal, nodes, edges')
                    .eq('id', courseId)
                    .eq('user_id', authSession.user.id)
                    .single();

                if (skillGraph && !error) {
                    const goal = skillGraph.goal || 'Unknown Goal';
                    const nodes = Array.isArray(skillGraph.nodes) ? skillGraph.nodes : [];
                    const edges = Array.isArray(skillGraph.edges) ? skillGraph.edges : [];

                    // DEBUG: Log the node structure
                    console.log('[SKILL_DEBUG] courseId:', courseId);
                    console.log('[SKILL_DEBUG] currentSkillId:', currentSkillId);
                    console.log('[SKILL_DEBUG] All nodes:', nodes.map((n: any) => ({ id: n.id, name: n.name, title: n.title })));

                    // Find current skill node - check multiple ID patterns
                    let currentSkill = null;
                    if (currentSkillId) {
                        currentSkill = nodes.find((node: any) =>
                            node.id === currentSkillId ||
                            node.id === currentSkillId.toLowerCase() ||
                            node.name === currentSkillId
                        );
                    }

                    // Fallback to first node
                    if (!currentSkill && nodes.length > 0) {
                        currentSkill = nodes[0];
                        console.log('[SKILL_DEBUG] Using fallback (first node):', currentSkill);
                    }

                    console.log('[SKILL_DEBUG] Found currentSkill:', currentSkill);

                    if (currentSkill) {
                        // Extract human-readable name - try multiple properties
                        const skillName = currentSkill.title || currentSkill.name || currentSkill.id || 'Current Skill';
                        const skillType = currentSkill.type || 'skill';
                        const xpReward = currentSkill.xpReward || 0;
                        const estimatedMinutes = currentSkill.estimatedMinutes || 30;
                        const description = currentSkill.description || currentSkill.name || '';
                        const level = currentSkill.level || 'intermediate';

                        currentTopic = skillName;
                        console.log('[SKILL_DEBUG] Extracted skillName:', skillName, '-> currentTopic:', currentTopic);

                        // Find prerequisites (edges pointing TO current skill)
                        const prerequisiteIds = edges
                            .filter((edge: any) => edge.to === currentSkill.id)
                            .map((edge: any) => edge.from);

                        const prerequisites = nodes
                            .filter((node: any) => prerequisiteIds.includes(node.id))
                            .map((node: any) => node.name || node.id)
                            .slice(0, 3);

                        // Find next skills (edges pointing FROM current skill)
                        const nextSkillIds = edges
                            .filter((edge: any) => edge.from === currentSkill.id)
                            .map((edge: any) => edge.to);

                        const nextSkills = nodes
                            .filter((node: any) => nextSkillIds.includes(node.id))
                            .map((node: any) => node.name || node.id)
                            .slice(0, 3);

                        // Build skill context
                        courseContext = `
LEARNING PATH: "${goal}"
═══════════════════════════════════════════════════
🎯 CURRENT SKILL: "${skillName}"
═══════════════════════════════════════════════════

Skill ID: ${currentSkill.id}
Type: ${skillType}
Level: ${level}
Estimated Time: ${estimatedMinutes} minutes
XP Reward: ${xpReward} points
${description ? `\nDescription: ${description}\n` : ''}

🎓 TEACHING RULES:
1. ONLY teach "${skillName}" - this skill and nothing else
2. DO NOT teach prerequisites: ${prerequisites.length > 0 ? prerequisites.join(', ') : 'none'}
3. DO NOT preview future skills: ${nextSkills.length > 0 ? nextSkills.join(', ') : 'none'}

📝 QUIZ REQUIREMENTS:
- Test ONLY "${skillName}" concepts
- Match ${level} difficulty level
- Must be based on what you taught about THIS skill

💪 CHALLENGE REQUIREMENTS:
- Hands-on task for "${skillName}" only
- Difficulty: ${level}
- Time: ~${Math.round(estimatedMinutes / 3)} minutes
- Practical and achievable

${prerequisites.length > 0 ? `✅ Prerequisites completed: ${prerequisites.join(', ')}` : '✅ No prerequisites - start from basics'}
${nextSkills.length > 0 ? `⏭️ Next skills: ${nextSkills.join(', ')}` : '🎉 Final skill!'}

CRITICAL: Stay 100% focused on "${skillName}". Every explanation, quiz, and challenge must relate ONLY to this skill.
═══════════════════════════════════════════════════`;
                    } else {
                        courseContext = `
LEARNING PATH: "${goal}"
🎯 PRIMARY TOPIC: "${goal}"
═══════════════════════════════════════════════════
You are a world-class expert and dedicated tutor for "${goal}". 
Your expertise is focused exclusively on this field.
═══════════════════════════════════════════════════`;
                        currentTopic = goal;
                    }
                }
            } catch (error) {
                console.error('Skill graph error:', error);
            }
        }

        // ============================================
        // ANALYSIS PIPELINE
        // ============================================

        console.log('[AI_DEBUG] Topic:', currentTopic, 'Stage:', learningStage);

        const patterns = detectBehavioralPatterns(userMessage, conversationHistory || []);

        // Create a separate service client for persistence to avoid stream conflicts
        const persistenceClient = await createServerSupabaseClient();

        // Save learner's message to database
        if (sessionId) {
            try {
                await persistenceClient.rpc('add_conversation_message', {
                    p_session_id: sessionId,
                    p_role: 'learner',
                    p_content: userMessage,
                    p_message_type: 'question', // Default for learner
                    p_metadata: { stage: learningStage }
                });
            } catch (err: any) {
                console.error('[DB_ERROR] Failed to save learner message:', err);
            }
        }

        // Run AI analysis in parallel with decision-making prep
        const aiAnalysis = await analyzeUnderstanding(
            userMessage,
            conversationHistory || [],
            currentTopic
        );

        const decision = await makeSmartDecision(
            userMessage,
            aiAnalysis,
            patterns,
            {
                currentStage: learningStage || 'EXPLAIN',
                exchangeCount: patterns.exchangeCount,
                lastQuizScore: lastQuizScore || 0,
                turnCount: turnCount || conversationHistory?.length || 0  // Use frontend turn count
            }
        );

        console.log('[AI_DEBUG] Decision:', decision.action, 'Confidence:', decision.confidence);

        const analysisTime = Date.now() - startTime;

        // ============================================
        // DETERMINE STAGE
        // ============================================

        let effectiveStage = learningStage || 'EXPLAIN';

        // Use turnCount from frontend (much more reliable than patterns.exchangeCount)
        const actualTurnCount = turnCount || conversationHistory?.length || 0;

        console.log('[STAGE_DEBUG] actualTurnCount:', actualTurnCount, 'decision.action:', decision.action);

        // Simple logic: Decision from makeSmartDecision takes priority
        if (decision.forcedStage) {
            effectiveStage = decision.forcedStage;
        } else if (decision.action === 'send_challenge') {
            effectiveStage = 'CHALLENGE';
        } else if (decision.action === 'send_quiz') {
            effectiveStage = 'QUIZ';
        } else if (decision.action === 'continue_explaining') {
            effectiveStage = 'EXPLAIN';
        }

        // Fallback only if no decision made (rare)
        if (!effectiveStage) {
            effectiveStage = 'EXPLAIN';
        }

        console.log('[AI_DEBUG] Effective Stage:', effectiveStage);

        // ============================================
        // BUILD SYSTEM PROMPT
        // ============================================

        let systemPrompt = '';

        if (effectiveStage === 'GOALS') {
            systemPrompt = `You are Genie, a world-class subject matter expert in "${currentTopic}".

${courseContext}

MISSION: 
1. Think hard and draft 3-4 comprehensive, accurate learning goals for "${currentTopic}". 
2. Ensure they are up-to-date and not overwhelming.
3. State them clearly to the student as a roadmap.
4. After stating them, tell the student you're sending a practical challenge to start.

STRICT DOMAIN: Only talk about "${currentTopic}". Stay strictly within this field.

FORMAT:
Clear, encouraging intro, then:
**Learning Goals:**
1. [Goal 1]
2. [Goal 2]
3. [Goal 3]

Then a transition sentence about the upcoming challenge.`;

        } else if (effectiveStage === 'QUIZ') {
            systemPrompt = `You are Genie, an expert AI tutor. 

${courseContext}

YOUR MISSION:
1. Deliver a pulse-check quiz for THIS SKILL ONLY: "${currentTopic}".
2. DO NOT ask about yourself (Genie), AI, or general personality.
3. Every question must be educational and based on the course content.

INSTRUCTIONS:
- Say: "${decision.transition}"
- Provide a multiple-choice quiz (A-D) testing "${currentTopic}".
- Format: Transition phrase, then a new line with [QUIZ] followed by valid JSON.

JSON Schema:
{"question": "string", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "A|B|C|D", "explanation": "string"}

CRITICAL FORMATTING RULE: 
Immediately after [QUIZ], you must output the JSON object. 
Example:
[QUIZ]
{"question": "...", ...}

CRITICAL: If the learner just answered a quiz, provide a NEW question or move to a more advanced concept within the same skill.`;

        } else if (effectiveStage === 'CHALLENGE') {
            systemPrompt = `You are Genie, a friendly tutor helping a beginner learn "${currentTopic}".

${courseContext}

YOUR MISSION:
1. Give a SHORT, encouraging message (1-2 sentences max).
2. Present ONE simple, beginner-friendly challenge that DIRECTLY tests "${currentTopic}".

CRITICAL REQUIREMENTS:
- The challenge MUST be about "${currentTopic}" specifically
- The title MUST include "${currentTopic}" or a key concept from it
- The description MUST ask the learner to DO something related to "${currentTopic}"
- Keep it achievable in 2-5 minutes
- Be SPECIFIC, not vague

FORMAT:
Write a brief intro, then output [CHALLENGE] followed by this JSON:
{"title": "Skill-specific title that mentions ${currentTopic}", "description": "Clear task directly related to ${currentTopic}", "hint": "Helpful tip", "expectedOutcome": "What success looks like", "difficulty": "beginner"}

GOOD EXAMPLE for "Python Variables":
"Ready to practice Python Variables? Try this challenge! 🎯

[CHALLENGE]
{"title": "Create Your First Python Variable", "description": "1. Open a Python file or terminal\\n2. Create a variable called 'greeting' and assign it the value 'Hello World'\\n3. Print the variable using print(greeting)", "hint": "Variables are created with: variable_name = value", "expectedOutcome": "You should see 'Hello World' printed", "difficulty": "beginner"}"

BAD EXAMPLE (too generic):
{"title": "Apply Your Knowledge", "description": "Practice what you learned"} <- DON'T DO THIS!

The challenge title and description must clearly reference "${currentTopic}".`;

        } else {
            // EXPLAIN stage - Aggressively transition to Quiz
            const isPostChallenge = userMessage.toLowerCase().includes('goals') || userMessage.toLowerCase().includes('success');

            systemPrompt = `You are Genie, a world-class subject matter expert in "${currentTopic}". 

${courseContext}

IMPORTANT:
- Focus: "${currentTopic}".
- ROLE: You are the ultimate authority on this subject. Use your expertise to guide the learner through advanced concepts.
- SCOPE: Stay strictly within the field of "${currentTopic}". 
- Aggressive Interactivity: Every 1-2 turns, you MUST use [QUIZ] or [CHALLENGE] to test comprehension.

${isPostChallenge ? `MISSION: The student just finished their initial challenge. Clearly state the 3 main Learning Goals for mastering "${currentTopic}". Once goals are stated, immediately follow up with a quiz question to begin the learning loop.` : `GOAL: Teach "${currentTopic}" with high-impact interaction.`}

RULES:
- Focus 100% on the subject of "${currentTopic}".
- Be concise (2-4 sentences).
- If the student shows even slight understanding, transition to [QUIZ] or [CHALLENGE] immediately.
- Use 1-2 emojis max.

STUDENT STATE:
- Turns: ${patterns.exchangeCount}
- Readiness: ${decision.readinessScore || 'N/A'}/100

RECENT CONVERSATION:
${conversationHistory && conversationHistory.length > 0 ? conversationHistory.slice(-3).map((msg: any) => `${msg.role}: ${msg.content.substring(0, 150)}`).join('\n') : 'New conversation'}

STUDENT: "${userMessage}"

GENIE:`;
        }

        console.log('[AI_DEBUG] System Prompt Preview:', systemPrompt.substring(0, 300) + '...');

        // ============================================
        // STREAM RESPONSE
        // ============================================

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

                    const genieResponse = result.text || "Let's keep learning!";

                    // Handle quiz
                    if (genieResponse.includes('[QUIZ]')) {
                        const parts = genieResponse.split('[QUIZ]');
                        const intro = parts[0] ? parts[0].trim() : '';
                        const quizPart = parts[1] ? parts[1].trim() : '';

                        if (intro) {
                            await streamText(intro, controller, encoder);
                        }

                        try {
                            let cleanQuizPart = quizPart.trim();
                            // Attempt to find JSON object if there's surrounding text
                            const jsonStartIndex = cleanQuizPart.indexOf('{');
                            const jsonEndIndex = cleanQuizPart.lastIndexOf('}');

                            if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                                cleanQuizPart = cleanQuizPart.substring(jsonStartIndex, jsonEndIndex + 1);
                                const quizData = JSON.parse(cleanQuizPart);
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'quiz', quizData })}\n\n`));
                            } else {
                                throw new Error('No JSON braces found in response');
                            }
                        } catch (e) {
                            console.error('Quiz parse error:', e);
                            console.error('Failed content:', quizPart);
                            // Fallback: Stream as text so user at least sees the question
                            await streamText(quizPart || "Let me ask you a question...", controller, encoder);
                        }
                    }
                    // Handle challenge
                    else if (genieResponse.includes('[CHALLENGE]')) {
                        const parts = genieResponse.split('[CHALLENGE]');
                        const intro = parts[0] ? parts[0].trim() : '';
                        const challengePart = parts[1] ? parts[1].trim() : '';

                        if (intro) {
                            await streamText(intro, controller, encoder);
                        }

                        try {
                            const challengeData = JSON.parse(challengePart);
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'challenge_trigger', challengeData })}\n\n`));
                        } catch (e) {
                            console.error('Challenge parse error:', e);
                        }
                    }
                    // Handle GOALS generation
                    else if (genieResponse.includes('[GOALS]')) {
                        const parts = genieResponse.split('[GOALS]');
                        const intro = parts[0] ? parts[0].trim() : '';
                        const goalsPart = parts[1] ? parts[1].trim() : '';

                        if (intro) {
                            await streamText(intro, controller, encoder);
                        }

                        try {
                            const goalsList = JSON.parse(goalsPart);
                            // Persist goals to Supabase immediately (Transactional)
                            if (Array.isArray(goalsList) && sessionId) {
                                // Correct usage of Supabase server client
                                const supabase = await createSupabaseServerClient();

                                // Fetch current context first to preserve other fields
                                const { data: currentSession } = await supabase
                                    .from('interactive_course_sessions')
                                    .select('learning_context')
                                    .eq('id', sessionId)
                                    .single();

                                if (currentSession) {
                                    const newGoals = goalsList.map((text, idx) => ({
                                        id: `goal-${Date.now()}-${idx}`,
                                        text,
                                        status: 'pending',
                                        timestamp: new Date().toISOString()
                                    }));

                                    const updatedContext = {
                                        ...currentSession.learning_context,
                                        goals: newGoals
                                    };

                                    await supabase
                                        .from('interactive_course_sessions')
                                        .update({ learning_context: updatedContext })
                                        .eq('id', sessionId);

                                    // Stream special event to frontend to trigger UI update
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'goals_updated', goals: newGoals })}\n\n`));
                                }
                            }
                        } catch (e) {
                            console.error('Goals parse/save error:', e);
                        }
                    }
                    // Regular text
                    else {
                        await streamText(genieResponse, controller, encoder);
                    }

                    // Save Genie's response to database
                    if (sessionId) {
                        try {
                            await persistenceClient.rpc('add_conversation_message', {
                                p_session_id: sessionId,
                                p_role: 'genie',
                                p_content: genieResponse,
                                p_message_type: effectiveStage.toLowerCase().includes('quiz') ? 'assessment'
                                    : effectiveStage.toLowerCase().includes('challenge') ? 'challenge'
                                        : 'explanation',
                                p_metadata: {
                                    stage: effectiveStage,
                                    readinessScore: decision.readinessScore || 0,
                                    action: decision.action
                                }
                            });

                            // Implementation of Context Summarization (every 10 messages)
                            const currentTurns = (conversationHistory?.length || 0) + 2;
                            if (currentTurns % 10 === 0) {
                                console.log('[AI_DEBUG] Triggering Context Summarization. Turns:', currentTurns);

                                const summaryResult = await generateWithRetry({
                                    prompt: "Summarize our progress so far in 2-3 sentences. Focus on what we learned and what's next.",
                                    systemPrompt: `You are Genie's memory processor. Analyze this history: ${JSON.stringify(conversationHistory)}`,
                                    temperature: 0.3,
                                    maxTokens: 150
                                });

                                if (summaryResult.text) {
                                    await persistenceClient.rpc('add_conversation_message', {
                                        p_session_id: sessionId,
                                        p_role: 'genie',
                                        p_content: `[SUMMARY] ${summaryResult.text}`,
                                        p_message_type: 'summary',
                                        p_metadata: { turnsAtSummary: currentTurns }
                                    });
                                }
                            }
                        } catch (err: any) {
                            console.error('[DB_ERROR] Failed during persistence/summarization:', err);
                        }
                    }

                    const totalTime = Date.now() - startTime;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'complete',
                        content: genieResponse,
                        metadata: {
                            analysisTime,
                            totalTime,
                            readinessScore: decision.readinessScore || 0,
                            action: decision.action
                        }
                    })}\n\n`));

                    controller.close();
                } catch (error) {
                    console.error('Stream error:', error);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'error',
                        message: 'Response failed'
                    })}\n\n`));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return new Response(
            JSON.stringify({
                error: error.message || 'Internal error',
                timestamp: new Date().toISOString()
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}