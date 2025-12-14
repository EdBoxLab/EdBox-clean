/**
 * Enhanced Engine Evaluation and Feedback System
 * 
 * This service provides comprehensive evaluation capabilities for all engines,
 * including performance metrics tracking, targeted hint generation, and
 * immediate feedback response handling.
 * 
 * Requirements: 5.1, 5.2, 5.3
 */

import { callGroq } from '@/lib/courseCreation/engines/shared/groqService';
import { DifficultyLevel } from '@/types/skill-progression';

/**
 * Evaluation result from an engine
 */
export interface EvaluationResult {
  success: boolean;
  score: number; // 0-100
  feedback: string;
  performanceMetrics: PerformanceMetrics;
  hints: string[];
  detailedAnalysis: DetailedAnalysis;
  timeSpent?: number;
  hintsUsed: number;
}

/**
 * Performance metrics for tracking user progress
 */
export interface PerformanceMetrics {
  accuracy: number; // 0-100
  efficiency: number; // 0-100, based on time and hints
  completeness: number; // 0-100, how much of the solution was correct
  methodology: number; // 0-100, quality of approach
  overallScore: number; // 0-100, weighted average
}

/**
 * Detailed analysis of the submission
 */
export interface DetailedAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  nextSteps: string[];
  conceptsToReview: string[];
}

/**
 * Engine-specific evaluation request
 */
export interface EvaluationRequest {
  engine: string;
  challengeId: string;
  skillId: string;
  submission: any; // Engine-specific submission data
  validationCriteria: any[];
  difficultyLevel: DifficultyLevel;
  timeSpent?: number;
  hintsUsed: number;
  userHistory?: any[]; // Previous attempts for context
}

/**
 * Hint generation request
 */
export interface HintRequest {
  engine: string;
  challengeDescription: string;
  submission: any;
  previousHints: string[];
  difficultyLevel: DifficultyLevel;
  specificIssues?: string[];
}

/**
 * Engine Evaluation Service
 * 
 * Provides comprehensive evaluation and feedback for all learning engines
 */
export class EngineEvaluationService {
  
