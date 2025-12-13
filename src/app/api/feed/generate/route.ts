// app/api/learning-path/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";
import Groq from 'groq-sdk';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// ============= TYPES =============

enum LearningContext {
    HighSchool = "high_school",
    College = "college",
    JobSeeking = "job_seeking",
    BuildingProjects = "building_projects"
}

enum EngineType {
    CodeStudio = "codestudio",
    LinguaLab = "lingualab",
    ArtStudio = "artstudio",
    HistoryMach = "historymach",
    PhysicsEngine = "physicsengine",
    ChemLab = "chemlab",
    MathLab = "mathlab",
    FinLab = "finlab",
    WritingStudio = "writingstudio"
}

interface MicroSkill {
    id: string;
    name: string;
    description: string;
    engine: EngineType;
    estimatedMinutes: number;
    prerequisites: string[];
    masteryThreshold: {
        minChallenges: number;
        minConfidence: number;
        minSuccessRate: number;
    };
    challengeTypes: string[];
    xpReward: number;
}

interface SkillPath {
    id: string;
    name: string;
    description: string;
    skills: MicroSkill[];
}

interface MiniProject {
    id: string;
    name: string;
    description: string;
    unlocksAfter: string[];
    engine: EngineType;
    estimatedMinutes: number;
    xpReward: number;
    shareTemplate: string;
}

interface SkillGraph {
    id: string;
    userId: string;
    goal: string;
    context: LearningContext;
    totalSkills: number;
    estimatedHours: string;
    skillPaths: SkillPath[];
    miniProjects: MiniProject[];
    capstoneProject: MiniProject;
    createdAt: string;
}

interface LearnerState {
    id: string;
    userId: string;
    skillGraphId: string;
    skillMastery: Record<string, {
        confidence: number;
        challengesCompleted: number;
        successRate: number;
        timeSpent: number;
        lastPracticed: string | null;
        isMastered: boolean;
    }>;
    currentSkill: string | null;
    streak: number;
    totalXP: number;
    level: number;
    badges: string[];
    startedAt: string;
}

// ============= API KEY POOLS =============

const GEMINI_KEYS = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_7,
    process.env.GEMINI_API_KEY_8,
    process.env.GEMINI_API_KEY_9,
    process.env.GEMINI_API_KEY_10,
    process.env.GEMINI_API_KEY_11,
    process.env.GEMINI_API_KEY_12,
    process.env.GEMINI_API_KEY_13,
    process.env.GEMINI_API_KEY_14,
    process.env.GEMINI_API_KEY_15,
].filter(Boolean) as string[];

const GROQ_KEYS = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
    process.env.GROQ_API_KEY_6,
    process.env.GROQ_API_KEY_7,
    process.env.GROQ_API_KEY_8,
    process.env.GROQ_API_KEY_9,
    process.env.GROQ_API_KEY_10,
    process.env.GROQ_API_KEY_11,
    process.env.GROQ_API_KEY_12,
    process.env.GROQ_API_KEY_13,
    process.env.GROQ_API_KEY_14,
    process.env.GROQ_API_KEY_15,
    process.env.GROQ_API_KEY_16,
    process.env.GROQ_API_KEY_17,
    process.env.GROQ_API_KEY_18,
    process.env.GROQ_API_KEY_19,
    process.env.GROQ_API_KEY_20,
    process.env.GROQ_API_KEY_21,
    process.env.GROQ_API_KEY_22,
    process.env.GROQ_API_KEY_23,
    process.env.GROQ_API_KEY_24,
    process.env.GROQ_API_KEY_25,
    process.env.GROQ_API_KEY_26,
    process.env.GROQ_API_KEY_27,
    process.env.GROQ_API_KEY_28,
    process.env.GROQ_API_KEY_29,
    process.env.GROQ_API_KEY_30,
    process.env.GROQ_API_KEY_31,
    process.env.GROQ_API_KEY_32,
    process.env.GROQ_API_KEY_33,
    process.env.GROQ_API_KEY_34,
    process.env.GROQ_API_KEY_35,
    process.env.GROQ_API_KEY_36,
    process.env.GROQ_API_KEY_37,
    process.env.GROQ_API_KEY_38,
].filter(Boolean) as string[];

type KeyState = {
    key: string;
    exhaustedUntil: number;
    activeRequests: number;
};

const geminiKeyStates: KeyState[] = GEMINI_KEYS.map(k => ({
    key: k,
    exhaustedUntil: 0,
    activeRequests: 0
}));

const groqKeyStates: KeyState[] = GROQ_KEYS.map(k => ({
    key: k,
    exhaustedUntil: 0,
    activeRequests: 0
}));

// ============= KEY ROTATION HELPERS =============

