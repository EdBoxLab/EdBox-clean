import { NextRequest, NextResponse } from 'next/server';
import { generateWithFallback, cleanJsonResponse } from '@/lib/ai-providers';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { skillId, skillTitle, skillDescription, skillLevel, graphGoal } = body;

        if (!skillId || !skillTitle) {
            return NextResponse.json(
                { error: 'Missing required fields: skillId, skillTitle' },
                { status: 400 }
            );
        }

        const systemPrompt = `You are an expert curriculum designer for EdBox, an AI-powered learning platform. 
Your task is to create a structured curriculum that takes a learner from absolute foundation to complete mastery of a specific skill.
Always respond with valid JSON only, no markdown or extra text.`;

        const prompt = `Create a detailed 5-stage learning curriculum for the following skill:

**Skill**: ${skillTitle}
**Description**: ${skillDescription || 'No description provided'}
**Current Level**: ${skillLevel || 'Beginner'}
**Parent Learning Goal**: ${graphGoal || 'General mastery'}

Generate a curriculum with exactly 5 stages that progressively build from foundation to mastery.

Respond with this exact JSON structure:
{
  "curriculum": {
    "skillId": "${skillId}",
    "title": "${skillTitle}",
    "stages": [
      {
        "level": "Foundation",
        "topics": ["topic1", "topic2", "topic3"],
        "description": "Brief description of what this stage covers",
        "learningObjectives": ["objective1", "objective2", "objective3"],
        "estimatedMinutes": 15
      },
      {
        "level": "Developing",
        "topics": ["..."],
        "description": "...",
        "learningObjectives": ["..."],
        "estimatedMinutes": 20
      },
      {
        "level": "Proficient",
        "topics": ["..."],
        "description": "...",
        "learningObjectives": ["..."],
        "estimatedMinutes": 25
      },
      {
        "level": "Advanced",
        "topics": ["..."],
        "description": "...",
        "learningObjectives": ["..."],
        "estimatedMinutes": 30
      },
      {
        "level": "Mastery",
        "topics": ["..."],
        "description": "...",
        "learningObjectives": ["..."],
        "estimatedMinutes": 20
      }
    ]
  }
}

Rules:
- Each stage should have 3-5 specific topics relevant to "${skillTitle}"
- Each stage should have 2-4 clear, measurable learning objectives
- Topics should progressively increase in complexity
- Foundation: Core concepts, terminology, basic understanding
- Developing: Applying basics, simple problem-solving, building on fundamentals
- Proficient: Intermediate techniques, real-world applications, connecting concepts
- Advanced: Complex scenarios, optimization, edge cases, deeper theory
- Mastery: Expert-level synthesis, teaching others, creative application, innovation
- Estimated minutes should be realistic for each stage
- Make all content specific to "${skillTitle}", not generic`;

        const result = await generateWithFallback({
            prompt,
            systemPrompt,
            schema: true,
            temperature: 0.6,
            maxTokens: 3000,
        });

        const cleaned = cleanJsonResponse(result.text);
        const parsed = JSON.parse(cleaned);

        // Validate structure
        if (!parsed.curriculum || !parsed.curriculum.stages || !Array.isArray(parsed.curriculum.stages)) {
            throw new Error('Invalid curriculum structure returned by AI');
        }

        return NextResponse.json(parsed);
    } catch (error: any) {
        console.error('[SKILL-CURRICULUM] Generation failed:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate curriculum' },
            { status: 500 }
        );
    }
}