  /**
   * Evaluate a submission using the appropriate engine evaluator
   */
  async evaluateSubmission(request: EvaluationRequest): Promise<EvaluationResult> {
    try {
      // Route to engine-specific evaluator
      switch (request.engine.toLowerCase()) {
        case 'codestudio':
        case 'coding':
          return await this.evaluateCodeSubmission(request);
        case 'mathlab':
        case 'math':
          return await this.evaluateMathSubmission(request);
        case 'chemlab':
        case 'chemistry':
          return await this.evaluateChemistrySubmission(request);
        case 'physicssim':
        case 'physics':
          return await this.evaluatePhysicsSubmission(request);
        case 'bionexus':
        case 'biology':
          return await this.evaluateBiologySubmission(request);
        case 'artstudio':
        case 'art':
          return await this.evaluateArtSubmission(request);
        case 'historymach':
        case 'history':
          return await this.evaluateHistorySubmission(request);
        case 'finlab':
        case 'finance':
          return await this.evaluateFinanceSubmission(request);
        case 'lingualab':
        case 'language':
          return await this.evaluateLanguageSubmission(request);
        case 'writingstudio':
        case 'writing':
          return await this.evaluateWritingSubmission(request);
        default:
          return await this.evaluateGenericSubmission(request);
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      throw new Error(`Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate targeted hints based on submission analysis
   */
  async generateTargetedHints(request: HintRequest): Promise<string[]> {
    const systemPrompt = `You are an expert tutor for ${request.engine}. Generate targeted, progressive hints to help the student improve their solution.

Guidelines:
- Provide 2-3 specific, actionable hints
- Start with conceptual guidance, then move to specific implementation details
- Don't give away the complete solution
- Consider the difficulty level: ${request.difficultyLevel}
- Build on previous hints: ${JSON.stringify(request.previousHints)}
- Address specific issues if provided: ${JSON.stringify(request.specificIssues || [])}

Return a JSON array of hint strings.`;

    const userPrompt = `Challenge: ${request.challengeDescription}

Current submission: ${JSON.stringify(request.submission)}

Generate helpful hints to guide the student toward the correct solution.`;

    try {
      const response = await callGroq(systemPrompt, userPrompt);
      const hints = JSON.parse(response);
      return Array.isArray(hints) ? hints : [response];
    } catch (error) {
      // Fallback to generic hints if parsing fails
      return this.generateFallbackHints(request);
    }
  }

  /**
   * Evaluate code submissions (CodeStudio)
   */
  private async evaluateCodeSubmission(request: EvaluationRequest): Promise<EvaluationResult> {
    const systemPrompt = `You are a senior software engineer and code reviewer. Evaluate the provided code submission comprehensively.

Validation Criteria: ${JSON.stringify(request.validationCriteria)}
Difficulty Level: ${request.difficultyLevel}
Time Spent: ${request.timeSpent || 'Unknown'} seconds
Hints Used: ${request.hintsUsed}

Provide a comprehensive evaluation with:
1. Correctness assessment
2. Code quality analysis
3. Performance considerations
4. Best practices adherence
5. Specific feedback for improvement

Return a JSON response with the following structure:
{
  "success": boolean,
  "score": number (0-100),
  "feedback": "detailed feedback string",
  "performanceMetrics": {
    "accuracy": number (0-100),
    "efficiency": number (0-100),
    "completeness": number (0-100),
    "methodology": number (0-100),
    "overallScore": number (0-100)
  },
  "detailedAnalysis": {
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "suggestions": ["suggestion1", "suggestion2"],
    "nextSteps": ["step1", "step2"],
    "conceptsToReview": ["concept1", "concept2"]
  }
}`;

    const userPrompt = `Evaluate this code submission:

\`\`\`javascript
${request.submission.code || request.submission}
\`\`\`

Challenge ID: ${request.challengeId}
Skill ID: ${request.skillId}`;

    return await this.processEvaluationResponse(systemPrompt, userPrompt, request);
  }

  /**
   * Evaluate math submissions (MathLab)
   */
  private async evaluateMathSubmission(request: EvaluationRequest): Promise<EvaluationResult> {
    const systemPrompt = `You are a mathematics professor and expert evaluator. Assess the mathematical solution comprehensively.

Validation Criteria: ${JSON.stringify(request.validationCriteria)}
Difficulty Level: ${request.difficultyLevel}
Time Spent: ${request.timeSpent || 'Unknown'} seconds
Hints Used: ${request.hintsUsed}

Evaluate:
1. Mathematical correctness
2. Problem-solving approach
3. Work shown and reasoning
4. Computational accuracy
5. Understanding of concepts

Return the same JSON structure as specified for code evaluation.`;

    const userPrompt = `Evaluate this mathematical solution:

Answer: ${request.submission.answer || request.submission}
Work Shown: ${request.submission.workShown || 'No work shown'}

Challenge ID: ${request.challengeId}
Skill ID: ${request.skillId}`;

    return await this.processEvaluationResponse(systemPrompt, userPrompt, request);
  }

  /**
   * Evaluate chemistry submissions (ChemLab)
   */
  private async evaluateChemistrySubmission(request: EvaluationRequest): Promise<EvaluationResult> {
    const systemPrompt = `You are a chemistry professor and laboratory instructor. Evaluate the chemistry solution comprehensively.

Validation Criteria: ${JSON.stringify(request.validationCriteria)}
Difficulty Level: ${request.difficultyLevel}
Time Spent: ${request.timeSpent || 'Unknown'} seconds
Hints Used: ${request.hintsUsed}

Assess:
1. Chemical accuracy and understanding
2. Laboratory technique and safety
3. Data analysis and interpretation
4. Theoretical knowledge application
5. Experimental design quality

Return the same JSON structure as specified for code evaluation.`;

    const userPrompt = `Evaluate this chemistry solution:

Submission: ${JSON.stringify(request.submission)}

Challenge ID: ${request.challengeId}
Skill ID: ${request.skillId}`;

    return await this.processEvaluationResponse(systemPrompt, userPrompt, request);
  }

  /**
   * Evaluate physics submissions (PhysicsSim)
   */
  private async evaluatePhysicsSubmission(request: EvaluationRequest): Promise<EvaluationResult> {
    const systemPrompt = `You are a physics professor and simulation expert. Evaluate the physics solution comprehensively.

Validation Criteria: ${JSON.stringify(request.validationCriteria)}
Difficulty Level: ${request.difficultyLevel}
Time Spent: ${request.timeSpent || 'Unknown'} seconds
Hints Used: ${request.hintsUsed}

Evaluate:
1. Physics principles understanding
2. Mathematical modeling accuracy
3. Simulation setup and parameters
4. Data interpretation skills
5. Conceptual reasoning

Return the same JSON structure as specified for code evaluation.`;

    const userPrompt = `Evaluate this physics solution:

Submission: ${JSON.stringify(request.submission)}

Challenge ID: ${request.challengeId}
Skill ID: ${request.skillId}`;

    return await this.processEvaluationResponse(systemPrompt, userPrompt, request);
  }

  /**
   * Evaluate biology submissions (BioNexus)
   */
  private async evaluateBiologySubmission(request: EvaluationRequest): Promise<EvaluationResult> {
    const systemPrompt = `You are a biology professor and research scientist. Evaluate the biology solution comprehensively.

Validation Criteria: ${JSON.stringify(request.validationCriteria)}
Difficulty Level: ${request.difficultyLevel}
Time Spent: ${request.timeSpent || 'Unknown'} seconds
Hints Used: ${request.hintsUsed}

Assess:
1. Biological concept understanding
2. Scientific methodology
3. Data analysis and interpretation
4. System thinking and connections
5. Research and inquiry skills

Return the same JSON structure as specified for code evaluation.`;

    const userPrompt = `Evaluate this biology solution:

Submission: ${JSON.stringify(request.submission)}

Challenge ID: ${request.challengeId}
Skill ID: ${request.skillId}`;

    return await this.processEvaluationResponse(systemPrompt, userPrompt, request);
  }

  /**
   * Evaluate art submissions (ArtStudio)
   */
  private async evaluateArtSubmission(request: EvaluationRequest): Promise<EvaluationResult> {
    const systemPrompt = `You are an art professor and creative director. Evaluate the artistic work comprehensively.

Validation Criteria: ${JSON.stringify(request.validationCriteria)}
Difficulty Level: ${request.difficultyLevel}
Time Spent: ${request.timeSpent || 'Unknown'} seconds
Hints Used: ${request.hintsUsed}

Evaluate:
1. Creative expression and originality
2. Technical skill and execution
3. Composition and design principles
4. Use of color, form, and space
5. Artistic concept development

Return the same JSON structure as specified for code evaluation.`;

    const userPrompt = `Evaluate this art submission:

Submission: ${JSON.stringify(request.submission)}

Challenge ID: ${request.challengeId}
Skill ID: ${request.skillId}`;

    return await this.processEvaluationResponse(systemPrompt, userPrompt, request);
  }

  /**
   * Evaluate history submissions (HistoryMach)
   */
  private async evaluateHistorySubmission(request: EvaluationRequest): Promise<EvaluationResult> {
    const systemPrompt = `You are a history professor and researcher. Evaluate the historical analysis comprehensively.

Validation Criteria: ${JSON.stringify(request.validationCriteria)}
Difficulty Level: ${request.difficultyLevel}
Time Spent: ${request.timeSpent || 'Unknown'} seconds
Hints Used: ${request.hintsUsed}

Assess:
1. Historical accuracy and knowledge
2. Critical thinking and analysis
3. Use of evidence and sources
4. Understanding of context and causation
5. Communication and argumentation

Return the same JSON structure as specified for code evaluation.`;

    const userPrompt = `Evaluate this history submission:

Submission: ${JSON.stringify(request.submission)}

Challenge ID: ${request.challengeId}
Skill ID: ${request.skillId}`;

    return await this.processEvaluationResponse(systemPrompt, userPrompt, request);
  }

  /**
   * Evaluate finance submissions (FinLab)
   */
  private async evaluateFinanceSubmission(request: EvaluationRequest): Promise<EvaluationResult> {
    const systemPrompt = `You are a finance professor and investment advisor. Evaluate the financial analysis comprehensively.

Validation Criteria: ${JSON.stringify(request.validationCriteria)}
Difficulty Level: ${request.difficultyLevel}
Time Spent: ${request.timeSpent || 'Unknown'} seconds
Hints Used: ${request.hintsUsed}

Evaluate:
1. Financial concept understanding
2. Quantitative analysis accuracy
3. Risk assessment and management
4. Strategic thinking and planning
5. Market knowledge application

Return the same JSON structure as specified for code evaluation.`;

    const userPrompt = `Evaluate this finance submission:

Submission: ${JSON.stringify(request.submission)}

Challenge ID: ${request.challengeId}
Skill ID: ${request.skillId}`;

    return await this.processEvaluationResponse(systemPrompt, userPrompt, request);
  }

  /**
   * Evaluate language submissions (LinguaLab)
   */
  private async evaluateLanguageSubmission(request: EvaluationRequest): Promise<EvaluationResult> {
    const systemPrompt = `You are a language professor and linguistics expert. Evaluate the language work comprehensively.

Validation Criteria: ${JSON.stringify(request.validationCriteria)}
Difficulty Level: ${request.difficultyLevel}
Time Spent: ${request.timeSpent || 'Unknown'} seconds
Hints Used: ${request.hintsUsed}

Assess:
1. Language accuracy and fluency
2. Grammar and syntax understanding
3. Vocabulary usage and range
4. Cultural context awareness
5. Communication effectiveness

Return the same JSON structure as specified for code evaluation.`;

    const userPrompt = `Evaluate this language submission:

Submission: ${JSON.stringify(request.submission)}

Challenge ID: ${request.challengeId}
Skill ID: ${request.skillId}`;

    return await this.processEvaluationResponse(systemPrompt, userPrompt, request);
  }

  /**
   * Evaluate writing submissions (WritingStudio)
   */
  private async evaluateWritingSubmission(request: EvaluationRequest): Promise<EvaluationResult> {
    const systemPrompt = `You are an English professor and writing instructor. Evaluate the written work comprehensively.

Validation Criteria: ${JSON.stringify(request.validationCriteria)}
Difficulty Level: ${request.difficultyLevel}
Time Spent: ${request.timeSpent || 'Unknown'} seconds
Hints Used: ${request.hintsUsed}

Evaluate:
1. Content quality and depth
2. Organization and structure
3. Writing style and voice
4. Grammar and mechanics
5. Audience awareness and purpose

Return the same JSON structure as specified for code evaluation.`;

    const userPrompt = `Evaluate this writing submission:

Submission: ${JSON.stringify(request.submission)}

Challenge ID: ${request.challengeId}
Skill ID: ${request.skillId}`;

    return await this.processEvaluationResponse(systemPrompt, userPrompt, request);
  }

  /**
   * Generic evaluation for unknown engines
   */
  private async evaluateGenericSubmission(request: EvaluationRequest): Promise<EvaluationResult> {
    const systemPrompt = `You are an expert educator and evaluator. Assess the submission comprehensively for the ${request.engine} engine.

Validation Criteria: ${JSON.stringify(request.validationCriteria)}
Difficulty Level: ${request.difficultyLevel}
Time Spent: ${request.timeSpent || 'Unknown'} seconds
Hints Used: ${request.hintsUsed}

Provide thorough evaluation focusing on:
1. Correctness and accuracy
2. Understanding demonstration
3. Problem-solving approach
4. Quality of execution
5. Learning objectives achievement

Return the same JSON structure as specified for code evaluation.`;

    const userPrompt = `Evaluate this submission:

Submission: ${JSON.stringify(request.submission)}

Challenge ID: ${request.challengeId}
Skill ID: ${request.skillId}
Engine: ${request.engine}`;

    return await this.processEvaluationResponse(systemPrompt, userPrompt, request);
  }

  /**
   * Process AI evaluation response and format result
   */
  private async processEvaluationResponse(
    systemPrompt: string,
    userPrompt: string,
    request: EvaluationRequest
  ): Promise<EvaluationResult> {
    try {
      const response = await callGroq(systemPrompt, userPrompt);
      const result = JSON.parse(response);

      // Generate targeted hints if the submission was not successful
      const hints = result.success ? [] : await this.generateTargetedHints({
        engine: request.engine,
        challengeDescription: `Challenge ${request.challengeId}`,
        submission: request.submission,
        previousHints: [],
        difficultyLevel: request.difficultyLevel,
        specificIssues: result.detailedAnalysis?.weaknesses || []
      });

      return {
        success: result.success || false,
        score: result.score || 0,
        feedback: result.feedback || 'No feedback provided',
        performanceMetrics: result.performanceMetrics || this.getDefaultMetrics(),
        hints,
        detailedAnalysis: result.detailedAnalysis || this.getDefaultAnalysis(),
        timeSpent: request.timeSpent,
        hintsUsed: request.hintsUsed
      };
    } catch (error) {
      console.error('Evaluation processing error:', error);
      return this.getFallbackEvaluation(request);
    }
  }

  /**
   * Generate fallback hints when AI generation fails
   */
  private generateFallbackHints(request: HintRequest): string[] {
    const genericHints = [
      "Review the problem requirements carefully and ensure you understand what's being asked.",
      "Break down the problem into smaller, manageable steps.",
      "Check your work for common mistakes or oversights."
    ];

    const engineSpecificHints: Record<string, string[]> = {
      codestudio: [
        "Check your syntax and ensure all brackets and parentheses are properly closed.",
        "Verify that your variable names match what's expected in the validation criteria.",
        "Test your function with simple inputs to debug step by step."
      ],
      mathlab: [
        "Double-check your calculations and ensure you're using the correct formulas.",
        "Show your work step by step to identify where errors might occur.",
        "Verify that your final answer has the correct units and significant figures."
      ],
      chemlab: [
        "Check that your chemical equations are balanced correctly.",
        "Ensure you're using the proper chemical formulas and nomenclature.",
        "Verify that your calculations follow stoichiometric principles."
      ]
    };

    const engineHints = engineSpecificHints[request.engine.toLowerCase()] || genericHints;
    return engineHints.slice(0, 3);
  }

  /**
   * Get default performance metrics
   */
  private getDefaultMetrics(): PerformanceMetrics {
    return {
      accuracy: 0,
      efficiency: 50,
      completeness: 0,
      methodology: 25,
      overallScore: 0
    };
  }

  /**
   * Get default detailed analysis
   */
  private getDefaultAnalysis(): DetailedAnalysis {
    return {
      strengths: [],
      weaknesses: ['Unable to evaluate submission'],
      suggestions: ['Please try again with a valid submission'],
      nextSteps: ['Review the challenge requirements'],
      conceptsToReview: []
    };
  }

  /**
   * Get fallback evaluation when AI fails
   */
  private getFallbackEvaluation(request: EvaluationRequest): EvaluationResult {
    return {
      success: false,
      score: 0,
      feedback: 'Unable to evaluate submission at this time. Please try again.',
      performanceMetrics: this.getDefaultMetrics(),
      hints: this.generateFallbackHints({
        engine: request.engine,
        challengeDescription: `Challenge ${request.challengeId}`,
        submission: request.submission,
        previousHints: [],
        difficultyLevel: request.difficultyLevel
      }),
      detailedAnalysis: this.getDefaultAnalysis(),
      timeSpent: request.timeSpent,
      hintsUsed: request.hintsUsed
    };
  }
}

// Export singleton instance
export const engineEvaluationService = new EngineEvaluationService();