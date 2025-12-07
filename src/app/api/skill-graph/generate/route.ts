import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
    SkillGraph,
    SkillNode,
    EngineType,
    CourseCategory
} from '@/lib/courseCreation/types';

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

// ============= AI GENERATION LOGIC =============

async function analyzeGoalAndGenerateGraph(
    goal: string,
    context: string
): Promise<{ nodes: SkillNode[]; edges: { from: string; to: string }[] }> {

    const apiKey = getApiKey();
    if (!apiKey) throw new Error("No Groq API Key provided");

    const groq = new Groq({ apiKey });

    const systemPrompt = `You are a learning architect for an "Engine-Native" EdTech platform.
  Instead of courses, we build "Skill Graphs" where users learn by doing in interactive engines.
  
  Engines Available:
  - Coding (Python/JS) -> 'Coding'
  - Math (Graphing/Solver) -> 'Math'
  - Physics (Simulations) -> 'Physics'
  - Chemistry (Lab) -> 'Chemistry'
  - Writing/Lang -> 'Language'
  - Financial Sim -> 'Finance'
  - History/Geo -> 'History'
  
  User Goal: "${goal}"
  Context: "${context}"
  
  Generate a Directed Acyclic Graph (DAG) of MICRO-SKILLS (15-30 mins each) to achieve this goal.
  Each skill MUST be demonstrable in one of the engines.
  
  Output ONLY valid JSON in this exact format (no markdown, no code blocks):
  {
    "nodes": [
      {
        "id": "skill_1",
        "title": "Action-oriented Title",
        "description": "Brief description of the task",
        "engine": "Coding",
        "category": "Technology",
        "estimatedMinutes": 20,
        "xpReward": 100,
        "level": "Beginner"
      }
    ],
    "edges": [
      { "from": "skill_1", "to": "skill_2" }
    ]
  }`;

    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            {
                role: 'system',
                content: 'You are a JSON-only API. Return valid JSON without markdown formatting.'
            },
            {
                role: 'user',
                content: systemPrompt
            }
        ],
        temperature: 0.7,
        max_tokens: 4000,
    });

    const text = response.choices[0]?.message?.content || "{}";

    // Clean up any markdown formatting
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return JSON.parse(cleanedText);
}

// ============= ROUTE HANDLER =============

export async function POST(request: NextRequest) {
    try {
        const { goal, context } = await request.json();

        if (!goal) return NextResponse.json({ error: "Goal is required" }, { status: 400 });

        // Authentication check
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        console.log(`Generating Skill Graph for: ${goal}`);

        const graphData = await analyzeGoalAndGenerateGraph(goal, context || "General Learning");

        // Construct the full SkillGraph object
        const skillGraph: SkillGraph = {
            id: crypto.randomUUID(),
            userId: user.id,
            goal,
            nodes: graphData.nodes.map((node: any) => ({
                ...node,
                // Ensure defaults if AI misses fields
                masteryThreshold: { minSuccessRate: 0.8, challengesRequired: 3 },
                prerequisites: [] // populated by edges logic below if needed, or edges handles it
            })),
            edges: graphData.edges,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Populate prerequisites in nodes based on edges for easier frontend traversal
        skillGraph.edges.forEach(edge => {
            const targetNode = skillGraph.nodes.find(n => n.id === edge.to);
            if (targetNode) {
                if (!targetNode.prerequisites) targetNode.prerequisites = [];
                targetNode.prerequisites.push(edge.from);
            }
        });

        // Save to Database
        const { data: savedGraph, error: dbError } = await supabase
            .from('skill_graphs')
            .insert({
                user_id: user.id,
                goal: skillGraph.goal,
                nodes: skillGraph.nodes,
                edges: skillGraph.edges,
            })
            .select()
            .single();

        if (dbError) {
            console.error("Database Error:", dbError);
            throw new Error("Failed to save skill graph to database");
        }

        // Return the saved graph with database-generated ID
        const finalGraph: SkillGraph = {
            id: savedGraph.id,
            userId: savedGraph.user_id,
            goal: savedGraph.goal,
            nodes: savedGraph.nodes,
            edges: savedGraph.edges,
            createdAt: savedGraph.created_at,
            updatedAt: savedGraph.updated_at,
        };

        return NextResponse.json({ success: true, graph: finalGraph });

    } catch (error: any) {
        console.error("Skill Graph Generation Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate skill graph" },
            { status: 500 }
        );
    }
}
