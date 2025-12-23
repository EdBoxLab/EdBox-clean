import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';

// ============================================
// TYPES
// ============================================
interface UnderstandingAnalysis {
    comprehensionLevel: 'high' | 'medium' | 'low' | 'confused';
    confidence: number;
    isParaphrasing: boolean;
    showsEngagement: boolean;
    askingDeeperQuestions: boolean;
    showsConfusion: boolean;
    readyForQuiz: boolean;
    readyForChallenge: boolean;
    needsMoreExplanation: boolean;
    detectedSignals: string[];
    reasoning: string;
}

interface DecisionResult {
    action: 'continue_explaining' | 'send_quiz' | 'send_challenge' | 'ask_clarifying_question' | 'provide_example';
    confidence: number;
    reasoning: string;
    naturalTransition: string;
}

interface BehavioralPatterns {
    showsUnderstanding: boolean;
    showsConfusion: boolean;
    askingDeeperQuestion: boolean;
    isShortResponse: boolean;
    isEngaged: boolean;
    responseLength: number;
    hasQuestion: boolean;
    exchangeCount: number;
}

// ============================================
// BEHAVIORAL PATTERN DETECTION (Fast, No AI)
// ============================================
function detectBehavioralPatterns(userMessage: string, conversationHistory: any[]): BehavioralPatterns {
    const explicitUnderstanding = [
        'i understand', 'got it', 'makes sense', 'i see', 'clear now',
        'i get it', 'okay', 'alright', 'cool', 'thanks', 'that helps',
        "i'm ready", "let's do this", 'quiz me', 'test me', 'i think i got it',
        'that makes sense', 'oh i see', 'now i understand', 'perfect'
    ];

    const explicitConfusion = [
        'confused', "don't get", "don't understand", 'what?', 'huh?',
        'lost', 'not sure', 'unclear', 'wait', 'how does', 'what does',
        'can you explain', "i'm lost", 'still confused', 'what do you mean',
        'i dont get', 'help', 'stuck'
    ];

    const deeperQuestions = [
        'why', 'how come', 'what if', 'but what about',
        'does this mean', 'so basically', 'in other words', 'what about'
    ];

    const msg = userMessage.toLowerCase();
    
    return {
        showsUnderstanding: explicitUnderstanding.some(phrase => msg.includes(phrase)),
        showsConfusion: explicitConfusion.some(phrase => msg.includes(phrase)),
        askingDeeperQuestion: deeperQuestions.some(phrase => msg.includes(phrase)) && msg.includes('?'),
        isShortResponse: userMessage.split(' ').length < 5,
        isEngaged: userMessage.split(' ').length > 8 || msg.includes('?'),
        responseLength: userMessage.split(' ').length,
        hasQuestion: msg.includes('?'),
        exchangeCount: conversationHistory.filter(m => m.role === 'assistant').length
    };
}

// ============================================
// SIMPLE READINESS CALCULATOR (Fallback)
// ============================================
function calculateSimpleReadiness(patterns: BehavioralPatterns): number {
    let score = 50; // Start neutral

    if (patterns.showsUnderstanding) score += 30;
    if (patterns.showsConfusion) score -= 30;
    if (patterns.isEngaged) score += 10;
    if (patterns.askingDeeperQuestion) score += 10;
    if (patterns.exchangeCount >= 2 && patterns.exchangeCount <= 5) score += 20;
    if (patterns.exchangeCount < 2) score -= 20;

    return Math.max(0, Math.min(100, score));
}

// ============================================
// AI UNDERSTANDING ANALYZER (With Fallback)
// ============================================
async function analyzeUnderstanding(
    userMessage: string, 
    conversationHistory: any[], 
    currentTopic: string,
    patterns: BehavioralPatterns
): Promise<UnderstandingAnalysis> {
    const analysisPrompt = `Analyze student comprehension. Return ONLY valid JSON, no markdown.

TOPIC: ${currentTopic}
STUDENT MESSAGE: "${userMessage}"
CONTEXT: ${conversationHistory.slice(-2).map(m => `${m.role}: ${m.content.substring(0, 100)}`).join(' | ')}

Return JSON:
{
  "comprehensionLevel": "high"|"medium"|"low"|"confused",
  "confidence": 0.0-1.0,
  "isParaphrasing": boolean,
  "showsEngagement": boolean,
  "askingDeeperQuestions": boolean,
  "showsConfusion": boolean,
  "readyForQuiz": boolean,
  "readyForChallenge": boolean,
  "needsMoreExplanation": boolean,
  "detectedSignals": ["signal1"],
  "reasoning": "brief reason"
}`;

    try {
        const result = await Promise.race([
            generateWithRetry({
                prompt: analysisPrompt,
                systemPrompt: 'Return only valid JSON, no explanation.',
                temperature: 0.2,
                maxTokens: 250,
            }),
            new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error('Analysis timeout')), 3000)
            )
        ]);

        // Extract JSON from response
        const text = result.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            // Validate required fields
            if (parsed.comprehensionLevel && typeof parsed.confidence === 'number') {
                return parsed as UnderstandingAnalysis;
            }
        }
        
        throw new Error('Invalid JSON structure');
    } catch (error) {
        console.warn('AI analysis failed, using fallback:', error);
        return getFallbackAnalysis(patterns);
    }
}

