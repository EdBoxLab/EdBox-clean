// app/api/learning-path/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Type } from "@google/genai";
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry } from '@/lib/ai-providers';

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

// ============= API KEY MANAGEMENT =============

const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

const getNextApiKey = (): string => {
  if (API_KEYS.length === 0) throw new Error('No API keys configured');
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
};

const createAI = () => new GoogleGenAI({ apiKey: getNextApiKey() });

// ============= RETRY WITH EXPONENTIAL BACKOFF =============

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimitError =
        error?.message?.includes('429') ||
        error?.message?.includes('RESOURCE_EXHAUSTED');

      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt || !isRateLimitError) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`⏳ Retry ${attempt + 1}/${maxRetries} in ${Math.round(delay)}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
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
  const systemPrompt = `Role: {Act as an expert learning path designer for Gen Z students (16–24). You are not just a planner, but a motivational architect who designs practical, build-focused learning journeys.}

Expertise: {Analyze user goals deeply, translate vague ambitions into specific skills, and map them to the right domain, proficiency level, realistic time estimate, and best engine. Always optimize for bite-sized (2–5 min) micro-skills, mobile-first learning, and building tangible outcomes.}

Audience Context:
- Situation: ${context}
- Preferences: Bite-sized learning, mobile-first, build > theory

Constraints: {Never output vague or generic paths. Always be specific, practical, and builder-oriented. Return ONLY valid JSON. No extra text.}

Goal: {Provide a JSON learning path analysis with 5 fields: actual_goal, domain, target_proficiency, time_estimate_hours, best_engine.}

Engagement Rules:
- **Specificity**: Translate broad goals into concrete skills (e.g., "learn coding" → "build a responsive website").  
- **Builder Focus**: Emphasize creation, projects, and applied learning.  
- **Realism**: Time estimates must be achievable for Gen Z students.  
- **Motivation**: Design paths that feel exciting and rewarding.  
- **JSON Enforcement**: Output strictly valid JSON, no extra commentary.  

Return: {Valid JSON object with keys: actual_goal, domain, target_proficiency, time_estimate_hours, best_engine.}
`;

  const fileContext = uploadedFileContent
    ? `\n\nUploaded document context: ${uploadedFileContent.substring(0, 3000)}`
    : '';

  const schema = {
    type: Type.OBJECT,
    properties: {
      parsedGoal: { type: Type.STRING },
      domain: { type: Type.STRING },
      targetProficiency: { type: Type.STRING },
      estimatedTotalHours: { type: Type.NUMBER },
      recommendedEngine: { type: Type.STRING },
    },
    required: ['parsedGoal', 'domain', 'targetProficiency', 'estimatedTotalHours', 'recommendedEngine']
  };

  const result = await generateWithRetry({
    prompt: `Goal: "${goal}"${fileContext}`,
    systemPrompt,
    schema,
    temperature: 1.0,
    maxTokens: 4000,
  });

  return JSON.parse(result.text);
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

  const schema = {
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
  };

  const result = await generateWithRetry({
    prompt: systemPrompt,
    systemPrompt: '',
    schema,
    temperature: 1.0,
    maxTokens: 8000,
  });

  return JSON.parse(result.text);
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
      currentSkill: null, // Will be set when user starts first session
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
        // Add some UI-friendly computed properties
        readySkills: allSkills.filter(s => s.prerequisites.length === 0).length,
        totalProjects: skillGraphData.miniProjects.length + 1, // +1 for capstone
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

// ============= GET ENDPOINT (For recommendations) =============

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'test') {
    // Health check endpoint
    try {
      const keysAvailable = API_KEYS.length;
      return NextResponse.json({
        success: true,
        keysAvailable,
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