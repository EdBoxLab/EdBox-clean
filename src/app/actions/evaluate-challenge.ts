'use server';

import { callGroq } from '@/lib/courseCreation/engines/shared/groqService';

export interface EvaluationResult {
    success: boolean;
    output: string;
    testResults: Array<{ test: string; passed: boolean; message: string }>;
    isComplete: boolean;
    isSuccess: boolean;
    feedback?: string;
    error?: string;
}

export async function evaluateChallenge(
    code: string,
    challengeTitle: string,
    challengeDescription: string,
    validationCriteria: any[]
): Promise<EvaluationResult> {
    try {
        const systemPrompt = `You are a code evaluation assistant. Evaluate the provided code against the challenge requirements.

Challenge: ${challengeTitle}
Description: ${challengeDescription}
Validation Criteria: ${JSON.stringify(validationCriteria)}

Analyze the code and return a JSON response with:
{
  "success": boolean,
  "output": "execution output or error message",
  "testResults": [
    {"test": "test description", "passed": boolean, "message": "result message"}
  ],
  "feedback": "constructive feedback"
}

Be thorough in your evaluation and provide helpful feedback.`;

        const userPrompt = `Evaluate this code:

\`\`\`javascript
${code}
\`\`\`

Check if it meets the challenge requirements and provide detailed feedback.`;

        const response = await callGroq(systemPrompt, userPrompt);

        try {
            // Clean up the response if it contains markdown code blocks
            const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const result = JSON.parse(cleanedResponse);

            return {
                success: result.success === true, // Ensure boolean
                output: result.output || '', // Ensure string
                testResults: Array.isArray(result.testResults) ? result.testResults : [],
                isComplete: true,
                isSuccess: result.success === true,
                feedback: result.feedback || ''
            };
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError, 'Response:', response);
            // Fallback: If we can't parse JSON, treat the whole text as feedback/output, 
            // but try to avoid showing raw JSON structure if possible.

            // Check if it looks like the model refused or failed
            const isFailure = response.toLowerCase().includes('error') || response.toLowerCase().includes('fail');

            return {
                success: !isFailure,
                output: "The AI assessment couldn't be parsed correctly. Below is the raw response:\n\n" + response,
                testResults: [],
                isComplete: true,
                isSuccess: !isFailure,
                feedback: "Format error in AI response."
            };
        }

    } catch (error: any) {
        console.error('Evaluation Error:', error);
        return {
            success: false,
            output: `Error: ${error.message || 'Unknown error'}`,
            testResults: [],
            isComplete: true,
            isSuccess: false,
            error: error.message
        };
    }
}