function getFallbackAnalysis(patterns: BehavioralPatterns): UnderstandingAnalysis {
    let level: 'high' | 'medium' | 'low' | 'confused' = 'medium';
    
    if (patterns.showsConfusion) level = 'confused';
    else if (patterns.showsUnderstanding && patterns.isEngaged) level = 'high';
    else if (patterns.showsUnderstanding) level = 'medium';
    else if (patterns.exchangeCount < 2) level = 'low';

    return {
        comprehensionLevel: level,
        confidence: 0.7,
        isParaphrasing: patterns.responseLength > 10 && !patterns.hasQuestion,
        showsEngagement: patterns.isEngaged,
        askingDeeperQuestions: patterns.askingDeeperQuestion,
        showsConfusion: patterns.showsConfusion,
        readyForQuiz: patterns.showsUnderstanding && patterns.exchangeCount >= 2,
        readyForChallenge: false,
        needsMoreExplanation: patterns.showsConfusion || patterns.exchangeCount < 2,
        detectedSignals: [
            ...(patterns.showsUnderstanding ? ['understanding'] : []),
            ...(patterns.showsConfusion ? ['confusion'] : []),
            ...(patterns.isEngaged ? ['engaged'] : [])
        ],
        reasoning: 'Fallback keyword-based analysis'
    };
}

// ============================================
// SMART DECISION ENGINE (With Fallback)
// ============================================
async function makeSmartDecision(
    userMessage: string,
    analysis: UnderstandingAnalysis,
    patterns: BehavioralPatterns,
    context: {
        currentStage: string;
        exchangeCount: number;
        lastQuizScore?: number;
    }
): Promise<DecisionResult> {
    // Fast decision for obvious cases (no AI needed)
    if (patterns.showsConfusion || analysis.comprehensionLevel === 'confused') {
        return {
            action: 'continue_explaining',
            confidence: 0.9,
            reasoning: 'Student shows confusion',
            naturalTransition: "Let me clarify that for you."
        };
    }

    if (context.currentStage === 'QUIZ_COMPLETE' && context.lastQuizScore && context.lastQuizScore >= 0.7) {
        return {
            action: 'send_challenge',
            confidence: 0.95,
            reasoning: 'Quiz passed successfully',
            naturalTransition: "Great work! Now let's apply this knowledge..."
        };
    }

    if (patterns.exchangeCount < 2) {
        return {
            action: 'continue_explaining',
            confidence: 0.85,
            reasoning: 'Too early for assessment',
            naturalTransition: "Let me explain this further."
        };
    }

    const decisionPrompt = `Decide next teaching action. Return ONLY JSON.

CONTEXT:
- Stage: ${context.currentStage}
- Exchanges: ${context.exchangeCount}
- Student: "${userMessage}"
- Comprehension: ${analysis.comprehensionLevel}
- Signals: ${analysis.detectedSignals.join(', ')}

ACTIONS: "continue_explaining", "send_quiz", "send_challenge", "ask_clarifying_question", "provide_example"

RULES:
- send_quiz ONLY if comprehension high/medium AND 2+ exchanges
- send_challenge ONLY if quiz passed
- continue_explaining if confused OR <2 exchanges

JSON:
{
  "action": "...",
  "confidence": 0.0-1.0,
  "reasoning": "why",
  "naturalTransition": "what to say"
}`;

    try {
        const result = await Promise.race([
            generateWithRetry({
                prompt: decisionPrompt,
                systemPrompt: 'Return only valid JSON.',
                temperature: 0.3,
                maxTokens: 150,
            }),
            new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error('Decision timeout')), 2500)
            )
        ]);

        const text = result.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.action && typeof parsed.confidence === 'number') {
                return parsed as DecisionResult;
            }
        }
        
        throw new Error('Invalid decision JSON');
    } catch (error) {
        console.warn('Decision AI failed, using fallback:', error);
        return getFallbackDecision(analysis, patterns, context);
    }
}

