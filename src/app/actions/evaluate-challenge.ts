'use server';

import { callGroq } from '@/lib/courseCreation/engines/shared/groqService';
import { z } from 'zod';

// ============================================
// SCHEMA VALIDATION (Forces Structured Output)
// ============================================

const TestResultSchema = z.object({
  test: z.string(),
  passed: z.boolean(),
  message: z.string(),
});

const MathStepSchema = z.object({
  step: z.string(),
  explanation: z.string(),
  correct: z.boolean(),
});

const EvaluationSchema = z.object({
  success: z.boolean(),
  output: z.string().optional(),
  testResults: z.array(TestResultSchema).optional(),
  feedback: z.string().min(20, 'Feedback too brief'),
  score: z.number().min(0).max(10).optional(),
  strengths: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
  corrections: z.array(z.string()).optional(),
  steps: z.array(MathStepSchema).optional(),
  nextSteps: z.string().optional(),
});

// ============================================
// TYPES
// ============================================

export interface EvaluationResult {
  success: boolean;
  output: string;
  testResults: Array<{ test: string; passed: boolean; message: string }>;
  isComplete: boolean;
  isSuccess: boolean;
  feedback: string;
  error?: string;
  score?: number;
  strengths?: string[];
  improvements?: string[];
  corrections?: string[];
  steps?: Array<{ step: string; explanation: string; correct: boolean }>;
  nextSteps?: string;
}

type ChallengeType = 'code' | 'writing' | 'math' | 'language';

// ============================================
// EVALUATION TEMPLATES BY TYPE
// ============================================

