import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// ============= TYPES =============

enum LearningContext {
    HighSchool = "high_school",
    College = "college",
    JobSeeking = "job_seeking",
    BuildingProjects = "building_projects"
}

interface MicroSkill {
    id: string;
    title: string;
    description: string;
    engine: string;
    level: string;
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
    engine: string;
    estimatedMinutes: number;
    xpReward: number;
    shareTemplate: string;
}

// ============= API KEY MANAGEMENT =============

const GROQ_API_KEYS = [
    process.env.Grok_API_Key_1,
    process.env.Grok_API_Key_2,
    process.env.Grok_API_Key_3,
    process.env.Grok_API_Key_4,
    process.env.Grok_API_Key_5,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

const getApiKey = () => {
    const key = GROQ_API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length;
    return key;
};

// ============= CONTEXT PERSONALIZATION =============

const getContextGuidance = (context: LearningContext) => {
    const guidance = {
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

    return guidance[context];
};

// ============= MAIN GENERATION =============

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { goal, context = LearningContext.College } = await request.json();

        if (!goal) {
            return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
        }

        const apiKey = getApiKey();
        if (!apiKey) throw new Error("No Groq API Key provided");

        const groq = new Groq({ apiKey });

        // Generate comprehensive skill graph with Groq
        const systemPrompt = `You are an expert curriculum designer for Gen Z learners.

Create a comprehensive skill graph with:
- 3-5 Skill Paths (groups of related micro-skills)
- 12-20 total Micro-Skills (2-5 minutes each)
- 2-3 Mini Projects (5-15 min each)
- 1 Capstone Project (20-40 min)

CRITICAL RULES:
1. Each micro-skill = ONE atomic capability
2. Skills must be DEMONSTRABLE in an engine
3. Action-oriented naming (e.g., "Write Your First Function" not "Learn Functions")
4. Include prerequisites, mastery thresholds, challenge types
5. Projects unlock after specific skills

Goal: "${goal}"
Context: ${context}

PERSONALIZATION:
${getContextGuidance(context as LearningContext)}

Available engines:
- Coding: Programming, web dev, APIs
- Default: Writing, content creation
- Math: Problem-solving, statistics
- Language: Conversation, pronunciation
- Physics: Simulations, experiments
- Chemistry: Reactions, experiments
- Finance: Investing, business
- Art: Digital art, design
- History: Timelines, geography

Return ONLY valid JSON (no markdown):
{
  "skillPaths": [
    {
      "id": "path_1",
      "name": "Path Name",
      "description": "What this path teaches",
      "skills": [
        {
          "id": "skill_1",
          "title": "Action-Oriented Title",
          "description": "What you'll do",
          "engine": "Coding",
          "level": "Beginner",
          "estimatedMinutes": 3,
          "prerequisites": [],
          "masteryThreshold": {
            "minChallenges": 2,
            "minConfidence": 0.7,
            "minSuccessRate": 0.6
          },
          "challengeTypes": ["coding", "debugging"],
          "xpReward": 50
        }
      ]
    }
  ],
  "miniProjects": [
    {
      "id": "project_1",
      "name": "Project Name",
      "description": "Build something cool",
      "unlocksAfter": ["skill_3", "skill_4"],
      "engine": "Coding",
      "estimatedMinutes": 10,
      "xpReward": 200,
      "shareTemplate": "I just built {project}!"
    }
  ],
  "capstoneProject": {
    "id": "capstone",
    "name": "Epic Final Project",
    "description": "Showcase everything",
    "unlocksAfter": ["skill_10", "skill_11"],
    "engine": "Coding",
    "estimatedMinutes": 30,
    "xpReward": 500,
    "shareTemplate": "I completed {goal}!"
  }
}`;

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are a JSON-only API. Return valid JSON without markdown formatting.' },
                { role: 'user', content: systemPrompt }
            ],
            temperature: 0.8,
            max_tokens: 4000,
        });

        const text = response.choices[0]?.message?.content || "{}";
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const graphData = JSON.parse(cleanedText);

        // Flatten skills for database storage
        const allSkills: MicroSkill[] = [];
        const edges: Array<{ source: string, target: string }> = [];

        graphData.skillPaths.forEach((path: SkillPath) => {
            path.skills.forEach((skill: MicroSkill) => {
                allSkills.push(skill);

                // Create edges from prerequisites
                skill.prerequisites.forEach(prereq => {
                    edges.push({ source: prereq, target: skill.id });
                });
            });
        });

        // Save to database
        const { data: savedGraph, error: saveError } = await supabase
            .from('skill_graphs')
            .insert({
                user_id: user.id,
                goal,
                nodes: allSkills,
                edges,
                metadata: {
                    context,
                    skillPaths: graphData.skillPaths,
                    miniProjects: graphData.miniProjects,
                    capstoneProject: graphData.capstoneProject,
                    totalSkills: allSkills.length,
                    estimatedHours: Math.ceil(allSkills.reduce((sum, s) => sum + s.estimatedMinutes, 0) / 60)
                }
            })
            .select()
            .single();

        if (saveError) {
            console.error('Database save error:', saveError);
            throw new Error('Failed to save skill graph');
        }

        return NextResponse.json({
            success: true,
            graph: {
                id: savedGraph.id,
                userId: savedGraph.user_id,
                goal: savedGraph.goal,
                nodes: savedGraph.nodes,
                edges: savedGraph.edges,
                skillPaths: graphData.skillPaths,
                miniProjects: graphData.miniProjects,
                capstoneProject: graphData.capstoneProject,
                createdAt: savedGraph.created_at
            }
        });

    } catch (error: any) {
        console.error('Skill Graph Generation Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate skill graph' },
            { status: 500 }
        );
    }
}
