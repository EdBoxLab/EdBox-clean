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
    try {
        const systemPrompt = `You are an expert curriculum designer and technical tutor.
    Create a complete learning module for the skill: "${skillTitle}".
    Target Engine: "${engine}" (The interactive environment where the user practices).
    
    Structure:
    1. Conceptual Explanation: A clear, engaging, and in-depth introduction to the concept. Markdown supported.
    2. ${count} Progressive Challenges:
       - Challenge 1: Introduction/Easy (Guided, scaffolding provided)
       - Challenge 2-3: Intermediate (Practice, less hand-holding)
       - Challenge 4-5: Advanced/Mastery (Complex, requires synthesis)
       
    Output MUST be valid JSON (no markdown in the response structure itself) with this shape:
    {
      "explanation": "Markdown text explaining the concept...",
      "challenges": [
        {
          "title": "Challenge Title",
          "description": "Clear instructions...",
          "difficulty": "Easy" | "Medium" | "Hard",
          "starterCode": "...",
          "validationCriteria": [
            { "type": "ai_eval", "rubric": "..." }
          ],
          "hints": ["Hint 1", "Hint 2"],
          "estimatedMinutes": 10,
          "xpReward": 100,
          "explanation": "Brief recap of what this challenge teaches"
        }
      ]
    }
    
    Ensure strict JSON validity. Do not wrap the JSON in code blocks.`;

        const userPrompt = `Generate a ${count}-step learning path for ${skillTitle} in ${engine}.`;

        const response = await callGroq(systemPrompt, userPrompt);

        // Clean up response
        const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let data;
        try {
            data = JSON.parse(cleanedResponse);
        } catch (e) {
            console.error("Failed to parse generation response:", cleanedResponse);
            throw new Error("Invalid AI response format");
        }

        // Map to strictly typed Challenge objects
        const challenges: Challenge[] = (data.challenges || []).map((c: any, index: number) => ({
            id: `gen_${skillId}_${Date.now()}_${index}`,
            skillId: skillId,
            title: c.title || `Challenge ${index + 1}`,
            description: c.description || "Solve the problem.",
            engine: engine,
            difficulty: c.difficulty || (index < 1 ? 'Easy' : index > 3 ? 'Hard' : 'Medium'),
            estimatedMinutes: c.estimatedMinutes || 15,
            xpReward: c.xpReward || 100,
            starterCode: c.starterCode || '',
            validationCriteria: c.validationCriteria || [{ type: 'ai_eval', rubric: 'Complete the task successfully.' }],
            hints: c.hints || [],
            explanation: c.explanation || '',
            context: data.explanation // Store context if needed
        }));

        return {
            explanation: data.explanation || "No explanation provided.",
            challenges: challenges,
            nextSteps: data.nextSteps
        };

    } catch (error) {
        console.error("Batch Generation Error", error);
        // Fallback: return empty batch rather than crashing to allow UI to handle it (e.g. retry)
        return {
            explanation: "We encountered an issue generating content. Please try again.",
            challenges: []
        };
    }
}