function getFallbackDecision(
    analysis: UnderstandingAnalysis,
    patterns: BehavioralPatterns,
    context: any
): DecisionResult {
    const readinessScore = calculateSimpleReadiness(patterns);

    if (readinessScore >= 70 && patterns.exchangeCount >= 2 && !patterns.showsConfusion) {
        return {
            action: 'send_quiz',
            confidence: 0.8,
            reasoning: 'High readiness score and sufficient exchanges',
            naturalTransition: "Let's test your understanding! 🎯"
        };
    }

    if (patterns.askingDeeperQuestion) {
        return {
            action: 'provide_example',
            confidence: 0.85,
            reasoning: 'Student asking deeper questions',
            naturalTransition: "Great question! Here's an example..."
        };
    }

    return {
        action: 'continue_explaining',
        confidence: 0.75,
        reasoning: 'Continue teaching',
        naturalTransition: "Let me explain this another way."
    };
}

// ============================================
// READINESS SCORE CALCULATOR
// ============================================
function calculateReadinessScore(
    analysis: UnderstandingAnalysis, 
    patterns: BehavioralPatterns
): number {
    let score = 0;

    // AI comprehension (30 points)
    const comprehensionMap = { high: 30, medium: 15, low: 5, confused: 0 };
    score += comprehensionMap[analysis.comprehensionLevel] || 0;
    
    // Explicit signals (25 points)
    if (patterns.showsUnderstanding) score += 25;
    if (patterns.showsConfusion) score -= 25;

    // Engagement (20 points)
    if (analysis.isParaphrasing) score += 10;
    if (patterns.isEngaged) score += 10;

    // Exchange threshold (15 points)
    if (patterns.exchangeCount >= 2 && patterns.exchangeCount <= 5) score += 15;
    else if (patterns.exchangeCount > 5) score += 10;
    
    // Confidence (10 points)
    score += Math.round(analysis.confidence * 10);

    return Math.max(0, Math.min(100, score));
}

// ============================================
// HUMAN-LIKE STREAMING
// ============================================
function getHumanDelay(word: string, isStartOfSentence: boolean): number {
    const base = 35 + Math.random() * 35; // 35-70ms
    
    if (word.endsWith('.')) return base + 140;
    if (word.endsWith('!')) return base + 120;
    if (word.endsWith('?')) return base + 130;
    if (word.endsWith(',')) return base + 60;
    if (word.endsWith(':')) return base + 80;
    if (word.length > 12) return base + 35;
    if (word.length > 8) return base + 20;
    if (/[A-Z]/.test(word) && word.length > 3) return base + 25;
    if (isStartOfSentence) return base + 40;
    
    return base;
}

