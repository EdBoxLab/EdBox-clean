import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';

// ============================================
// TYPES
// ============================================
interface SkillNode {
    id: string;
    name: string;
    type: string;
    engine?: string;
    xpReward?: number;
    estimatedMinutes?: number;
    description?: string;
    resources?: string[];
    level?: string;
}

interface SkillEdge {
    to: string;
    from: string;
}

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
    let score = 50;

    if (patterns.showsUnderstanding) score += 30;
    if (patterns.showsConfusion) score -= 30;
    if (patterns.isEngaged) score += 10;
    if (patterns.askingDeeperQuestion) score += 10;
    if (patterns.exchangeCount >= 2 && patterns.exchangeCount <= 5) score += 20;
    if (patterns.exchangeCount < 2) score -= 20;

    return Math.max(0, Math.min(100, score));
}

// ============================================
// AI UNDERSTANDING ANALYZER
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

        const text = result.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
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
// SMART DECISION ENGINE
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
            naturalTransition: "Excellent! Now let's apply this..."
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
            reasoning: 'High readiness score',
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

    const comprehensionMap = { high: 30, medium: 15, low: 5, confused: 0 };
    score += comprehensionMap[analysis.comprehensionLevel] || 0;
    
    if (patterns.showsUnderstanding) score += 25;
    if (patterns.showsConfusion) score -= 25;
    if (analysis.isParaphrasing) score += 10;
    if (patterns.isEngaged) score += 10;
    if (patterns.exchangeCount >= 2 && patterns.exchangeCount <= 5) score += 15;
    else if (patterns.exchangeCount > 5) score += 10;
    
    score += Math.round(analysis.confidence * 10);

    return Math.max(0, Math.min(100, score));
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
            currentSkillId, // ID of current skill node (e.g., "react_basics", "javascript_basics")
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

        // Get skill graph context
        const { data: { session: authSession } } = await supabase.auth.getSession();
        let courseContext = '';
        let currentTopic = 'the current concept';
        let skillContext = '';

        if (authSession && courseId) {
            const { data: skillGraph, error } = await supabase
                .from('skill_graphs')
                .select('goal, nodes, edges')
                .eq('id', courseId)
                .eq('user_id', authSession.user.id)
                .single();

            if (skillGraph && !error) {
                const goal = skillGraph.goal || 'Unknown Goal';
                const nodes: SkillNode[] = Array.isArray(skillGraph.nodes) ? skillGraph.nodes : [];
                const edges: SkillEdge[] = Array.isArray(skillGraph.edges) ? skillGraph.edges : [];
                
                // Find current skill node by ID
                let currentSkill = nodes.find(node => node.id === currentSkillId);
                
                // Fallback: extract from chatSummary or use first node
                if (!currentSkill) {
                    if (chatSummary) {
                        const skillMatch = chatSummary.match(/skill[:\s]+([^\s,}]+)/i);
                        if (skillMatch) {
                            currentSkill = nodes.find(n => n.id === skillMatch[1]);
                        }
                    }
                    
                    if (!currentSkill && nodes.length > 0) {
                        currentSkill = nodes[0];
                        console.warn('⚠️ No skillId provided, using first node:', currentSkill.id);
                    }
                }
                
                if (currentSkill) {
                    const skillName = currentSkill.name || currentSkill.id;
                    const skillType = currentSkill.type || 'skill';
                    const engine = currentSkill.engine || 'codestudio';
                    const xpReward = currentSkill.xpReward || 0;
                    const estimatedMinutes = currentSkill.estimatedMinutes || 30;
                    const description = currentSkill.description || '';
                    const resources = currentSkill.resources || [];
                    const level = currentSkill.level || 'intermediate';
                    
                    currentTopic = skillName;
                    
                    // Find prerequisites (edges pointing TO current skill)
                    const prerequisiteIds = edges
                        .filter(edge => edge.to === currentSkill.id)
                        .map(edge => edge.from);
                    
                    const prerequisites = nodes
                        .filter(node => prerequisiteIds.includes(node.id))
                        .map(node => node.name || node.id)
                        .slice(0, 3);
                    
                    // Find next skills (edges pointing FROM current skill)
                    const nextSkillIds = edges
                        .filter(edge => edge.from === currentSkill.id)
                        .map(edge => edge.to);
                    
                    const nextSkills = nodes
                        .filter(node => nextSkillIds.includes(node.id))
                        .map(node => node.name || node.id)
                        .slice(0, 3);
                    
                    // Build comprehensive skill context
                    skillContext = `
═══════════════════════════════════════════════════
🎯 CURRENT SKILL: "${skillName}"
═══════════════════════════════════════════════════

Skill ID: ${currentSkill.id}
Type: ${skillType}
Learning Engine: ${engine}
Level: ${level}
Estimated Time: ${estimatedMinutes} minutes
XP Reward: ${xpReward} points
${description ? `\nSkill Description:\n${description}\n` : ''}
${resources.length > 0 ? `\nLearning Resources:\n${resources.slice(0, 3).map((r: string) => `- ${r}`).join('\n')}\n` : ''}

🎓 TEACHING MANDATE:
1. ONLY teach "${skillName}" - stay 100% focused on this skill
2. Your explanations must cover EXACTLY what's needed for "${skillName}"
3. DO NOT teach prerequisites: ${prerequisites.length > 0 ? prerequisites.join(', ') : 'none - start from basics'}
4. DO NOT preview future content: ${nextSkills.length > 0 ? nextSkills.join(', ') : 'none - this is the final skill'}

📝 QUIZ REQUIREMENTS:
- Questions must test ONLY "${skillName}" concepts
- Difficulty: ${level}
- Must be answerable based on what you've taught about "${skillName}"
- No questions about ${prerequisites.length > 0 ? prerequisites.join(' or ') : 'prerequisites'}

💪 CHALLENGE REQUIREMENTS:
- Hands-on task that applies "${skillName}" skills
- Appropriate for ${level} level
- Should take ~${Math.round(estimatedMinutes / 3)} minutes
- Must be practical and achievable
- Focus on ${engine} environment if coding-related

${prerequisites.length > 0 ? `✅ Student has completed: ${prerequisites.join(', ')}` : '✅ This is a foundational skill'}
${nextSkills.length > 0 ? `⏭️  After this, student learns: ${nextSkills.join(', ')}` : '🎉 This is the final skill!'}

CRITICAL: Stay laser-focused on "${skillName}". Every explanation, quiz, and challenge must directly relate to this skill.
═══════════════════════════════════════════════════`;

                    courseContext = `LEARNING PATH: "${goal}"\n${skillContext}`;
                    
                } else {
                    console.error('❌ No skill node found');
                    courseContext = `LEARNING PATH: "${goal}"\nTeaching course content.`;
                    currentTopic = goal;
                }
            } else {
                console.error('❌ Skill graph fetch error:', error);
            }
        }

        // ============================================
        // INTELLIGENT ANALYSIS PIPELINE
        // ============================================
        
        const patterns = detectBehavioralPatterns(userMessage, conversationHistory || []);
        
        const [understanding, simpleReadiness] = await Promise.all([
            analyzeUnderstanding(userMessage, conversationHistory || [], currentTopic, patterns),
            Promise.resolve(calculateSimpleReadiness(patterns))
        ]);

        const readinessScore = calculateReadinessScore(understanding, patterns);

        const decision = await makeSmartDecision(userMessage, understanding, patterns, {
            currentStage: learningStage || 'EXPLAIN',
            exchangeCount: patterns.exchangeCount,
            lastQuizScore
        });

        const analysisTime = Date.now() - startTime;
        
        console.log('🧠 Genie Analysis:', {
            skill: currentTopic,
            comprehension: understanding.comprehensionLevel,
            readinessScore,
            action: decision.action,
            confidence: Math.round(decision.confidence * 100) + '%',
            analysisTime: analysisTime + 'ms'
        });

        // ============================================
        // DETERMINE EFFECTIVE STAGE
        // ============================================
        
        let effectiveStage = learningStage || 'EXPLAIN';
        
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
2. Then provide a multiple-choice quiz ON THIS EXACT SKILL
3. Format: Transition, then [QUIZ] with JSON

