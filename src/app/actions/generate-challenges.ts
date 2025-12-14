'use server';

import { callGroq } from '@/lib/courseCreation/engines/shared/groqService';
import { Challenge } from '@/lib/courseCreation/types';

export interface ChallengeBatch {
    explanation: string;
    challenges: Challenge[];
    nextSteps?: string;
}

export async function generateChallengeBatch(
    skillId: string,
    skillTitle: string,
    engine: string,
    count: number = 5,
    difficulty: string = 'Medium'
): Promise<ChallengeBatch> {
    // Validate inputs
    if (!skillId || !skillTitle || !engine) {
        console.error('Invalid parameters:', { skillId, skillTitle, engine });
        throw new Error('Missing required parameters for challenge generation');
    }

    try {
        const systemPrompt = `You are an expert curriculum designer and technical tutor.
Create a complete learning module for the skill: "${skillTitle}".
Target Engine: "${engine}" (The interactive environment where the user practices).

CRITICAL: Your response must be ONLY valid JSON. No explanatory text before or after.

Structure:
1. Conceptual Explanation: A clear, engaging introduction to the concept
2. ${count} Progressive Challenges:
   - Challenge 1: Introduction/Easy (Guided, scaffolding provided)
   - Challenge 2-3: Intermediate (Practice, less hand-holding)  
   - Challenge 4-5: Advanced/Mastery (Complex, requires synthesis)

Required JSON format (respond with ONLY this JSON, no other text):
{
  "explanation": "Clear explanation of ${skillTitle} concept with practical examples. For language learning, include alphabet, pronunciation guides, and cultural context.",
  "challenges": [
    {
      "title": "Challenge Title",
      "description": "Clear step-by-step instructions. For language challenges, include pronunciation guides, alphabet practice, or conversation scenarios.",
      "difficulty": "Easy",
      "starterCode": "// Starting code if applicable, or example phrases for language learning",
      "validationCriteria": [
        { "type": "ai_eval", "rubric": "Specific success criteria including pronunciation, grammar, or vocabulary usage" }
      ],
      "hints": ["Helpful hint 1", "Helpful hint 2"],
      "estimatedMinutes": 10,
      "xpReward": 100,
      "explanation": "What this challenge teaches"
    }
  ]
}

IMPORTANT: 
- difficulty must be exactly "Easy", "Medium", or "Hard"
- estimatedMinutes must be a number
- xpReward must be a number
- All string fields must be properly escaped for JSON
- Do not include any text outside the JSON object`;

        const userPrompt = `Generate a ${count}-step learning path for ${skillTitle} in ${engine}.`;

        const response = await callGroq(systemPrompt, userPrompt);

        // More aggressive cleaning of the response
        let cleanedResponse = response.trim();
        
        // Remove markdown code blocks
        cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Remove any leading text before the JSON
        const jsonStart = cleanedResponse.indexOf('{');
        if (jsonStart > 0) {
            cleanedResponse = cleanedResponse.substring(jsonStart);
        }
        
        // Remove any trailing text after the JSON
        const jsonEnd = cleanedResponse.lastIndexOf('}');
        if (jsonEnd > 0 && jsonEnd < cleanedResponse.length - 1) {
            cleanedResponse = cleanedResponse.substring(0, jsonEnd + 1);
        }

        console.log('Attempting to parse JSON response for skill:', skillTitle);
        console.log('Cleaned response length:', cleanedResponse.length);

        let data;
        try {
            data = JSON.parse(cleanedResponse);
            console.log('Successfully parsed JSON with', data.challenges?.length || 0, 'challenges');
        } catch (e) {
            console.error("Failed to parse generation response for skill:", skillTitle);
            console.error("Raw response (first 500 chars):", response.substring(0, 500));
            console.error("Cleaned response (first 500 chars):", cleanedResponse.substring(0, 500));
            console.error("Parse error:", e);
            
            // Try to extract JSON from a malformed response
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    data = JSON.parse(jsonMatch[0]);
                    console.log('Recovered JSON from malformed response');
                } catch (recoveryError) {
                    throw new Error(`Invalid AI response format: ${e instanceof Error ? e.message : 'Unknown parsing error'}`);
                }
            } else {
                throw new Error(`Invalid AI response format: No JSON found in response`);
            }
        }

        // Validate the parsed data structure
        if (!data || typeof data !== 'object') {
            throw new Error('Response is not a valid object');
        }

        if (!data.explanation || typeof data.explanation !== 'string') {
            console.warn('Missing or invalid explanation in response');
            data.explanation = `Learn about ${skillTitle} through hands-on practice.`;
        }

        if (!Array.isArray(data.challenges)) {
            console.warn('Missing or invalid challenges array in response');
            data.challenges = [];
        }

        // Map to strictly typed Challenge objects with validation
        const challenges: Challenge[] = data.challenges.map((c: any, index: number) => {
            // Validate each challenge object
            if (!c || typeof c !== 'object') {
                console.warn(`Invalid challenge object at index ${index}`);
                c = {};
            }

            return {
                id: `gen_${skillId}_${Date.now()}_${index}`,
                skillId: skillId,
                title: (typeof c.title === 'string' && c.title.trim()) ? c.title.trim() : `Challenge ${index + 1}`,
                description: (typeof c.description === 'string' && c.description.trim()) ? c.description.trim() : "Solve the problem.",
                engine: engine,
                difficulty: (['Easy', 'Medium', 'Hard'].includes(c.difficulty)) ? c.difficulty : (index < 1 ? 'Easy' : index > 3 ? 'Hard' : 'Medium'),
                estimatedMinutes: (typeof c.estimatedMinutes === 'number' && c.estimatedMinutes > 0) ? c.estimatedMinutes : 15,
                xpReward: (typeof c.xpReward === 'number' && c.xpReward > 0) ? c.xpReward : 100,
                starterCode: (typeof c.starterCode === 'string') ? c.starterCode : '',
                validationCriteria: Array.isArray(c.validationCriteria) && c.validationCriteria.length > 0 
                    ? c.validationCriteria 
                    : [{ type: 'ai_eval', rubric: 'Complete the task successfully.' }],
                hints: Array.isArray(c.hints) ? c.hints.filter((h: any) => typeof h === 'string') : [],
                explanation: (typeof c.explanation === 'string') ? c.explanation : '',
                context: data.explanation // Store context if needed
            };
        });

        const result: ChallengeBatch = {
            explanation: data.explanation || `Learn about ${skillTitle} through hands-on practice.`,
            challenges: challenges,
            nextSteps: data.nextSteps
        };

        console.log('Generated challenge batch for', skillTitle, ':', {
            explanationLength: result.explanation.length,
            challengeCount: result.challenges.length,
            challengeTitles: result.challenges.map(c => c.title)
        });

        return result;

    } catch (error) {
        console.error("Batch Generation Error", error);
        // Fallback: return empty batch rather than crashing to allow UI to handle it (e.g. retry)
        return {
            explanation: "We encountered an issue generating content. Please try again.",
            challenges: []
        };
    }
}
