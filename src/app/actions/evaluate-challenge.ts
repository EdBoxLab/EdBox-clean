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
    // Extra fields for other engines
    score?: number;
    strengths?: string[];
    improvements?: string[];
    corrections?: string[];
    steps?: Array<{ step: string; explanation: string; correct: boolean }>;
    nextSteps?: string;
}

export async function evaluateChallenge(
    input: string,
    challengeTitle: string,
    challengeDescription: string,
    validationCriteria: any[],
    type: 'code' | 'writing' | 'math' | 'language' = 'code'
): Promise<EvaluationResult> {
    try {
        let systemPrompt = '';
        let userPrompt = '';

        switch (type) {
            case 'code':
                systemPrompt = `You are a code evaluation assistant. Evaluate the provided code against the challenge requirements.

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
                userPrompt = `Evaluate this code:\n\n\`\`\`javascript\n${input}\n\`\`\`\n\nCheck if it meets the challenge requirements provide detailed feedback.`;
                break;

            case 'writing':
                systemPrompt = `You are a writing evaluation assistant. Evaluate the provided writing against the challenge requirements.

Challenge: ${challengeTitle}
Description: ${challengeDescription}
Validation Criteria: ${JSON.stringify(validationCriteria)}

Analyze the writing and return a JSON response with:
{
  "success": boolean,
  "feedback": "detailed constructive feedback on the writing",
  "strengths": ["list of strengths"],
  "improvements": ["list of areas for improvement"],
  "score": number (1-10)
}

Provide thorough, constructive feedback that helps the writer improve.`;
                userPrompt = `Evaluate this writing:\n\n"${input}"\n\nCheck if it meets the challenge requirements and provide detailed feedback.`;
                break;

            case 'math':
                systemPrompt = `You are a mathematics evaluation assistant. Evaluate the provided mathematical solution against the challenge requirements.

Challenge: ${challengeTitle}
Description: ${challengeDescription}
Validation Criteria: ${JSON.stringify(validationCriteria)}

Analyze the mathematical work and return a JSON response with:
{
  "success": boolean,
  "feedback": "detailed feedback on the mathematical solution",
  "correctAnswer": "the correct answer if different",
  "steps": [
    {"step": "step description", "explanation": "why this step is correct/incorrect", "correct": boolean}
  ],
  "score": number (1-10)
}

Focus on mathematical accuracy, proper methodology, and clear reasoning.`;
                userPrompt = `Evaluate this mathematical solution:\n\n${input}\n\nCheck if the solution is mathematically correct and provide detailed feedback.`;
                break;

            case 'language':
                systemPrompt = `You are a language learning evaluation assistant. Evaluate the provided language response against the challenge requirements.

Challenge: ${challengeTitle}
Description: ${challengeDescription}
Validation Criteria: ${JSON.stringify(validationCriteria)}

Analyze the language response and return a JSON response with:
{
  "success": boolean,
  "feedback": "detailed feedback on grammar, vocabulary, and fluency",
  "corrections": ["list of corrections if needed"],
  "strengths": ["what the learner did well"],
  "score": number (1-10),
  "nextSteps": "suggestions for improvement"
}

Focus on constructive feedback that helps language learning progress.`;
                userPrompt = `Evaluate this language learning response:\n\n"${input}"\n\nProvide detailed feedback on grammar, vocabulary usage, and overall communication effectiveness.`;
                break;
        }

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
                isSuccess: result.success === true || (typeof result.score === 'number' && result.score >= 7),
                feedback: result.feedback || '',
                score: result.score,
                strengths: result.strengths,
                improvements: result.improvements,
                corrections: result.corrections,
                steps: result.steps,
                nextSteps: result.nextSteps
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
