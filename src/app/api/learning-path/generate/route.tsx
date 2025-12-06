// app/api/learning-path/generate/route.ts
// ============ GLOBAL AI REQUEST QUEUE ============

const AI_QUEUE: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

async function processAIQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (AI_QUEUE.length > 0) {
    const job = AI_QUEUE.shift();
    if (job) await job();
  }

  isProcessingQueue = false;
}

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";
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
  estimatedMinutes: number; // 2-5 minutes
  prerequisites: string[]; // Other skill IDs
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
  unlocksAfter: string[]; // Skill IDs
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

// ============= API KEY MANAGEMENT (ROTATION + EXHAUSTION TRACKING) =============

const RAW_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
].filter(Boolean) as string[];

type ApiKeyState = {
  key: string;
  exhaustedUntil: number; // ms timestamp until which we won't use the key
  activeRequests: number; // current inflight requests using this key
};

const keyStates: ApiKeyState[] = RAW_KEYS.map(k => ({
  key: k,
  exhaustedUntil: 0,
  activeRequests: 0
}));

const allKeysConfigured = keyStates.length > 0;

// small helper to pick the best available key
function pickAvailableKey(): ApiKeyState | null {
  const now = Date.now();
  // Prefer non-exhausted keys, ordered by least active requests
  const available = keyStates
    .filter(k => k.exhaustedUntil <= now)
    .sort((a, b) => a.activeRequests - b.activeRequests);
  if (available.length > 0) return available[0];

  // If none are immediately available, return null to indicate no key is usable now.
  return null;
}

function markKeyExhausted(keyState: ApiKeyState, cooldownMs: number) {
  keyState.exhaustedUntil = Math.max(keyState.exhaustedUntil, Date.now() + cooldownMs);
  // (do not set activeRequests here; that is handled by caller's finally)
}

// Generic function to call the GenAI API while rotating keys and handling per-key exhaustion
async function callWithKeyRotation<T>(
  operation: (ai: GoogleGenAI) => Promise<T>,
  options?: {
    maxAttempts?: number; // total attempts across keys
    baseDelayMs?: number;  // base backoff delay between attempts
  }
): Promise<T> {
  if (!allKeysConfigured) throw new Error('No API keys configured');

  const maxAttempts = options?.maxAttempts ?? 6;
  const baseDelayMs = options?.baseDelayMs ?? 800;

  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxAttempts) {
    attempt++;
    const chosen = pickAvailableKey();

    if (!chosen) {
      // No keys are currently available (all temporarily exhausted)
      // Determine the soonest key to become available and fail fast with a useful message
      const earliest = keyStates.reduce((min, k) => Math.min(min, k.exhaustedUntil), Infinity);
      const waitMs = Math.max(0, earliest - Date.now());
      throw new Error(`All API keys temporarily exhausted. Try again after ${Math.ceil(waitMs / 1000)}s.`);
    }

    // Reserve this key (increment inflight)
    chosen.activeRequests++;

    try {
      const ai = new GoogleGenAI({ apiKey: chosen.key });
      const result = await operation(ai);
      // success -> release and return
      return result;
    } catch (err: any) {
      lastError = err;

      // Determine if it's a rate limit / resource exhausted error
      const msg = String(err?.message ?? err);
      const isRateLimit =
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('quota') ||
        msg.includes('Rate limit') ||
        msg.includes('rate limit');

      if (isRateLimit) {
        // Put the key into cool-down for a duration that grows with attempts
        // Example cooldown: baseDelayMs * 2^(attempt) + random jitter
        const cooldown = Math.floor(baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000);
        markKeyExhausted(chosen, cooldown);
        console.warn(`Key temporarily exhausted -> cooldown ${cooldown}ms. Key: ${String(chosen.key).slice(-6)}`);
        // fallthrough to retry with another key after small backoff
      } else {
        // Not a rate-limit error: release and rethrow
        throw err;
      }
    } finally {
      // Release the reservation for the chosen key
      chosen.activeRequests = Math.max(0, chosen.activeRequests - 1);
    }

    // exponential backoff before next attempt across keys
    const backoff = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 300;
    await new Promise(res => setTimeout(res, backoff));
  }

  // If we exit loop, no key succeeded
  throw lastError ?? new Error('All attempts failed');
}

