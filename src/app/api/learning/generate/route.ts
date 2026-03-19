import { NextRequest, NextResponse } from 'next/server';
import { generateWithFallback, cleanJsonResponse } from '@/lib/ai-providers';

export async function POST(request: NextRequest) {
    try {
        const { skillId, skillTitle, skillDescription, engine, level } = await request.json();

        if (!skillId || !skillTitle) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const userPrompt = `You are an expert educator creating learning content for: "${skillTitle}"

Description: ${skillDescription}
Engine: ${engine}
Level: ${level}

Create comprehensive learning content that teaches this skill BEFORE the user attempts challenges.

Structure:
1. **Introduction** (2-3 sentences): Why this skill matters
2. **Core Concepts** (3-5 key points): What they need to know
3. **Examples** (2-3 practical examples): Show how it works
4. **Common Pitfalls** (2-3 mistakes to avoid): What NOT to do
5. **Quick Tips** (3-5 actionable tips): Best practices

Make it:
- Conversational and engaging
- Practical with real examples
- Easy to understand for ${level} learners
- Focused on hands-on application

Return ONLY valid JSON (no markdown):
{
  "introduction": "Why this matters...",
  "concepts": [
    {"title": "Concept 1", "explanation": "..."},
    {"title": "Concept 2", "explanation": "..."}
  ],
  "examples": [
    {"title": "Example 1", "code": "...", "explanation": "..."}
  ],
  "pitfalls": ["Mistake 1: ...", "Mistake 2: ..."],
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "estimatedReadTime": 5
}`;

        const result = await generateWithFallback({
            prompt: userPrompt,
            systemPrompt: 'You are a JSON-only API. Return valid JSON without markdown formatting.',
            schema: true,
            temperature: 0.7,
            maxTokens: 3000,
        });

        const cleanedText = cleanJsonResponse(result.text);
        const learningContent = JSON.parse(cleanedText);

        return NextResponse.json({
            success: true,
            content: {
                id: `learn_${Date.now()}`,
                skillId,
                skillTitle,
                ...learningContent,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error: any) {
        console.error('Learning Content Generation Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate learning content' },
            { status: 500 }
        );
    }
}
