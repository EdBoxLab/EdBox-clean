import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// ============= API KEY MANAGEMENT =============
const GROQ_API_KEYS = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

const getApiKey = () => {
    const key = GROQ_API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % GROQ_API_KEYS.length;
    return key;
};

// ============= ADAPTIVE DIFFICULTY LOGIC =============

export async function POST(request: NextRequest) {
    try {
        const { skillId, userMastery, previousAttempts, skillTitle, engine } = await request.json();

        if (!skillId || userMastery === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const apiKey = getApiKey();
        if (!apiKey) throw new Error("No Groq API Key provided");

        const groq = new Groq({ apiKey });

        // Determine difficulty based on mastery and attempts
        let difficulty: 'Easy' | 'Medium' | 'Hard';
        let hints = 3;

        if (userMastery < 0.3) {
            difficulty = 'Easy';
            hints = 5;
        } else if (userMastery < 0.6) {
            difficulty = 'Medium';
            hints = 3;
        } else {
            difficulty = 'Hard';
            hints = 1;
        }

        // If user failed multiple times, make it easier
        if (previousAttempts && previousAttempts.length > 2) {
            const recentFailures = previousAttempts.slice(-3).filter((a: any) => !a.success).length;
            if (recentFailures >= 2) {
                difficulty = userMastery < 0.5 ? 'Easy' : 'Medium';
                hints = 5;
            }
        }

        const systemPrompt = `You are a challenge generator for an adaptive learning system.
        
Skill: "${skillTitle}"
Engine: ${engine}
Current User Mastery: ${(userMastery * 100).toFixed(0)}%
Difficulty Level: ${difficulty}
Hints Available: ${hints}

Generate a ${difficulty} challenge that:
- Matches the user's current skill level
- ${difficulty === 'Easy' ? 'Provides clear guidance and scaffolding' : difficulty === 'Medium' ? 'Requires some problem-solving' : 'Challenges the user significantly'}
- Includes ${hints} progressive hints
- Has clear validation criteria

Return ONLY valid JSON (no markdown):
{
  "title": "Challenge title",
  "description": "What the user needs to do",
  "starterCode": "Initial code/content (if applicable)",
  "hints": ["hint1", "hint2", ...],
  "validationCriteria": [{"type": "ai_eval", "rubric": "What to check"}],
  "explanation": "Why this challenge matters",
  "difficulty": "${difficulty}"
}`;

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are a JSON-only API. Return valid JSON without markdown formatting.' },
                { role: 'user', content: systemPrompt }
            ],
            temperature: 0.8,
            max_tokens: 2000,
        });

        const text = response.choices[0]?.message?.content || "{}";
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const challenge = JSON.parse(cleanedText);

        return NextResponse.json({
            success: true,
            challenge: {
                id: `adaptive_${Date.now()}`,
                skillId,
                ...challenge,
                engine,
                adaptiveMetadata: {
                    userMastery,
                    difficulty,
                    hintsProvided: hints,
                    generatedAt: new Date().toISOString()
                }
            }
        });

    } catch (error: any) {
        console.error('Adaptive Challenge Generation Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate adaptive challenge' },
            { status: 500 }
        );
    }
}