// ============= AI GENERATION FUNCTIONS =============

/**
 * Step 1: Analyze user's goal and context to determine learning intent
 */
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

Context about the user:
- Situation: ${context}
- They prefer bite-sized learning (2-5 min micro-skills)
- They want to BUILD, not just learn theory
- They're on mobile often

Available engines:
- codestudio: Programming, web dev, algorithms, APIs
- lingualab: Language learning, conversation, pronunciation
- artstudio: Digital art, drawing, design
- historymach: History, geography, timelines
- physicsengine: Physics simulations, experiments
- chemlab: Chemistry experiments, reactions
- mathlab: Math problem-solving, graphing, statistics
- finlab: Finance, investing, business concepts
- writingstudio: Writing, content creation, journalism

Respond ONLY with valid JSON.`;

  const fileContext = uploadedFileContent
    ? `\n\nUploaded document context: ${uploadedFileContent.substring(0, 3000)}`
    : '';

  return callWithKeyRotation(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Goal: "${goal}"${fileContext}`,
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

    // Some safety: parse and coerce engine to expected enum
    const parsed = JSON.parse(response.text);
    if (!parsed.recommendedEngine) parsed.recommendedEngine = EngineType.CodeStudio;
    return {
      parsedGoal: parsed.parsedGoal,
      domain: parsed.domain,
      targetProficiency: parsed.targetProficiency,
      estimatedTotalHours: parsed.estimatedTotalHours,
      recommendedEngine: parsed.recommendedEngine as EngineType
    };
  }, { maxAttempts: 6, baseDelayMs: 1000 });
}