function pickAvailableKey(keyStates: KeyState[]): KeyState | null {
    const now = Date.now();
    const available = keyStates
        .filter(k => k.exhaustedUntil <= now)
        .sort((a, b) => a.activeRequests - b.activeRequests);
    return available.length > 0 ? available[0] : null;
}

function markKeyExhausted(keyState: KeyState, cooldownMs: number) {
    keyState.exhaustedUntil = Math.max(keyState.exhaustedUntil, Date.now() + cooldownMs);
}

function isRateLimitError(error: any): boolean {
    const msg = String(error?.message ?? error);
    return (
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('quota') ||
        msg.includes('Rate limit') ||
        msg.includes('rate limit')
    );
}

// ============= GEMINI GENERATION =============

async function generateWithGemini<T>(
    operation: (ai: InstanceType<typeof GoogleGenAI>) => Promise<T>,
    maxAttempts = 3
): Promise<T> {
    if (geminiKeyStates.length === 0) {
        throw new Error('No Gemini API keys configured');
    }

    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxAttempts) {
        attempt++;
        const chosen = pickAvailableKey(geminiKeyStates);

        if (!chosen) {
            const earliest = geminiKeyStates.reduce((min, k) => Math.min(min, k.exhaustedUntil), Infinity);
            const waitMs = Math.max(0, earliest - Date.now());
            throw new Error(`All Gemini keys exhausted. Wait ${Math.ceil(waitMs / 1000)}s`);
        }

        chosen.activeRequests++;

        try {
            const ai = new GoogleGenAI({ apiKey: chosen.key });
            const result = await operation(ai);
            return result;
        } catch (err: any) {
            lastError = err;

            if (isRateLimitError(err)) {
                const cooldown = Math.floor(1000 * Math.pow(2, attempt) + Math.random() * 1000);
                markKeyExhausted(chosen, cooldown);
                console.warn(`Gemini key exhausted -> cooldown ${cooldown}ms`);
            } else {
                throw err;
            }
        } finally {
            chosen.activeRequests = Math.max(0, chosen.activeRequests - 1);
        }

        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempt - 1)));
    }

    throw lastError ?? new Error('All Gemini attempts failed');
}

// ============= GROQ GENERATION =============

async function generateWithGroq(
    prompt: string,
    systemPrompt: string,
    schema?: any,
    maxAttempts = 5
): Promise<any> {
    if (groqKeyStates.length === 0) {
        throw new Error('No Groq API keys configured');
    }

    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxAttempts) {
        attempt++;
        const chosen = pickAvailableKey(groqKeyStates);

        if (!chosen) {
            const earliest = groqKeyStates.reduce((min, k) => Math.min(min, k.exhaustedUntil), Infinity);
            const waitMs = Math.max(0, earliest - Date.now());
            throw new Error(`All Groq keys exhausted. Wait ${Math.ceil(waitMs / 1000)}s`);
        }

        chosen.activeRequests++;

        try {
            const groq = new Groq({ apiKey: chosen.key });
            const model = 'llama-3.1-8b-instant';

            const messages: any[] = [];
            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt });
            }
            messages.push({
                role: 'user',
                content: prompt + '\n\nIMPORTANT: Return ONLY valid JSON, no markdown, no explanation.'
            });

            const completion = await groq.chat.completions.create({
                messages,
                model,
                temperature: 0.9,
                max_tokens: 8192,
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) throw new Error('No content returned from Groq');

            // Clean markdown
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
            } else if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/```\n?/g, '');
            }

            return JSON.parse(cleanContent);
        } catch (err: any) {
            lastError = err;

            if (isRateLimitError(err)) {
                const cooldown = Math.floor(800 * Math.pow(2, attempt) + Math.random() * 500);
                markKeyExhausted(chosen, cooldown);
                console.warn(`Groq key exhausted -> cooldown ${cooldown}ms`);
            } else {
                throw err;
            }
        } finally {
            chosen.activeRequests = Math.max(0, chosen.activeRequests - 1);
        }

        await new Promise(res => setTimeout(res, 800 * Math.pow(2, attempt - 1)));
    }

    throw lastError ?? new Error('All Groq attempts failed');
}

// ============= UNIFIED AI GENERATION WITH FALLBACK =============

async function generateWithFallback<T>(
    geminiOperation: (ai: InstanceType<typeof GoogleGenAI>) => Promise<T>,
    groqParams: { prompt: string; systemPrompt: string; schema?: any }
): Promise<{ result: T; usedProvider: 'gemini' | 'groq' }> {
    // Try Gemini first
    if (geminiKeyStates.length > 0) {
        try {
            console.log('🔵 Attempting Gemini...');
            const result = await generateWithGemini(geminiOperation, 2);
            console.log('✅ Gemini succeeded');
            return { result, usedProvider: 'gemini' };
        } catch (error) {
            console.warn('⚠️ Gemini failed, falling back to Groq:', error);
        }
    }

    // Fallback to Groq
    if (groqKeyStates.length > 0) {
        console.log('🟢 Attempting Groq fallback...');
        const result = await generateWithGroq(
            groqParams.prompt,
            groqParams.systemPrompt,
            groqParams.schema
        );
        console.log('✅ Groq succeeded');
        return { result: result as T, usedProvider: 'groq' };
    }

    throw new Error('No AI providers available');
}

// ============= AI GENERATION FUNCTIONS =============

async function analyzeGoal(
    goal: string,
    context: LearningContext,
    timeAvailable?: string,
    uploadedFileContent?: string
): Promise<{
    parsedGoal: string;
    domain: string;
    targetProficiency: string;
    estimatedTotalHours: number;
    recommendedEngine: EngineType;
}> {
    const systemPrompt = `You are an expert learning path designer for Gen Z students (16-24).