const EVALUATION_TEMPLATES = {
  code: {
    systemPrompt: (title: string, description: string, criteria: any[]) => `You are an expert code reviewer and educator.

CHALLENGE: ${title}
DESCRIPTION: ${description}
VALIDATION CRITERIA: ${JSON.stringify(criteria, null, 2)}

Your job: Evaluate the user's code thoroughly and provide educational feedback.

EVALUATION CHECKLIST:
✓ Does the code run without errors?
✓ Does it meet all validation criteria?
✓ Is the logic correct?
✓ Are edge cases handled?
✓ Is the code readable and well-structured?

YOU MUST RESPOND WITH ONLY VALID JSON IN THIS EXACT FORMAT:
{
  "success": true or false,
  "output": "What happens when this code runs (or error message)",
  "testResults": [
    {
      "test": "Specific test case description",
      "passed": true or false,
      "message": "Why it passed/failed"
    }
  ],
  "feedback": "Detailed, encouraging feedback (150-300 words). Start with positives, then areas for improvement.",
  "score": 7,
  "strengths": ["What the user did well"],
  "improvements": ["Specific suggestions for improvement"],
  "nextSteps": "What to learn or try next"
}

CRITICAL RULES:
- Always provide constructive, encouraging feedback
- Be specific about what works and what doesn't
- Include at least 2 test results
- Score: 8-10 = excellent, 6-7 = good, 4-5 = needs work, 1-3 = significant issues
- Never say "I can't evaluate" - always try to assess what's there
- Output ONLY the JSON object, no other text`,

    userPrompt: (input: string) => `Evaluate this code submission:

\`\`\`javascript
${input}
\`\`\`

Provide a thorough evaluation following the JSON format specified.`,
  },

  writing: {
    systemPrompt: (title: string, description: string, criteria: any[]) => `You are an expert writing coach and educator.

CHALLENGE: ${title}
DESCRIPTION: ${description}
VALIDATION CRITERIA: ${JSON.stringify(criteria, null, 2)}

Your job: Evaluate the writing quality and provide constructive feedback.

EVALUATION CHECKLIST:
✓ Does it meet the prompt requirements?
✓ Is the content clear and well-organized?
✓ Is the grammar and spelling correct?
✓ Is the tone appropriate?
✓ Is the writing engaging?

YOU MUST RESPOND WITH ONLY VALID JSON IN THIS EXACT FORMAT:
{
  "success": true or false,
  "feedback": "Detailed, encouraging feedback (200-400 words). Balance positives with constructive criticism.",
  "score": 7,
  "strengths": [
    "Specific strength 1",
    "Specific strength 2"
  ],
  "improvements": [
    "Specific improvement 1 with example",
    "Specific improvement 2 with example"
  ],
  "corrections": [
    "Grammar/spelling correction if needed"
  ],
  "nextSteps": "Suggestions for next writing challenge or skill to develop"
}

CRITICAL RULES:
- Always start with positives (sandwich method)
- Be specific with examples from their writing
- Provide actionable improvements, not vague advice
- Score: 8-10 = excellent, 6-7 = good, 4-5 = needs work, 1-3 = significant issues
- Output ONLY the JSON object, no other text`,

    userPrompt: (input: string) => `Evaluate this writing submission:

"${input}"

Provide a thorough evaluation following the JSON format specified.`,
  },

  math: {
    systemPrompt: (title: string, description: string, criteria: any[]) => `You are an expert mathematics tutor.

CHALLENGE: ${title}
DESCRIPTION: ${description}
VALIDATION CRITERIA: ${JSON.stringify(criteria, null, 2)}

Your job: Evaluate the mathematical solution and explain what's right/wrong.

EVALUATION CHECKLIST:
✓ Is the final answer correct?
✓ Is the methodology sound?
✓ Are the steps logical?
✓ Are calculations accurate?
✓ Is the work clearly shown?

YOU MUST RESPOND WITH ONLY VALID JSON IN THIS EXACT FORMAT:
{
  "success": true or false,
  "feedback": "Clear explanation of the solution's correctness (150-300 words)",
  "score": 7,
  "steps": [
    {
      "step": "What the student did in this step",
      "explanation": "Why this step is correct or what's wrong",
      "correct": true or false
    }
  ],
  "corrections": [
    "If answer is wrong, show correct approach"
  ],
  "nextSteps": "Related concepts to practice or master"
}

CRITICAL RULES:
- Identify exactly where errors occur (if any)
- Explain WHY something is wrong, not just that it's wrong
- If correct, explain why the approach works
- Provide step-by-step analysis
- Score: 8-10 = excellent, 6-7 = good, 4-5 = needs work, 1-3 = incorrect
- Output ONLY the JSON object, no other text`,

    userPrompt: (input: string) => `Evaluate this mathematical solution:

${input}

Provide a thorough evaluation following the JSON format specified.`,
  },

  language: {
    systemPrompt: (title: string, description: string, criteria: any[]) => `You are an expert language learning tutor.

CHALLENGE: ${title}
DESCRIPTION: ${description}
VALIDATION CRITERIA: ${JSON.stringify(criteria, null, 2)}

Your job: Evaluate language usage and provide encouraging feedback.

EVALUATION CHECKLIST:
✓ Grammar correctness
✓ Vocabulary appropriateness
✓ Sentence structure
✓ Natural fluency
✓ Cultural appropriateness

YOU MUST RESPOND WITH ONLY VALID JSON IN THIS EXACT FORMAT:
{
  "success": true or false,
  "feedback": "Encouraging feedback on language use (150-300 words)",
  "score": 7,
  "strengths": [
    "What they did well in the target language"
  ],
  "corrections": [
    "WRONG: [their text] → CORRECT: [corrected text] (Explanation)",
    "Example: WRONG: 'I am have 5 years' → CORRECT: 'I am 5 years old' (Age uses 'am' + number + 'years old')"
  ],
  "improvements": [
    "Specific language patterns to practice"
  ],
  "nextSteps": "Suggested topics or grammar points to learn next"
}

CRITICAL RULES:
- Always be encouraging (language learning is hard!)
- Provide corrections in "WRONG → CORRECT" format
- Explain WHY corrections are needed
- Praise correct usage even if there are errors
- Score: 8-10 = near fluent, 6-7 = communicative, 4-5 = comprehensible, 1-3 = needs work
- Output ONLY the JSON object, no other text`,

    userPrompt: (input: string) => `Evaluate this language learning response:

"${input}"

Provide a thorough evaluation following the JSON format specified.`,
  },
};

// ============================================
// FALLBACK EVALUATIONS (When AI Fails)
// ============================================

const FALLBACK_EVALUATIONS: Record<ChallengeType, EvaluationResult> = {
  code: {
    success: false,
    output: 'Unable to execute code at this time.',
    testResults: [
      {
        test: 'Code execution',
        passed: false,
        message: 'Evaluation system temporarily unavailable. Your code has been saved.',
      },
    ],
    isComplete: true,
    isSuccess: false,
    feedback: "We're having trouble evaluating your code right now. Please try submitting again, or save your work and come back in a moment. Your progress is saved!",
    score: 5,
    improvements: ['Try submitting again in a moment'],
  },

  writing: {
    success: false,
    output: '',
    testResults: [],
    isComplete: true,
    isSuccess: false,
    feedback: "We couldn't evaluate your writing at this moment. Your work is saved! Please try submitting again. In the meantime, you can review your response and make any improvements you'd like.",
    score: 5,
    strengths: ['Your effort in completing the challenge'],
    improvements: ['Try submitting again for detailed feedback'],
  },

  math: {
    success: false,
    output: '',
    testResults: [],
    isComplete: true,
    isSuccess: false,
    feedback: "We're temporarily unable to check your math solution. Your work is saved! Please try resubmitting. While you wait, double-check your calculations and steps.",
    score: 5,
    nextSteps: 'Try submitting again in a moment',
  },

  language: {
    success: false,
    output: '',
    testResults: [],
    isComplete: true,
    isSuccess: false,
    feedback: "We couldn't evaluate your language response right now. Your work is saved! Please try again. Keep practicing in the meantime!",
    score: 5,
    strengths: ['Attempting to use the target language'],
    improvements: ['Try submitting again for personalized feedback'],
  },
};