JSON: {"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": "A", "explanation": "..."}

CRITICAL: Question must ONLY test the current skill. No other topics.`;

        } else if (effectiveStage === 'CHALLENGE') {
            systemPrompt = `You are Genie. The learner passed - time for hands-on practice!

${courseContext}

YOUR TASK:
1. Brief praise (1 sentence)
2. Introduce practical challenge FOR THIS SKILL ONLY
3. Format: Praise, then [CHALLENGE] with JSON

JSON: {"description": "Clear task instructions for THIS skill", "challengeId": "challenge_${Date.now()}"}

Make it practical and focused on the current skill.`;

        } else {
            const actionGuidance = {
                'provide_example': '- Give a clear, concrete example of THIS skill',
                'ask_clarifying_question': '- Ask about understanding of THIS skill',
                'continue_explaining': '- Continue teaching THIS skill clearly',
            }[decision.action] || '- Teach THIS skill clearly';

            systemPrompt = `You are Genie, a world-class AI tutor. Professional, encouraging, clear.

${courseContext}
Stage: ${effectiveStage}
Summary: ${chatSummary || 'New session'}

STUDENT STATE:
- Comprehension: ${understanding.comprehensionLevel}
- Signals: ${understanding.detectedSignals.join(', ') || 'engaged'}
${patterns.showsConfusion ? '- SHOWS CONFUSION - simplify explanation' : ''}
${patterns.askingDeeperQuestion ? '- ASKING DEEPER QUESTION - answer enthusiastically' : ''}

YOUR INSTRUCTIONS:
${actionGuidance}

RULES:
- Stay 100% focused on the CURRENT SKILL ONLY
- Be concise (2-4 sentences)
- Use 1-2 emojis max
- NEVER say "I'll quiz you" - flow naturally
- Don't mention other skills or drift off-topic

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
                            action: decision.action,
                            skillId: currentSkillId
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