Analyze the user's goal and determine:
1. What they actually want to learn (be specific)
2. Which domain this falls under
3. Target proficiency level they need
4. Realistic time estimate (in hours)
5. Best engine for this learning goal

Context: ${context}

Available engines: codestudio, lingualab, artstudio, historymach, physicsengine, chemlab, mathlab, finlab, writingstudio

Respond ONLY with valid JSON.`;

    const fileContext = uploadedFileContent
        ? `\n\nUploaded document: ${uploadedFileContent.substring(0, 3000)}`
        : '';

    const prompt = `Goal: "${goal}"${fileContext}`;

    const { result } = await generateWithFallback(
        async (ai) => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                contents: prompt,
                config: {
                    systemInstruction: systemPrompt,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            parsedGoal: { type: Type.STRING },
                            domain: { type: Type.STRING },
                            targetProficiency: { type: Type.STRING },
                            estimatedTotalHours: { type: Type.NUMBER },
                            recommendedEngine: { type: Type.STRING },
                        },
                        required: ['parsedGoal', 'domain', 'targetProficiency', 'estimatedTotalHours', 'recommendedEngine']
                    }
                }
            });
            return JSON.parse(response.text);
        },
        { prompt, systemPrompt }
    );

    return {
        parsedGoal: result.parsedGoal,
        domain: result.domain,
        targetProficiency: result.targetProficiency,
        estimatedTotalHours: result.estimatedTotalHours,
        recommendedEngine: result.recommendedEngine as EngineType
    };
}

async function generateSkillGraph(
    parsedGoal: string,
    domain: string,
    context: LearningContext,
    targetProficiency: string,
    primaryEngine: EngineType
): Promise<{
    skillPaths: SkillPath[];
    miniProjects: MiniProject[];
    capstoneProject: MiniProject;
}> {
    const contextualGuidance = {
        [LearningContext.HighSchool]: 'Simple language, encouraging, portfolio for college apps, fun projects',
        [LearningContext.College]: 'Technical background, internship-ready, hackathon projects, career-focused',
        [LearningContext.JobSeeking]: 'Interview prep, industry standards, resume-worthy, fast-track',
        [LearningContext.BuildingProjects]: 'Shipping focused, MVP projects, monetization, full-stack'
    };

    const systemPrompt = `You are a curriculum designer for Gen Z learners.

Create MICRO-SKILLS (2-5 min each).

RULES:
1. Each skill = ONE atomic capability
2. Demonstrable in an engine
3. Total 12-20 micro-skills
4. 3-5 logical skill paths
5. 2-3 mini-projects (5-15 min)
6. One capstone (20-40 min)

Target: ${parsedGoal}
Domain: ${domain}
Level: ${targetProficiency}
Engine: ${primaryEngine}

Style: ${contextualGuidance[context]}

Naming: ACTION-oriented (e.g., "Write Your First Function" not "Learn Functions")