// ============================================
// MAIN EVALUATION FUNCTION WITH RETRY
// ============================================

export async function evaluateChallenge(
  input: string,
  challengeTitle: string,
  challengeDescription: string,
  validationCriteria: any[],
  type: ChallengeType = 'code'
): Promise<EvaluationResult> {
  // Validate input
  if (!input || input.trim().length === 0) {
    return {
      success: false,
      output: '',
      testResults: [],
      isComplete: false,
      isSuccess: false,
      feedback: 'Please provide a solution before submitting.',
      error: 'Empty input',
    };
  }

  const maxAttempts = 2; // Reduced for faster UX
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🎯 Evaluating ${type} challenge (attempt ${attempt}/${maxAttempts})`);

      // Get template
      const template = EVALUATION_TEMPLATES[type];

      // Build prompts
      const systemPrompt = template.systemPrompt(
        challengeTitle,
        challengeDescription,
        validationCriteria
      );
      const userPrompt = template.userPrompt(input);

      // Call AI
      const response = await callGroq(systemPrompt, userPrompt);

      // Clean response
      let cleanedResponse = response.trim();
      cleanedResponse = cleanedResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

      // Extract JSON if there's extra text
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      }

      // Parse JSON
      let rawData: any;
      try {
        rawData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error(`❌ JSON parse error (attempt ${attempt}):`, parseError);
        console.error('First 200 chars:', cleanedResponse.substring(0, 200));

        // Try regex extraction as last resort
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          rawData = JSON.parse(jsonMatch[0]);
          console.log('✅ Recovered JSON via regex');
        } else {
          throw new Error('Invalid JSON format from AI');
        }
      }

      // Validate with Zod
      const validationResult = EvaluationSchema.safeParse(rawData);

      if (!validationResult.success) {
        console.warn('⚠️ Schema validation failed:', validationResult.error.issues);

        // Try to fix common issues
        rawData.feedback = rawData.feedback || 'Evaluation completed.';
        rawData.success = rawData.success === true;

        // Retry validation
        const retryValidation = EvaluationSchema.safeParse(rawData);
        if (!retryValidation.success) {
          throw new Error('AI output quality too low');
        }
      }

      const validated = validationResult.success ? validationResult.data : rawData;

      // Build result
      const result: EvaluationResult = {
        success: validated.success,
        output: validated.output || '',
        testResults: validated.testResults || [],
        isComplete: true,
        isSuccess: validated.success || (validated.score !== undefined && validated.score >= 7),
        feedback: validated.feedback,
        score: validated.score,
        strengths: validated.strengths,
        improvements: validated.improvements,
        corrections: validated.corrections,
        steps: validated.steps,
        nextSteps: validated.nextSteps,
      };

      console.log(`✅ Evaluation successful (score: ${result.score || 'N/A'})`);
      return result;

    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Evaluation attempt ${attempt} failed:`, error);

      if (attempt < maxAttempts) {
        console.log(`⏳ Retrying evaluation...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  // All attempts failed - return graceful fallback
  console.error('❌ All evaluation attempts failed:', lastError);
  
  const fallback = FALLBACK_EVALUATIONS[type];
  
  return {
    ...fallback,
    error: 'Evaluation temporarily unavailable. Please try again.',
  };
}

// ============================================
// BULK EVALUATION (For Multiple Submissions)
// ============================================

export async function evaluateMultiple(
  submissions: Array<{
    input: string;
    challengeTitle: string;
    challengeDescription: string;
    validationCriteria: any[];
    type: ChallengeType;
  }>
): Promise<EvaluationResult[]> {
  const results = await Promise.allSettled(
    submissions.map(sub =>
      evaluateChallenge(
        sub.input,
        sub.challengeTitle,
        sub.challengeDescription,
        sub.validationCriteria,
        sub.type
      )
    )
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`Bulk evaluation failed for submission ${index}:`, result.reason);
      return FALLBACK_EVALUATIONS[submissions[index].type];
    }
  });
}