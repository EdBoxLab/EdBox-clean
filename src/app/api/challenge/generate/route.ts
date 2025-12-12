import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Challenge, EngineType } from '@/lib/courseCreation/types';
import { generateWithRetry } from '@/lib/ai-providers';

export async function POST(request: NextRequest) {
    try {
        const { skillId, skillTitle, engine, context, difficulty } = await request.json();

        if (!skillId) return NextResponse.json({ error: "Skill ID is required" }, { status: 400 });

        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        console.log(`Generating challenge for skill: ${skillTitle} (${engine})`);

        const systemPrompt = `You are an expert tutor in ${engine || "general skills"}.
    Create a "Just-In-Time" challenge for the user to practice the skill: "${skillTitle}".
    
    Context: ${context || "User is learning by doing."}
    Difficulty: ${difficulty || "Medium"}
    
    Output JSON format matching 'Challenge' interface:
    {
      "id": "generated_uuid",
      "skillId": "${skillId}",
      "title": "Engaging Challenge Title",
      "description": "Clear instructions on what to do.",
      "engine": "${engine || "Default"}",
      "difficulty": "${difficulty || "Medium"}",
      "starterCode": "Initial code or template if applicable (escape properly)",
      "validationCriteria": [
        { "type": "ai_eval", "rubric": "Did the user demonstrate X?" }
      ],
      "hints": ["Hint 1", "Hint 2"],
      "explanation": "Brief concept explanation"
    }
    `;

        const result = await generateWithRetry({
            prompt: systemPrompt,
            systemPrompt: '',
            schema: {},
            temperature: 0.9,
            maxTokens: 2000,
        });

        const challengeData = JSON.parse(result.text);

        return NextResponse.json({ success: true, challenge: challengeData });

    } catch (error: any) {
        console.error("Challenge Generation Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate challenge" },
            { status: 500 }
        );
    }
}