async function streamText(
    text: string, 
    controller: ReadableStreamDefaultController, 
    encoder: TextEncoder
): Promise<void> {
    if (!text.trim()) return;
    
    const words = text.split(' ');
    
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const isStartOfSentence = i === 0 || words[i - 1]?.match(/[.!?]$/);
        
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
        const {
            userMessage,
            sessionId,
            courseId,
            learningStage,
            conversationHistory,
            chatSummary,
            lastQuizScore
        } = await request.json();

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

        // Get course context
        const { data: { session: authSession } } = await supabase.auth.getSession();
        let courseContext = '';
        let currentTopic = 'the current concept';

        if (authSession && courseId) {
            const { data: course } = await supabase
                .from('courses')
                .select('title, description, category')
                .eq('id', courseId)
                .single();

            if (course) {
                courseContext = `Course: "${course.title}" (${course.category})`;
                currentTopic = course.title || 'the topic';
            }
        }

        // ============================================
        // INTELLIGENT ANALYSIS PIPELINE (Parallel)
        // ============================================
        
        // Step 1: Fast behavioral detection (no AI)
        const patterns = detectBehavioralPatterns(
            userMessage, 
            conversationHistory || []
        );

        // Step 2 & 3: Parallel AI calls with fallbacks
        const [understanding, simpleReadiness] = await Promise.all([
            analyzeUnderstanding(userMessage, conversationHistory || [], currentTopic, patterns),
            Promise.resolve(calculateSimpleReadiness(patterns))
        ]);

        // Step 4: Calculate comprehensive readiness
        const readinessScore = calculateReadinessScore(understanding, patterns);

        // Step 5: Smart decision
        const decision = await makeSmartDecision(userMessage, understanding, patterns, {
            currentStage: learningStage || 'EXPLAIN',
            exchangeCount: patterns.exchangeCount,
            lastQuizScore
        });

        const analysisTime = Date.now() - startTime;
        
        console.log('🧠 Genie Analysis:', {
            comprehension: understanding.comprehensionLevel,
            readinessScore,
            action: decision.action,
            confidence: Math.round(decision.confidence * 100) + '%',
            analysisTime: analysisTime + 'ms',
            fallbackUsed: understanding.reasoning.includes('Fallback')
        });

        // ============================================
        // DETERMINE EFFECTIVE STAGE
        // ============================================
        
        let effectiveStage = learningStage || 'EXPLAIN';
        
        // Override based on smart decision with high confidence
        if (decision.action === 'send_quiz' && decision.confidence > 0.65 && readinessScore >= 65) {
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
Analysis: ${understanding.reasoning}

YOUR TASK:
1. Say: "${decision.naturalTransition}"
2. Then provide a multiple-choice quiz
3. Format: Transition phrase, then new line with [QUIZ] followed by valid JSON

JSON: {"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "A", "explanation": "..."}

Keep question clear and concise. Options should test real understanding.`;

        } else if (effectiveStage === 'CHALLENGE') {
            systemPrompt = `You are Genie. The learner passed the quiz - time for hands-on practice!

${courseContext}

YOUR TASK:
1. Briefly explain why their answer was correct (1 sentence)
2. Introduce a practical coding/application challenge
3. Format: Brief praise, then [CHALLENGE] with valid JSON

JSON: {"description": "Clear task with specific instructions", "challengeId": "challenge_${Date.now()}"}

Make challenge practical and achievable.`;

        } else {
            // EXPLAIN stage
            const actionGuidance = {
                'provide_example': '- Give a clear, concrete example',
                'ask_clarifying_question': '- Ask a thoughtful question to check understanding',
                'continue_explaining': '- Continue teaching with clarity',
            }[decision.action] || '- Teach clearly and concisely';

            systemPrompt = `You are Genie, a world-class AI tutor. Professional, encouraging, clear.

${courseContext}
Stage: ${effectiveStage}
Summary: ${chatSummary || 'New session'}

STUDENT STATE:
- Comprehension: ${understanding.comprehensionLevel}
- Signals: ${understanding.detectedSignals.join(', ') || 'engaged'}
- ${patterns.showsConfusion ? 'SHOWS CONFUSION - explain simpler' : ''}
- ${patterns.askingDeeperQuestion ? 'ASKING DEEPER QUESTION - answer with enthusiasm' : ''}

YOUR INSTRUCTIONS:
${actionGuidance}

RULES:
- Be concise (2-4 sentences for explanations)
- Use 1-2 emojis max, sparingly
- NEVER say "I'll quiz you next" or "I'll check your understanding"
- Let conversation flow naturally
- If explaining, make it crystal clear

RECENT CONVERSATION:
${conversationHistory?.slice(-3).map((msg: any) => `${msg.role}: ${msg.content.substring(0, 150)}`).join('\n') || 'Starting fresh'}

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

                    const genieResponse = result.text || "Let's keep learning! What's on your mind?";

                    // Handle quiz
                    if (genieResponse.includes('[QUIZ]')) {
                        const [intro, quizPart] = genieResponse.split('[QUIZ]');
                        
                        if (intro?.trim()) {
                            await streamText(intro.trim(), controller, encoder);
                        }

                        try {
                            const quizJson = quizPart?.trim();
                            const quizData = JSON.parse(quizJson);
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'quiz', quizData })}\n\n`));
                        } catch (e) {
                            console.error('Quiz parse error:', e);
                            await streamText("Let me ask you about this...", controller, encoder);
                        }
                    }
                    // Handle challenge
                    else if (genieResponse.includes('[CHALLENGE]')) {
                        const [intro, challengePart] = genieResponse.split('[CHALLENGE]');
                        
                        if (intro?.trim()) {
                            await streamText(intro.trim(), controller, encoder);
                        }

                        try {
                            const challengeJson = challengePart?.trim();
                            const challengeData = JSON.parse(challengeJson);
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'challenge_trigger', challengeData })}\n\n`));
                        } catch (e) {
                            console.error('Challenge parse error:', e);
                        }
                    }
                    // Regular explanation
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
                            readinessScore,
                            action: decision.action
                        }
                    })}\n\n`));
                    
                    controller.close();
                } catch (error) {
                    console.error('Stream error:', error);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                        type: 'error', 
                        message: 'Response generation failed' 
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
                error: error.message || 'Internal server error',
                timestamp: new Date().toISOString()
            }), 
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}