Respond ONLY with valid JSON.`;

    const prompt = `Generate skill graph for: ${parsedGoal}`;

    const { result } = await generateWithFallback(
        async (ai) => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                contents: prompt,
                config: {
                    systemInstruction: systemPrompt,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            skillPaths: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        name: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        skills: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    id: { type: Type.STRING },
                                                    name: { type: Type.STRING },
                                                    description: { type: Type.STRING },
                                                    engine: { type: Type.STRING },
                                                    estimatedMinutes: { type: Type.NUMBER },
                                                    prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
                                                    masteryThreshold: {
                                                        type: Type.OBJECT,
                                                        properties: {
                                                            minChallenges: { type: Type.NUMBER },
                                                            minConfidence: { type: Type.NUMBER },
                                                            minSuccessRate: { type: Type.NUMBER }
                                                        }
                                                    },
                                                    challengeTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
                                                    xpReward: { type: Type.NUMBER }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            miniProjects: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        name: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        unlocksAfter: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        engine: { type: Type.STRING },
                                        estimatedMinutes: { type: Type.NUMBER },
                                        xpReward: { type: Type.NUMBER },
                                        shareTemplate: { type: Type.STRING }
                                    }
                                }
                            },
                            capstoneProject: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    name: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    unlocksAfter: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    engine: { type: Type.STRING },
                                    estimatedMinutes: { type: Type.NUMBER },
                                    xpReward: { type: Type.NUMBER },
                                    shareTemplate: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            });
            return JSON.parse(response.text);
        },
        { prompt, systemPrompt }
    );

    return result;
}

// ============= MAIN ENDPOINT =============

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            goal,
            context = LearningContext.College,
            timeAvailable,
            uploadedFile
        } = body;

        if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
            return NextResponse.json(
                { error: 'Goal is required' },
                { status: 400 }
            );
        }

        if (geminiKeyStates.length === 0 && groqKeyStates.length === 0) {
            return NextResponse.json(
                { error: 'No AI providers configured' },
                { status: 500 }
            );
        }

        console.log('🚀 Starting learning path generation...');

        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Step 1: Analyze
        console.log('🧠 Analyzing goal...');
        const analysis = await analyzeGoal(goal, context, timeAvailable, uploadedFile?.content);
        console.log(`✅ Analysis: ${analysis.domain} - ${analysis.recommendedEngine}`);

        // Step 2: Generate
        console.log('🗺️ Generating skill graph...');
        const skillGraphData = await generateSkillGraph(
            analysis.parsedGoal,
            analysis.domain,
            context,
            analysis.targetProficiency,
            analysis.recommendedEngine as EngineType
        );

        const totalSkills = skillGraphData.skillPaths.reduce((sum, path) => sum + path.skills.length, 0);
        console.log(`✅ Generated ${totalSkills} micro-skills`);

        // Build skill graph
        const skillGraph: SkillGraph = {
            id: `sg_${Date.now()}_${user.id.substring(0, 8)}`,
            userId: user.id,
            goal: analysis.parsedGoal,
            context,
            totalSkills,
            estimatedHours: `${Math.ceil(analysis.estimatedTotalHours)}-${Math.ceil(analysis.estimatedTotalHours * 1.3)} hours`,
            skillPaths: skillGraphData.skillPaths,
            miniProjects: skillGraphData.miniProjects,
            capstoneProject: skillGraphData.capstoneProject,
            createdAt: new Date().toISOString()
        };

        // Initialize learner state
        const allSkills = skillGraphData.skillPaths.flatMap(path => path.skills);
        const skillMastery: LearnerState['skillMastery'] = {};
        allSkills.forEach(skill => {
            skillMastery[skill.id] = {
                confidence: 0.0,
                challengesCompleted: 0,
                successRate: 0.0,
                timeSpent: 0,
                lastPracticed: null,
                isMastered: false
            };
        });

        const learnerState: LearnerState = {
            id: `${user.id}_${skillGraph.id}`,
            userId: user.id,
            skillGraphId: skillGraph.id,
            skillMastery,
            currentSkill: null,
            streak: 0,
            totalXP: 0,
            level: 1,
            badges: [],
            startedAt: new Date().toISOString()
        };

        // Save to database
        console.log('💾 Saving to database...');
        const { error: graphError } = await supabase.from('skill_graphs').insert([skillGraph]);
        if (graphError) throw graphError;

        const { error: stateError } = await supabase.from('learner_states').insert([learnerState]);
        if (stateError) throw stateError;

        console.log('✅ Success!');

        return NextResponse.json({
            success: true,
            skillGraph: {
                ...skillGraph,
                readySkills: allSkills.filter(s => s.prerequisites.length === 0).length,
                totalProjects: skillGraphData.miniProjects.length + 1,
            },
            learnerState: {
                id: learnerState.id,
                totalSkills,
                masteredSkills: 0,
                currentLevel: 1,
                totalXP: 0,
                streak: 0
            }
        });

    } catch (error: any) {
        console.error('❌ Failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to generate learning path'
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'test') {
        return NextResponse.json({
            gemini: { available: geminiKeyStates.length, active: geminiKeyStates.filter(k => k.exhaustedUntil <= Date.now()).length },
            groq: { available: groqKeyStates.length, active: groqKeyStates.filter(k => k.exhaustedUntil <= Date.now()).length }
        });
    }

    return NextResponse.json({ error: 'Use POST to generate' }, { status: 400 });
}