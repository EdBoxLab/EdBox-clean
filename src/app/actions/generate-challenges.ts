'use server';

import { callGroq } from '@/lib/courseCreation/engines/shared/groqService';
import { Challenge } from '@/lib/courseCreation/types';
import { z } from 'zod';

// ============================================
// SCHEMA VALIDATION (Forces AI to comply)
// ============================================

const ValidationCriteriaSchema = z.object({
  type: z.enum(['ai_eval', 'test_case', 'output_match', 'code_quality']),
  rubric: z.string().min(10, 'Rubric must be specific'),
  weight: z.number().min(0).max(1).optional(),
});

const ChallengeSchema = z.object({
  title: z.string().min(10, 'Title too short').max(100, 'Title too long'),
  description: z.string().min(50, 'Description too vague').max(800, 'Description too long'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  starterCode: z.string().optional(),
  validationCriteria: z.array(ValidationCriteriaSchema).min(1),
  hints: z.array(z.string().min(5)).min(2, 'Need at least 2 hints').max(5, 'Too many hints'),
  estimatedMinutes: z.number().min(5).max(120),
  xpReward: z.number().min(50).max(500),
  explanation: z.string().min(50, 'Explanation too brief'),
});

const ChallengeBatchSchema = z.object({
  explanation: z.string().min(100, 'Concept explanation too brief').max(2000),
  challenges: z.array(ChallengeSchema).min(1),
  nextSteps: z.string().optional(),
});

// ============================================
// TYPES
// ============================================

export interface ChallengeBatch {
  explanation: string;
  challenges: Challenge[];
  nextSteps?: string;
}

type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

// ============================================
// ENGINE-SPECIFIC TEMPLATES
// ============================================

const ENGINE_TEMPLATES = {
  coding: {
    context: "This is a practical coding challenge. Focus on real-world scenarios.",
    starterCodeRequired: true,
    exampleDescription: "Build a function that validates email addresses. It should check for: @ symbol, domain name, and valid TLD. Return true/false and an error message if invalid.",
  },
  language: {
    context: "This is a language learning challenge. Include pronunciation guides, cultural context, and practical usage.",
    starterCodeRequired: false,
    exampleDescription: "Practice introducing yourself in Spanish. Learn to say your name, where you're from, and ask someone their name. Include formal and informal variations.",
  },
  design: {
    context: "This is a design challenge. Focus on user needs, constraints, and clear deliverables.",
    starterCodeRequired: false,
    exampleDescription: "Redesign the checkout flow for a mobile e-commerce app. Goal: Reduce cart abandonment. Constraints: 3 screens max, must work offline, accessible to colorblind users.",
  },
  business: {
    context: "This is a business strategy challenge. Include specific metrics, constraints, and decision frameworks.",
    starterCodeRequired: false,
    exampleDescription: "Analyze this SaaS company's pricing strategy. Current: $49/mo with 5% conversion. Propose 3 pricing experiments with projected impact on revenue and user growth.",
  },
  default: {
    context: "This is a hands-on learning challenge. Focus on practical application.",
    starterCodeRequired: false,
    exampleDescription: "Apply this concept to a real scenario with clear success criteria.",
  },
};

// ============================================
// DIFFICULTY PROGRESSION LOGIC
// ============================================

function getDifficultyForIndex(index: number, total: number): DifficultyLevel {
  const position = index / total;
  
  if (position < 0.3) return 'Easy';      // First 30%
  if (position < 0.7) return 'Medium';    // Middle 40%
  return 'Hard';                          // Final 30%
}

function getXPForDifficulty(difficulty: DifficultyLevel, index: number): number {
  const baseXP = {
    Easy: 100,
    Medium: 200,
    Hard: 300,
  };
  
  // Bonus XP for later challenges (mastery bonus)
  const masteryBonus = Math.floor(index * 10);
  
  return baseXP[difficulty] + masteryBonus;
}

function getEstimatedMinutes(difficulty: DifficultyLevel): number {
  return {
    Easy: 10,
    Medium: 20,
    Hard: 35,
  }[difficulty];
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

export async function generateChallengeBatch(
  skillId: string,
  skillTitle: string,
  engine: string,
  count: number = 5,
  difficulty: string = 'Medium'
): Promise<ChallengeBatch> {
  // Validate inputs
  if (!skillId || !skillTitle || !engine) {
    console.error('❌ Invalid parameters:', { skillId, skillTitle, engine });
    throw new Error('Missing required parameters for challenge generation');
  }

  if (count < 1 || count > 10) {
    throw new Error('Challenge count must be between 1 and 10');
  }

  console.log(`🎯 Generating ${count} challenges for: ${skillTitle} (${engine})`);

  try {
    // Get engine-specific template
    const engineKey = engine.toLowerCase();
    const template = ENGINE_TEMPLATES[engineKey as keyof typeof ENGINE_TEMPLATES] 
      || ENGINE_TEMPLATES.default;

    // Build progressive difficulty requirements
    const difficultyBreakdown = Array.from({ length: count }, (_, i) => ({
      index: i + 1,
      difficulty: getDifficultyForIndex(i, count),
      estimatedMinutes: getEstimatedMinutes(getDifficultyForIndex(i, count)),
      xpReward: getXPForDifficulty(getDifficultyForIndex(i, count), i),
    }));

    const systemPrompt = `You are an expert educational content creator specializing in ${engine}.

YOUR MISSION: Create a progressive learning module for "${skillTitle}" with ${count} challenges.

CONTEXT: ${template.context}

PROGRESSION STRUCTURE:
${difficultyBreakdown.map(d => 
  `Challenge ${d.index}: ${d.difficulty} - ~${d.estimatedMinutes} min - ${d.xpReward} XP`
).join('\n')}

QUALITY STANDARDS:

1. CONCEPT EXPLANATION (150-500 words):
   - Start with WHY this skill matters (real-world relevance)
   - Explain the core concept using analogies or examples
   - Preview what the user will learn through the challenges
   - Keep language clear, engaging, and jargon-free
   - and then state the actual challenge

2. CHALLENGE TITLES:
   - Action-oriented verbs (Build, Design, Analyze, Create)
   - Specific outcomes (not "Practice X" but "Build a Password Validator")
   - Intriguing (makes learner want to try it)

3. CHALLENGE DESCRIPTIONS:
   - WHY: One sentence on why this matters
   - WHAT: Specific deliverable or outcome
   - HOW: Clear success criteria
   - EXAMPLE: "${template.exampleDescription}"
   - Length: 100-300 words

4. VALIDATION CRITERIA:
   - Must be measurable or observable
   - Include specific rubric points
   - For coding: Include expected behavior/output
   - For language: Include pronunciation/grammar checks
   - For design: Include user experience metrics

5. HINTS (3-4 hints per challenge):
   - Hint 1: Conceptual nudge (no direct answer)
   - Hint 2: Approach suggestion (methodology)
   - Hint 3: Specific technique or tool
   - Hint 4 (if needed): Near-solution guidance

6. CHALLENGE EXPLANATION:
   - What concept this teaches
   - How it connects to previous challenges
   - Real-world applications
   - Common mistakes to avoid

${template.starterCodeRequired ? `
7. STARTER CODE:
   - Must be valid, runnable code
   - Include helpful comments
   - Use TODO markers for user to complete
   - Provide function signatures/scaffolding
` : ''}

OUTPUT FORMAT:
You MUST respond with ONLY valid JSON. No markdown, no explanations outside JSON.

{
  "explanation": "Engaging concept explanation (150-500 words)",
  "challenges": [
    {
      "title": "Build Something Specific",
      "description": "WHY this matters + WHAT to build + SUCCESS criteria (100-300 words)",
      "difficulty": "${difficultyBreakdown[0].difficulty}",
      "starterCode": "${template.starterCodeRequired ? 'Valid code with TODOs' : ''}",
      "validationCriteria": [
        { 
          "type": "ai_eval", 
          "rubric": "Specific, measurable success criteria (e.g., 'Function returns true for valid emails, false for invalid')"
        }
      ],
      "hints": [
        "Conceptual hint without giving away answer",
        "Suggest an approach or methodology",
        "Mention a specific technique or pattern"
      ],
      "estimatedMinutes": ${difficultyBreakdown[0].estimatedMinutes},
      "xpReward": ${difficultyBreakdown[0].xpReward},
      "explanation": "What concept this teaches + how it applies (100-200 words)"
    }
  ],
  "nextSteps": "Optional: What to learn after completing this module"
}

CRITICAL RULES:
- All string values must be properly escaped for JSON
- No text outside the JSON object
- No markdown code blocks
- difficulty must be exactly: "Easy", "Medium", or "Hard"
- All numeric fields must be numbers (not strings)
- Each challenge must be complete and unique`;

    const userPrompt = `Create a ${count}-challenge learning path for "${skillTitle}" in ${engine}.
Make each challenge build upon the previous one, creating a cohesive learning journey from fundamentals to mastery.`;

    // Call AI with retry logic
    let response: string;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        response = await callGroq(systemPrompt, userPrompt);
        break;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) throw error;
        console.warn(`⚠️ Attempt ${attempts} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Exponential backoff
      }
    }

    // Clean response aggressively
    let cleanedResponse = response!.trim();
    
    // Remove markdown code blocks
    cleanedResponse = cleanedResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    // Remove any text before first {
    const jsonStart = cleanedResponse.indexOf('{');
    if (jsonStart > 0) {
      cleanedResponse = cleanedResponse.substring(jsonStart);
    }
    
    // Remove any text after last }
    const jsonEnd = cleanedResponse.lastIndexOf('}');
    if (jsonEnd > 0 && jsonEnd < cleanedResponse.length - 1) {
      cleanedResponse = cleanedResponse.substring(0, jsonEnd + 1);
    }

    // Parse JSON
    let rawData: any;
    try {
      rawData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('First 300 chars:', cleanedResponse.substring(0, 300));
      
      // Emergency fallback: try to extract JSON with regex
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        rawData = JSON.parse(jsonMatch[0]);
        console.log('✅ Recovered JSON from malformed response');
      } else {
        throw new Error('AI returned invalid JSON format');
      }
    }

    // Validate with Zod
    const validationResult = ChallengeBatchSchema.safeParse(rawData);

    if (!validationResult.success) {
      console.error('❌ Schema Validation Failed:', validationResult.error.issues);
      
      // Try to salvage what we can
      if (rawData.challenges && Array.isArray(rawData.challenges)) {
        console.warn('⚠️ Attempting to fix invalid challenges...');
        
        rawData.challenges = rawData.challenges.map((c: any, index: number) => ({
          ...c,
          difficulty: ['Easy', 'Medium', 'Hard'].includes(c.difficulty) 
            ? c.difficulty 
            : getDifficultyForIndex(index, count),
          estimatedMinutes: typeof c.estimatedMinutes === 'number' 
            ? c.estimatedMinutes 
            : getEstimatedMinutes(getDifficultyForIndex(index, count)),
          xpReward: typeof c.xpReward === 'number' 
            ? c.xpReward 
            : getXPForDifficulty(getDifficultyForIndex(index, count), index),
          hints: Array.isArray(c.hints) && c.hints.length >= 2 
            ? c.hints 
            : ['Think about the core concept', 'Break it into smaller steps'],
        }));
        
        // Retry validation
        const retryResult = ChallengeBatchSchema.safeParse(rawData);
        if (!retryResult.success) {
          throw new Error('AI output quality too low, even after fixes');
        }
      } else {
        throw new Error('AI failed to generate valid challenges');
      }
    }

    const validatedData = validationResult.success ? validationResult.data : rawData;

    // Map to Challenge interface
    const challenges: Challenge[] = validatedData.challenges.map((c: any, index: number) => ({
      id: `${skillId}_${Date.now()}_${index}`,
      skillId: skillId,
      title: c.title,
      description: c.description,
      engine: engine,
      difficulty: c.difficulty,
      estimatedMinutes: c.estimatedMinutes,
      xpReward: c.xpReward,
      starterCode: c.starterCode || '',
      validationCriteria: c.validationCriteria,
      hints: c.hints,
      explanation: c.explanation,
      context: validatedData.explanation,
    }));

    const result: ChallengeBatch = {
      explanation: validatedData.explanation,
      challenges: challenges,
      nextSteps: validatedData.nextSteps,
    };

    console.log('✅ Generated challenge batch:', {
      skill: skillTitle,
      challengeCount: result.challenges.length,
      avgQualityScore: result.challenges.reduce((sum, c) => 
        sum + c.description.length + c.explanation.length, 0) / result.challenges.length,
    });

    return result;

  } catch (error) {
    console.error('❌ Batch Generation Fatal Error:', error);
    
    // Don't return empty - throw so caller can handle retry
    throw new Error(
      `Failed to generate challenges for ${skillTitle}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

// ============================================
// OPTIONAL: RETRY WRAPPER FOR UI
// ============================================

export async function generateChallengeBatchWithRetry(
  skillId: string,
  skillTitle: string,
  engine: string,
  count: number = 5,
  maxRetries: number = 3
): Promise<ChallengeBatch> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateChallengeBatch(skillId, skillTitle, engine, count);
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}