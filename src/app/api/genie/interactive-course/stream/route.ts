import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
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
    // Fast decisions without AI
    if (patterns.showsConfusion) {
        return {
            action: 'continue_explaining',
            confidence: 0.9,
            transition: "Let me clarify that."
        };
    }

    if (context.currentStage === 'QUIZ_COMPLETE' && context.lastQuizScore >= 0.7) {
        return {
            action: 'send_challenge',
            confidence: 0.95,
            transition: "Great work! Now let's apply this..."
        };
    }

    if (patterns.exchangeCount < 2) {
        return {
            action: 'continue_explaining',
            confidence: 0.85,
            transition: "Let me explain further."
        };
    }

    // Calculate readiness score
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

    // Decide action
    if (readinessScore >= 70 && patterns.exchangeCount >= 2 && !patterns.showsConfusion) {
        return {
            action: 'send_quiz',
            confidence: 0.85,
            transition: "Let's test your understanding! 🎯",
            readinessScore
        };
    }

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
            learningStage,
            conversationHistory,
            chatSummary,
            lastQuizScore
        } = body;

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
        
        let courseContext = '';
        let currentTopic = 'the current concept';

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
                    
                    // Find current skill node
                    let currentSkill = currentSkillId ? nodes.find((node: any) => node.id === currentSkillId) : null;
                    
                    // Fallback to first node
                    if (!currentSkill && nodes.length > 0) {
                        currentSkill = nodes[0];
                    }
                    
                    if (currentSkill) {
                        const skillName = currentSkill.name || currentSkill.id || 'Current Skill';
                        const skillType = currentSkill.type || 'skill';
                        const xpReward = currentSkill.xpReward || 0;
                        const estimatedMinutes = currentSkill.estimatedMinutes || 30;
                        const description = currentSkill.description || '';
                        const level = currentSkill.level || 'intermediate';
                        
                        currentTopic = skillName;
                        
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
                        courseContext = `LEARNING PATH: "${goal}"\nTeaching course content.`;
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
        
        const patterns = detectBehavioralPatterns(userMessage, conversationHistory || []);
        
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
                lastQuizScore: lastQuizScore || 0
            }
        );

        const analysisTime = Date.now() - startTime;

        // ============================================
        // DETERMINE STAGE
        // ============================================
        
        let effectiveStage = learningStage || 'EXPLAIN';
        
        if (decision.action === 'send_quiz' && decision.confidence > 0.65) {
            effectiveStage = 'QUIZ';
        } else if (decision.action === 'send_challenge' && decision.confidence > 0.7) {
            effectiveStage = 'CHALLENGE';
        }

        // ============================================
        // BUILD SYSTEM PROMPT
        // ============================================
        
        let systemPrompt = '';
        
        if (effectiveStage === 'QUIZ') {
            systemPrompt = `You are Genie, an expert AI tutor. The learner is ready for assessment.

${courseContext}

YOUR TASK:
1. Say: "${decision.transition}"
2. Provide a multiple-choice quiz testing THIS SKILL ONLY
3. Format: Transition phrase, then new line with [QUIZ] followed by valid JSON

JSON Format:
{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "A", "explanation": "..."}

CRITICAL: Question must test ONLY the current skill. No other topics.`;

        } else if (effectiveStage === 'CHALLENGE') {
            systemPrompt = `You are Genie. The learner passed the quiz!

${courseContext}

YOUR TASK:
1. Brief praise (1 sentence)
2. Give a practical hands-on challenge for THIS SKILL ONLY
3. Format: Praise, then [CHALLENGE] with valid JSON

JSON Format:
{"description": "Clear instructions for hands-on task", "challengeId": "challenge_${Date.now()}"}

Challenge must be practical, achievable, and focused ONLY on the current skill.`;

        } else {
            // EXPLAIN stage
            systemPrompt = `You are Genie, a world-class AI tutor. Professional, encouraging, and clear.

${courseContext}

STUDENT STATE:
- Shows understanding: ${patterns.showsUnderstanding ? 'Yes' : 'No'}
- Shows confusion: ${patterns.showsConfusion ? 'Yes' : 'No'}
- Engagement: ${patterns.isEngaged ? 'High' : 'Low'}
- Exchange count: ${patterns.exchangeCount}
${aiAnalysis ? `- AI Analysis: ${aiAnalysis.comprehensionLevel} comprehension (${Math.round(aiAnalysis.confidence * 100)}% confident)` : ''}

YOUR INSTRUCTIONS:
${patterns.showsConfusion ? '- Student is confused - explain more simply' : '- Continue teaching clearly'}
${patterns.exchangeCount < 2 ? '- Early in conversation - build foundation' : '- Building on previous explanations'}

RULES:
- Focus 100% on CURRENT SKILL ONLY
- Be concise (2-4 sentences)
- Use 1-2 emojis max, sparingly
- NEVER say "I'll quiz you next" - let conversation flow naturally
- Don't drift to other topics

RECENT CONVERSATION:
${conversationHistory && conversationHistory.length > 0 ? conversationHistory.slice(-3).map((msg: any) => `${msg.role}: ${msg.content.substring(0, 150)}`).join('\n') : 'New conversation'}

STUDENT: "${userMessage}"

GENIE:`;
        }

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
                            const quizData = JSON.parse(quizPart);
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'quiz', quizData })}\n\n`));
                        } catch (e) {
                            console.error('Quiz parse error:', e);
                            await streamText("Let me ask you about this...", controller, encoder);
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
                    // Regular text
                    else {
                        await streamText(genieResponse, controller, encoder);
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