/**
 * Step 2: Generate personalized skill graph (the core learning path)
 */
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

  // Personalization based on context
  const contextualGuidance = {
    [LearningContext.HighSchool]: `
- Keep language simple and encouraging
- More scaffolding in early skills
- Focus on portfolio building for college apps
- Include fun, shareable projects`,

    [LearningContext.College]: `
- Assume some technical background
- Focus on internship-ready skills
- Include hackathon-worthy projects
- Career-oriented outcomes`,

    [LearningContext.JobSeeking]: `
- Interview-focused skills
- Industry-standard projects
- Resume-worthy outcomes
- Fast-track to job readiness`,

    [LearningContext.BuildingProjects]: `
- Emphasize shipping and launching
- MVP-focused projects
- Monetization strategies
- Full-stack capabilities`
  };

  const systemPrompt = `You are an expert curriculum designer for Gen Z learners.

Create a skill graph with MICRO-SKILLS (2-5 minutes each).

CRITICAL RULES:
1. Each micro-skill = ONE atomic capability (not a broad topic)
2. Skills must be DEMONSTRABLE in an engine
3. Total 12-20 micro-skills (not more!)
4. Organize into 3-5 logical skill paths
5. Include 2-3 mini-projects (5-15 min each)
6. One epic capstone project (20-40 min)

Target: ${parsedGoal}
Domain: ${domain}
Proficiency: ${targetProficiency}
Primary Engine: ${primaryEngine}

PERSONALIZATION:
${contextualGuidance[context]}

Micro-skill naming: Be SPECIFIC and ACTION-oriented
❌ Bad: "Learn Variables"
✅ Good: "Declare and Use Variables"

❌ Bad: "Understanding Functions"  
✅ Good: "Write Your First Function"

Each skill unlocks when prerequisites are mastered.

Respond ONLY with valid JSON.`;

  return callWithKeyRotation(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: systemPrompt,
      config: {
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
                          },
                          required: ['minChallenges', 'minConfidence', 'minSuccessRate']
                        },
                        challengeTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
                        xpReward: { type: Type.NUMBER }
                      },
                      required: ['id', 'name', 'description', 'engine', 'estimatedMinutes', 'prerequisites', 'masteryThreshold', 'challengeTypes', 'xpReward']
                    }
                  }
                },
                required: ['id', 'name', 'description', 'skills']
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
                },
                required: ['id', 'name', 'description', 'unlocksAfter', 'engine', 'estimatedMinutes', 'xpReward', 'shareTemplate']
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
              },
              required: ['id', 'name', 'description', 'unlocksAfter', 'engine', 'estimatedMinutes', 'xpReward', 'shareTemplate']
            }
          },
          required: ['skillPaths', 'miniProjects', 'capstoneProject']
        }
      }
    });

    return JSON.parse(response.text);
  }, { maxAttempts: 8, baseDelayMs: 900 });
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

    // Validation
    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      return NextResponse.json(
        { error: 'Goal is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!allKeysConfigured) {
      return NextResponse.json({ success: false, error: 'No API keys configured' }, { status: 500 });
    }

    console.log('🚀 Starting learning path generation...');
    console.log(`📝 Goal: "${goal}"`);
    console.log(`👤 Context: ${context}`);

    // Get user ID from auth
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // STEP 1: Analyze goal
    console.log('🧠 Step 1: Analyzing goal...');
    const analysis = await analyzeGoal(
      goal,
      context,
      timeAvailable,
      uploadedFile?.content
    );

    console.log(`✅ Analysis complete:`, {
      domain: analysis.domain,
      engine: analysis.recommendedEngine,
      hours: analysis.estimatedTotalHours
    });

    // STEP 2: Generate skill graph
    console.log('🗺️ Step 2: Generating skill graph...');
    const skillGraphData = await generateSkillGraph(
      analysis.parsedGoal,
      analysis.domain,
      context,
      analysis.targetProficiency,
      analysis.recommendedEngine as EngineType
    );

    // Count total skills
    const totalSkills = skillGraphData.skillPaths.reduce(
      (sum, path) => sum + path.skills.length,
      0
    );

    console.log(`✅ Skill graph generated: ${totalSkills} micro-skills`);

    // STEP 3: Build final skill graph
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

    // STEP 4: Initialize learner state
    console.log('👤 Step 3: Initializing learner state...');
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
      id: `ls_${Date.now()}_${user.id.substring(0, 8)}`,
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

    // STEP 5: Save to database
    console.log('💾 Step 4: Saving to database...');

    const { error: graphError } = await supabase
      .from('skill_graphs')
      .insert([skillGraph]);

    if (graphError) {
      console.error('❌ Failed to save skill graph:', graphError);
      throw new Error(`Database error: ${graphError.message}`);
    }

    const { error: stateError } = await supabase
      .from('learner_states')
      .insert([learnerState]);

    if (stateError) {
      console.error('❌ Failed to save learner state:', stateError);
      throw new Error(`Database error: ${stateError.message}`);
    }

    console.log('✅ Learning path generated successfully!');

    // STEP 6: Return response
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
    console.error('❌ Learning path generation failed:', error);

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate learning path',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// ============= GET ENDPOINT (For recommendations & test) =============

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'test') {
    try {
      const keysAvailable = keyStates.length;
      const statuses = keyStates.map(k => ({
        last6: String(k.key).slice(-6),
        exhaustedUntil: k.exhaustedUntil,
        activeRequests: k.activeRequests,
        isExhausted: k.exhaustedUntil > Date.now()
      }));
      return NextResponse.json({
        success: true,
        keysAvailable,
        statuses,
        message: `${keysAvailable} API key(s) configured`
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'No API keys configured'
      }, { status: 500 });
    }
  }

  return NextResponse.json({
    error: 'Invalid action. Use POST to generate learning paths.'
  }, { status: 400 });
}
