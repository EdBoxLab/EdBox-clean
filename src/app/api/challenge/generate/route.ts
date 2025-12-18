import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Challenge, EngineType } from '@/lib/courseCreation/types';
import { generateWithRetry } from '@/lib/ai-providers';
import { z } from 'zod';

// ============================================
// SCHEMA VALIDATION (The Key to Good AI Output)
// ============================================

const ChallengeSchema = z.object({
  id: z.string().uuid(),
  skillId: z.string(),
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(500),
  engine: z.string(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  starterCode: z.string().optional(),
  validationCriteria: z.array(z.object({
    type: z.enum(['ai_eval', 'test_case', 'output_match', 'code_quality']),
    rubric: z.string(),
    weight: z.number().min(0).max(1).optional(),
  })),
  hints: z.array(z.string()).min(2).max(5),
  explanation: z.string().min(100).max(1000),
  realWorldContext: z.string().optional(),
  estimatedTimeMinutes: z.number().min(5).max(120),
});

type ChallengeOutput = z.infer<typeof ChallengeSchema>;

// ============================================
// SKILL-SPECIFIC PROMPT TEMPLATES
// ============================================

const PROMPT_TEMPLATES = {
  coding: {
    system: `You are a master coding instructor who creates engaging, practical challenges.
Your challenges must be:
- SPECIFIC: Clear success criteria, not vague "write a function"
- PRACTICAL: Real-world scenarios, not academic exercises
- PROGRESSIVE: Builds on previous knowledge
- ENGAGING: Has a story or context that makes it interesting`,
    
    examples: [
      {
        good: "Build a password validator that checks for: minimum 8 characters, at least one uppercase letter, one number, and one special character. Return helpful error messages for each failed rule.",
        bad: "Write a function to validate passwords."
      },
      {
        good: "You're building a shopping cart. Implement a function that calculates the total with these rules: 10% discount if cart total > $100, free shipping if > $50, and apply a promo code if provided.",
        bad: "Create a shopping cart calculator."
      }
    ]
  },
  
  design: {
    system: `You are a design thinking expert who creates challenges that teach through doing.
Your challenges must:
- Focus on USER NEEDS first, not aesthetics
- Include constraints (mobile-first, accessibility, etc.)
- Have clear deliverables (wireframe, prototype, etc.)
- Connect to real products/companies`,
    
    examples: [
      {
        good: "Redesign Spotify's playlist sharing feature. Current problem: users can't collaborate in real-time. Design a mobile interface that lets 2-5 people add songs simultaneously. Consider: offline mode, conflict resolution, and notification system.",
        bad: "Design a music app interface."
      }
    ]
  },
  
  business: {
    system: `You are a business strategy consultant creating practical case challenges.
Your challenges must:
- Use REAL company scenarios (anonymized if needed)
- Include specific metrics to optimize
- Provide context (market data, constraints, resources)
- Have multiple valid solutions`,
    
    examples: [
      {
        good: "A SaaS startup has 10,000 free users but only 50 paying ($99/mo). Free users average 2 logins/week. Paid users: 15 logins/week. Marketing budget: $20K/month. Analyze the conversion funnel and propose 3 experiments to 2x paid conversions in 60 days.",
        bad: "Create a strategy to increase conversions."
      }
    ]
  },
  
  default: {
    system: `You are an expert educator creating hands-on learning challenges.
Your challenges must:
- Start with WHY (why does this skill matter?)
- Break complex tasks into clear steps
- Include self-assessment criteria
- Connect theory to practice`,
    
    examples: []
  }
};

// ============================================
// DIFFICULTY GUIDELINES
// ============================================

const DIFFICULTY_SPECS = {
  Beginner: {
    timeRange: [5, 15],
    conceptCount: "1 core concept",
    guidance: "Step-by-step instructions with examples",
    validationType: "Clear pass/fail criteria"
  },
  Intermediate: {
    timeRange: [15, 30],
    conceptCount: "2-3 related concepts",
    guidance: "General approach with hints available",
    validationType: "Multiple test cases with edge cases"
  },
  Advanced: {
    timeRange: [30, 60],
    conceptCount: "3-5 interconnected concepts",
    guidance: "Problem statement only, minimal hints",
    validationType: "Complex scenarios, optimization required"
  },
  Expert: {
    timeRange: [60, 120],
    conceptCount: "5+ concepts with synthesis",
    guidance: "Open-ended, multiple solutions possible",
    validationType: "Subjective rubric with trade-off analysis"
  }
};

// ============================================
// MAIN API ROUTE
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. VALIDATE INPUT
    const body = await request.json();
    const { skillId, skillTitle, engine, context, difficulty = 'Intermediate' } = body;

    if (!skillId || !skillTitle) {
      return NextResponse.json(
        { error: "skillId and skillTitle are required" },
        { status: 400 }
      );
    }

    // 2. AUTH CHECK
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🎯 Generating ${difficulty} challenge for: ${skillTitle} (${engine})`);

    // 3. SELECT APPROPRIATE PROMPT TEMPLATE
    const engineType = engine?.toLowerCase() || 'default';
    const template = PROMPT_TEMPLATES[engineType as keyof typeof PROMPT_TEMPLATES] 
      || PROMPT_TEMPLATES.default;
    
    const difficultySpec = DIFFICULTY_SPECS[difficulty as keyof typeof DIFFICULTY_SPECS];

    // 4. BUILD STRUCTURED PROMPT
    const systemPrompt = `${template.system}

SKILL TO TEACH: "${skillTitle}"
ENGINE/DOMAIN: ${engine || 'General'}
DIFFICULTY: ${difficulty}

REQUIREMENTS FOR THIS DIFFICULTY:
- Time to complete: ${difficultySpec.timeRange[0]}-${difficultySpec.timeRange[1]} minutes
- Concepts covered: ${difficultySpec.conceptCount}
- Guidance level: ${difficultySpec.guidance}
- Validation: ${difficultySpec.validationType}

ADDITIONAL CONTEXT:
${context || 'User is learning this skill in a practical, project-based way.'}

${template.examples.length > 0 ? `
EXAMPLES OF GOOD VS BAD CHALLENGES:
${template.examples.map((ex, i) => `
Example ${i + 1}:
✅ GOOD: ${ex.good}
❌ BAD: ${ex.bad}
`).join('\n')}
` : ''}

OUTPUT REQUIREMENTS:
1. Title must be action-oriented (e.g., "Build...", "Design...", "Analyze...")
2. Description must include:
   - WHY this challenge matters (1-2 sentences)
   - WHAT the user will build/create (specific deliverable)
   - SUCCESS criteria (how they know they're done)
3. StarterCode or starter placeholder (if applicable):
   - Must be valid, runnable code or helpful starting point
   - Include helpful comments or helpful guides
   - Use placeholder functions/TODOs for user to complete or helpful starter text 
4. Hints must be progressive:
   - Hint 1: Conceptual nudge
   - Hint 2: Approach suggestion
   - Hint 3: Near-solution guidance
5. Explanation must teach the underlying concept, not just solve the problem

Generate ONE high-quality challenge following these guidelines.`;

    // 5. GENERATE WITH STRUCTURED OUTPUT
    const generationId = crypto.randomUUID();
    
    const result = await generateWithRetry({
      prompt: systemPrompt,
      systemPrompt: 'You are an expert educational content creator. Output valid JSON only, no markdown formatting.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          skillId: { type: 'string' },
          title: { type: 'string', minLength: 10, maxLength: 100 },
          description: { type: 'string', minLength: 50, maxLength: 500 },
          engine: { type: 'string' },
          difficulty: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
          starterCode: { type: 'string' },
          validationCriteria: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['ai_eval', 'test_case', 'output_match', 'code_quality'] },
                rubric: { type: 'string' },
                weight: { type: 'number', minimum: 0, maximum: 1 }
              },
              required: ['type', 'rubric']
            }
          },
          hints: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 5 },
          explanation: { type: 'string', minLength: 100, maxLength: 1000 },
          realWorldContext: { type: 'string' },
          estimatedTimeMinutes: { type: 'number', minimum: 5, maximum: 120 }
        },
        required: ['id', 'skillId', 'title', 'description', 'engine', 'difficulty', 'validationCriteria', 'hints', 'explanation']
      },
      temperature: 0.8, // Slightly lower for more consistent structure
      maxTokens: 3000,
    });

    // 6. PARSE AND VALIDATE OUTPUT
    let challengeData: any;
    
    try {
      // Remove markdown code blocks if AI added them
      let cleanedText = result.text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }
      
      challengeData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw AI Output:', result.text);
      
      return NextResponse.json({
        error: 'AI generated invalid JSON format',
        details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        rawOutput: result.text.substring(0, 200) + '...' // First 200 chars for debugging
      }, { status: 500 });
    }

    // 7. VALIDATE AGAINST SCHEMA
    const validationResult = ChallengeSchema.safeParse({
      ...challengeData,
      id: generationId, // Override with our UUID
      skillId, // Ensure it matches input
    });

    if (!validationResult.success) {
      console.error('Schema Validation Failed:', validationResult.error);
      
      return NextResponse.json({
        error: 'Generated challenge failed quality checks',
        validationErrors: validationResult.error.issues,
        generatedData: challengeData
      }, { status: 500 });
    }

    const validatedChallenge = validationResult.data;

    // 8. OPTIONAL: SAVE TO DATABASE
    // Uncomment if you want to store generated challenges
    /*
    const { error: dbError } = await supabase
      .from('challenges')
      .insert({
        ...validatedChallenge,
        created_by: user.id,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('Database save error:', dbError);
      // Continue anyway - challenge was generated successfully
    }
    */

    console.log(`✅ Successfully generated challenge: ${validatedChallenge.title}`);

    return NextResponse.json({
      success: true,
      challenge: validatedChallenge,
      metadata: {
        generatedAt: new Date().toISOString(),
        engine: engine || 'default',
        difficulty,
        estimatedTime: validatedChallenge.estimatedTimeMinutes,
      }
    });

  } catch (error: any) {
    console.error('❌ Challenge Generation Fatal Error:', error);
    
    // Differentiate between different error types
    if (error.message?.includes('rate limit')) {
      return NextResponse.json({
        error: 'AI service rate limit reached. Please try again in a moment.',
        retryAfter: 60
      }, { status: 429 });
    }
    
    if (error.message?.includes('timeout')) {
      return NextResponse.json({
        error: 'AI generation timed out. The request may be too complex.',
        suggestion: 'Try reducing the difficulty or being more specific with the skill.'
      }, { status: 504 });
    }

    return NextResponse.json({
      error: 'Failed to generate challenge',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// ============================================
// OPTIONAL: GET ENDPOINT FOR TESTING
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const engine = searchParams.get('engine') || 'default';
  
  return NextResponse.json({
    availableEngines: Object.keys(PROMPT_TEMPLATES),
    difficulties: Object.keys(DIFFICULTY_SPECS),
    selectedEngine: engine,
    template: PROMPT_TEMPLATES[engine as keyof typeof PROMPT_TEMPLATES] || PROMPT_TEMPLATES.default,
    example: {
      request: {
        skillId: 'uuid-here',
        skillTitle: 'React State Management',
        engine: 'coding',
        difficulty: 'Intermediate',
        context: 'Building a todo app'
      }
    }
  });
}