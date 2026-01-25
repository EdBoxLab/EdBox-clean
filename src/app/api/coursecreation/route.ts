// app/api/coursecreation/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { generateWithRetry, extractContextFromText } from '@/lib/ai-providers';
import { detectCourseCategory, injectTemplateIntoPrompt } from './templates';
import { CourseCategory } from '@/lib/courseCreation/types';
import { checkCache, saveToCache } from '@/lib/ai-cache';
import { processFileContent } from '@/lib/utils/fileProcessing';
import { transformToGraph, normalizeSkillGraphData } from '@/lib/courseCreation/graphUtils';

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
  capstone_project: MiniProject;
  nodes: any[];
  edges: any[];
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
  category: CourseCategory;
}> {
  const systemPrompt = `Role: {Act as an expert learning path designer for Gen Z students (16–24). You are not just a planner, but a motivational architect who designs practical, build-focused learning journeys.}

Expertise: {Analyze user goals deeply, translate vague ambitions into specific skills, and map them to the right domain, proficiency level, realistic time estimate, and best engine. Always optimize for bite-sized (2–5 min) micro-skills, mobile-first learning, and building tangible outcomes.}

Time Available: ${timeAvailable || 'Not specified'}
Audience Context:
- Situation: ${context}
- Preferences: Bite-sized learning, mobile-first, build > theory

Constraints: {Never output vague or generic paths. Always be specific, practical, and builder-oriented. Return ONLY valid JSON. No extra text.}

Goal: {Provide a JSON learning path analysis with 5 fields: actual_goal, domain, target_proficiency, time_estimate_hours, best_engine.}

Engagement Rules:
- **Duration Calibration**: 
  - If time is ~5min: Focus on 1-3 atomic, high-impact micro-skills.
  - If time is ~15min: Focus on 4-7 micro-skills with slightly more depth.
  - If time is ~1hour: Design a comprehensive path with 12-15 micro-skills and projects.
  - Set time_estimate_hours exactly to the numeric value of the timeAvailable (e.g., 5 min = 0.083, 15 min = 0.25, 1 hour = 1.0).
- **Specificity**: Translate broad goals into concrete skills (e.g., "learn coding" → "build a responsive website").  
- **Builder Focus**: Emphasize creation, projects, and applied learning.  
- **Realism**: Time estimates must be achievable for Gen Z students.  
- **Motivation**: Design paths that feel exciting and rewarding.  
- **JSON Enforcement**: Output strictly valid JSON, no extra commentary.  

Return: {Valid JSON object with keys: actual_goal, domain, target_proficiency, time_estimate_hours, best_engine.}
`;

  const fileContext = uploadedFileContent
    ? `\n\nIMPORTANT: Use the following extracted document context as the primary source for the course structure and content. Only generate what is relevant to this context:\n${uploadedFileContent}`
    : '';

  const schema = {
    type: "object",
    properties: {
      parsedGoal: { type: "string" },
      domain: { type: "string" },
      targetProficiency: { type: "string" },
      estimatedTotalHours: { type: "number" },
      recommendedEngine: { type: "string" },
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

  const parsed = JSON.parse(result.text);
  const category = detectCourseCategory(parsed.parsedGoal, parsed.domain);

  return { ...parsed, category };
}

/**
 * Step 2: Generate personalized skill graph (the core learning path)
 */
async function generateSkillGraph(
  parsedGoal: string,
  domain: string,
  context: LearningContext,
  targetProficiency: string,
  primaryEngine: EngineType,
  category: CourseCategory
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

  const basePrompt = `You are an expert curriculum designer for Gen Z learners.

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

  const systemPrompt = injectTemplateIntoPrompt(basePrompt, category);

  const schema = {
    type: "object",
    properties: {
      skillPaths: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            skills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string" },
                  engine: { type: "string" },
                  estimatedMinutes: { type: "number" },
                  prerequisites: { type: "array", items: { type: "string" } },
                  masteryThreshold: {
                    type: "object",
                    properties: {
                      minChallenges: { type: "number" },
                      minConfidence: { type: "number" },
                      minSuccessRate: { type: "number" }
                    },
                    required: ['minChallenges', 'minConfidence', 'minSuccessRate']
                  },
                  challengeTypes: { type: "array", items: { type: "string" } },
                  xpReward: { type: "number" }
                },
                required: ['id', 'name', 'description', 'engine', 'estimatedMinutes', 'prerequisites', 'masteryThreshold', 'challengeTypes', 'xpReward']
              }
            }
          },
          required: ['id', 'name', 'description', 'skills']
        }
      },
      miniProjects: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            unlocksAfter: { type: "array", items: { type: "string" } },
            engine: { type: "string" },
            estimatedMinutes: { type: "number" },
            xpReward: { type: "number" },
            shareTemplate: { type: "string" }
          },
          required: ['id', 'name', 'description', 'unlocksAfter', 'engine', 'estimatedMinutes', 'xpReward', 'shareTemplate']
        }
      },
      capstoneProject: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          unlocksAfter: { type: "array", items: { type: "string" } },
          engine: { type: "string" },
          estimatedMinutes: { type: "number" },
          xpReward: { type: "number" },
          shareTemplate: { type: "string" }
        },
        required: ['id', 'name', 'description', 'unlocksAfter', 'engine', 'estimatedMinutes', 'xpReward', 'shareTemplate']
      }
    },
    required: ['skillPaths', 'miniProjects', 'capstoneProject']
  };

  const result = await generateWithRetry({
    prompt: systemPrompt,
    systemPrompt: 'You are an expert curriculum designer. Follow the schema exactly. Ensure all requested sections (skillPaths, miniProjects, capstoneProject) are fully populated.',
    schema,
    temperature: 0.7,
    maxTokens: 8000,
  });

  return normalizeSkillGraphData(JSON.parse(result.text));
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
        { error: 'Goal is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    console.log('🚀 Starting learning path generation...');
    console.log(`📝 Goal: "${goal}"`);
    console.log(`👤 Context: ${context}`);

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const cached = await checkCache({
      requestType: 'course_generation',
      requestData: { goal, context, timeAvailable },
    });

    if (cached && cached.responseData) {
      console.log('📦 Returning cached course');

      const cachedGraph = {
        ...cached.responseData.skillGraph,
        id: `sg_${Date.now()}_${user.id.substring(0, 8)}`,
        userId: user.id,
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        cached: true,
        skillGraph: cachedGraph
      });
    }

    let extractedContext = '';
    if (uploadedFile?.content) {
      try {
        console.log(`📄 Processing file in course creation: ${uploadedFile.name}`);
        const rawText = await processFileContent(
          uploadedFile.content,
          uploadedFile.type || '',
          uploadedFile.name || ''
        );
        extractedContext = await extractContextFromText(rawText);
        console.log('✅ File context extracted');
      } catch (err) {
        console.error('❌ File processing failed:', err);
      }
    }

    console.log('🧠 Step 1: Analyzing goal...');
    const analysis = await analyzeGoal(
      goal,
      context,
      timeAvailable,
      extractedContext
    );

    console.log(`✅ Analysis complete:`, {
      domain: analysis.domain,
      engine: analysis.recommendedEngine,
      category: analysis.category,
      hours: analysis.estimatedTotalHours
    });

    console.log('🗺️ Step 2: Generating skill graph...');
    const skillGraphData = await generateSkillGraph(
      analysis.parsedGoal,
      analysis.domain,
      context,
      analysis.targetProficiency,
      analysis.recommendedEngine as EngineType,
      analysis.category
    );

    const totalSkills = skillGraphData.skillPaths.reduce(
      (sum, path) => sum + path.skills.length,
      0
    );

    console.log(`✅ Skill graph generated: ${totalSkills} micro-skills`);

    const { nodes, edges } = transformToGraph(
      skillGraphData.skillPaths,
      skillGraphData.miniProjects,
      skillGraphData.capstoneProject,
      analysis.category
    );

    const skillGraph: SkillGraph = {
      id: crypto.randomUUID(),
      userId: user.id,
      goal: analysis.parsedGoal,
      context,
      totalSkills,
      estimatedHours: `${Math.ceil(analysis.estimatedTotalHours)}-${Math.ceil(analysis.estimatedTotalHours * 1.3)} hours`,
      skillPaths: skillGraphData.skillPaths,
      miniProjects: skillGraphData.miniProjects,
      capstone_project: skillGraphData.capstoneProject,
      nodes,
      edges,
      createdAt: new Date().toISOString()
    };

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
      id: crypto.randomUUID(),
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

    console.log('💾 Step 4: Saving to database...');

    const { error: graphError } = await supabase
      .from('skill_graphs')
      .insert([{
        id: skillGraph.id,
        user_id: user.id,
        goal: skillGraph.goal,
        context: skillGraph.context,
        total_skills: skillGraph.totalSkills,
        estimated_hours: skillGraph.estimatedHours,
        skill_paths: skillGraph.skillPaths,
        mini_projects: skillGraph.miniProjects,
        capstone_project: skillGraph.capstone_project,
        nodes: skillGraph.nodes,
        edges: skillGraph.edges,
        created_at: skillGraph.createdAt
      }]);

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

    await saveToCache(
      {
        requestType: 'course_generation',
        requestData: { goal, context, timeAvailable },
        category: analysis.category,
      },
      {
        skillGraph: {
            goal: skillGraph.goal,
            context: skillGraph.context,
            totalSkills: skillGraph.totalSkills,
            estimatedHours: skillGraph.estimatedHours,
            skillPaths: skillGraph.skillPaths,
            miniProjects: skillGraph.miniProjects,
            capstone_project: skillGraph.capstone_project,
            nodes: skillGraph.nodes,
            edges: skillGraph.edges,
          },
      }
    );

    console.log('✅ Learning path generated successfully!');

    return NextResponse.json({
      success: true,
      cached: false,
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

// ============= GET ENDPOINT (For recommendations) =============

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'test') {
    // Health check endpoint
    return NextResponse.json({
      success: true,
      message: `AI provider initialized`
    });
  }

  return NextResponse.json({
    error: 'Invalid action. Use POST to generate learning paths.'
  }, { status: 400 });
}