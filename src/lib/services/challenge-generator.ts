// ============================================
// Challenge Generator Service
// Handles AI-powered challenge generation with pool management and fallback systems
// ============================================

import type {
  GeneratedChallenge,
  ChallengeGenerationRequest,
  ChallengePool,
  DifficultyLevel,
  ChallengeAttempt,
  SkillConfiguration,
  DifficultyAdjustment
} from '@/types/skill-progression';
import {
  ChallengeGenerationError,
  SkillProgressionError
} from '@/types/skill-progression';
import { callGroq } from '@/lib/courseCreation/engines/shared/groqService';
import { skillProgressionDb } from './skill-progression-db';
import { adaptiveDifficultyService } from './adaptive-difficulty';

/**
 * Challenge template for fallback scenarios
 */
interface ChallengeTemplate {
  id: string;
  skillType: string;
  title: string;
  description: string;
  starterCode?: string;
  validationCriteria: string[];
  hints: string[];
  difficultyLevel: DifficultyLevel;
  estimatedTime: number;
  learningObjectives: string[];
}

/**
 * Challenge generation configuration
 */
interface GenerationConfig {
  maxRetries: number;
  timeoutMs: number;
  fallbackEnabled: boolean;
  poolSize: {
    min: number;
    max: number;
  };
}

/**
 * Service for generating and managing challenges
 */
export class ChallengeGenerator {
  private db = skillProgressionDb;
  private challengePools = new Map<string, ChallengePool>();
  private fallbackTemplates = new Map<string, ChallengeTemplate[]>();
  
  private config: GenerationConfig = {
    maxRetries: 3,
    timeoutMs: 30000,
    fallbackEnabled: true,
    poolSize: {
      min: 3,
      max: 10
    }
  };

  constructor() {
    this.initializeFallbackTemplates();
  }

  /**
   * Generate a new challenge for a skill with adaptive difficulty
   */
  async generateChallenge(request: ChallengeGenerationRequest): Promise<GeneratedChallenge> {
    try {
      // Apply adaptive difficulty if user ID is provided
      let adjustedRequest = request;
      if (request.userId) {
        adjustedRequest = await this.applyAdaptiveDifficulty(request);
      }

      // Try AI generation first
      const challenge = await this.generateWithAI(adjustedRequest);
      
      // Add to pool if successful
      await this.addToPool(adjustedRequest.skillId, challenge);
      
      return challenge;
    } catch (error) {
      console.error(`AI challenge generation failed for skill ${request.skillId}:`, error);
      
      // Fall back to template-based generation if enabled
      if (this.config.fallbackEnabled) {
        return await this.generateFromTemplate(request);
      }
      
      throw new ChallengeGenerationError(
        `Failed to generate challenge for skill ${request.skillId}: ${error}`,
        request.skillId,
        true
      );
    }
  }

  /**
   * Generate challenge with adaptive difficulty adjustment
   */
  async generateAdaptiveChallenge(
    userId: string,
    skillId: string,
    challengeType?: string
  ): Promise<{ challenge: GeneratedChallenge; difficultyAdjustment: DifficultyAdjustment }> {
    try {
      // Get skill configuration for starting difficulty
      const skillConfig = await this.db.getSkillConfiguration(skillId);
      const startingDifficulty = skillConfig?.difficultyProgression.startingDifficulty || 'Medium';

      // Analyze and adjust difficulty
      const difficultyAdjustment = await adaptiveDifficultyService.analyzeDifficultyAdjustment(
        userId,
        skillId,
        startingDifficulty
      );

      // Generate challenge with adjusted difficulty
      const request: ChallengeGenerationRequest = {
        skillId,
        userId,
        difficultyLevel: difficultyAdjustment.suggestedDifficulty,
        challengeType,
        userHistory: await this.db.getRecentChallengeAttempts(userId, skillId, 5)
      };

      const challenge = await this.generateChallenge(request);

      return {
        challenge,
        difficultyAdjustment
      };
    } catch (error) {
      throw new ChallengeGenerationError(
        `Failed to generate adaptive challenge: ${error}`,
        skillId,
        true
      );
    }
  }

  /**
   * Get challenges from pool for a skill
   */
  async getChallengePool(skillId: string): Promise<GeneratedChallenge[]> {
    const pool = this.challengePools.get(skillId);
    if (!pool) {
      return [];
    }
    
    return pool.challenges;
  }

  /**
   * Ensure minimum pool size for a skill with adaptive difficulty for a specific user
   */
  async ensurePoolSize(
    skillId: string, 
    userId?: string,
    targetSize: number = this.config.poolSize.min
  ): Promise<void> {
    const currentPool = await this.getChallengePool(skillId);
    const needed = Math.max(0, targetSize - currentPool.length);
    
    if (needed === 0) {
      return;
    }

    // Get skill configuration for generation context
    const skillConfig = await this.db.getSkillConfiguration(skillId);
    if (!skillConfig) {
      throw new ChallengeGenerationError(
        `No configuration found for skill ${skillId}`,
        skillId,
        false
      );
    }

    // Determine starting difficulty based on user or default
    let startingDifficulty = skillConfig.difficultyProgression.startingDifficulty;
    if (userId && skillConfig.difficultyProgression.adaptiveScaling) {
      startingDifficulty = await adaptiveDifficultyService.getDefaultDifficultyForNewUser(userId);
    }

    // Generate needed challenges
    const generationPromises: Promise<GeneratedChallenge>[] = [];
    
    for (let i = 0; i < needed; i++) {
      const request: ChallengeGenerationRequest = {
        skillId,
        userId,
        difficultyLevel: startingDifficulty,
        challengeType: skillConfig.challengeTypes[i % skillConfig.challengeTypes.length]
      };
      
      generationPromises.push(this.generateChallenge(request));
    }

    try {
      await Promise.all(generationPromises);
    } catch (error) {
      // Some challenges may have failed, but we continue with what we have
      console.warn(`Some challenges failed to generate for skill ${skillId}:`, error);
    }
  }

  /**
   * Generate challenge variety for the same skill with adaptive difficulty
   */
  async generateVariedChallenges(
    skillId: string, 
    count: number, 
    difficultyLevel: DifficultyLevel,
    userId?: string
  ): Promise<GeneratedChallenge[]> {
    const challenges: GeneratedChallenge[] = [];
    const usedScenarios = new Set<string>();

    // Get skill configuration
    const skillConfig = await this.db.getSkillConfiguration(skillId);
    if (!skillConfig) {
      throw new ChallengeGenerationError(
        `No configuration found for skill ${skillId}`,
        skillId,
        false
      );
    }

    // Adjust difficulty if user provided and adaptive scaling enabled
    let adjustedDifficulty = difficultyLevel;
    if (userId && skillConfig.difficultyProgression.adaptiveScaling) {
      try {
        const adjustment = await adaptiveDifficultyService.analyzeDifficultyAdjustment(
          userId,
          skillId,
          difficultyLevel
        );
        if (adjustment.confidenceScore >= 0.6) {
          adjustedDifficulty = adjustment.suggestedDifficulty;
        }
      } catch (error) {
        console.warn('Failed to apply adaptive difficulty for varied challenges:', error);
      }
    }

    for (let i = 0; i < count; i++) {
      const challengeType = skillConfig.challengeTypes[i % skillConfig.challengeTypes.length];
      
      const request: ChallengeGenerationRequest = {
        skillId,
        userId,
        difficultyLevel: adjustedDifficulty,
        challengeType,
        userHistory: userId ? await this.db.getRecentChallengeAttempts(userId, skillId, 3) : []
      };

      try {
        const challenge = await this.generateUniqueChallenge(request, usedScenarios);
        challenges.push(challenge);
        
        // Track scenario to ensure variety
        usedScenarios.add(this.extractScenario(challenge));
      } catch (error) {
        console.warn(`Failed to generate challenge ${i + 1} for skill ${skillId}:`, error);
        
        // Try fallback if available
        if (this.config.fallbackEnabled) {
          try {
            const fallbackChallenge = await this.generateFromTemplate(request);
            challenges.push(fallbackChallenge);
          } catch (fallbackError) {
            console.error(`Fallback also failed for challenge ${i + 1}:`, fallbackError);
          }
        }
      }
    }

    return challenges;
  }

  /**
   * Generate challenge with AI using Groq
   */
  private async generateWithAI(request: ChallengeGenerationRequest): Promise<GeneratedChallenge> {
    const systemPrompt = this.buildSystemPrompt(request);
    const userPrompt = this.buildUserPrompt(request);

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await Promise.race([
          callGroq(systemPrompt, userPrompt, 'llama-3.1-70b-versatile'),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Generation timeout')), this.config.timeoutMs)
          )
        ]);

        const challenge = this.parseAIResponse(response, request);
        this.validateChallenge(challenge);
        
        return challenge;
      } catch (error) {
        lastError = error as Error;
        console.warn(`AI generation attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.maxRetries) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw new ChallengeGenerationError(
      `AI generation failed after ${this.config.maxRetries} attempts: ${lastError?.message}`,
      request.skillId,
      true
    );
  }

  /**
   * Generate challenge from fallback template
   */
  private async generateFromTemplate(request: ChallengeGenerationRequest): Promise<GeneratedChallenge> {
    const templates = this.fallbackTemplates.get(request.challengeType || 'default') || 
                     this.fallbackTemplates.get('default') || [];

    if (templates.length === 0) {
      throw new ChallengeGenerationError(
        `No fallback templates available for skill ${request.skillId}`,
        request.skillId,
        false
      );
    }

    // Select template based on difficulty
    const suitableTemplates = templates.filter(t => t.difficultyLevel === request.difficultyLevel);
    const template = suitableTemplates.length > 0 
      ? suitableTemplates[Math.floor(Math.random() * suitableTemplates.length)]
      : templates[Math.floor(Math.random() * templates.length)];

    // Customize template for this specific request
    return {
      id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      skillId: request.skillId,
      title: template.title,
      description: template.description,
      starterCode: template.starterCode,
      validationCriteria: [...template.validationCriteria],
      hints: [...template.hints],
      difficultyLevel: request.difficultyLevel,
      estimatedTime: template.estimatedTime,
      learningObjectives: [...template.learningObjectives]
    };
  }

  /**
   * Generate unique challenge avoiding similar scenarios
   */
  private async generateUniqueChallenge(
    request: ChallengeGenerationRequest, 
    usedScenarios: Set<string>
  ): Promise<GeneratedChallenge> {
    const maxAttempts = 5;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const challenge = await this.generateWithAI({
        ...request,
        // Add variety instruction to the request
        challengeType: `${request.challengeType}_variant_${attempt}`
      });

      const scenario = this.extractScenario(challenge);
      if (!usedScenarios.has(scenario)) {
        return challenge;
      }
    }

    // If we can't generate a unique scenario, return the last attempt
    return await this.generateWithAI(request);
  }

  /**
   * Add challenge to pool
   */
  private async addToPool(skillId: string, challenge: GeneratedChallenge): Promise<void> {
    let pool = this.challengePools.get(skillId);
    
    if (!pool) {
      pool = {
        skillId,
        challenges: [],
        lastGenerated: new Date(),
        totalGenerated: 0
      };
      this.challengePools.set(skillId, pool);
    }

    // Prevent pool from growing too large
    if (pool.challenges.length >= this.config.poolSize.max) {
      // Remove oldest challenge
      pool.challenges.shift();
    }

    pool.challenges.push(challenge);
    pool.lastGenerated = new Date();
    pool.totalGenerated++;
  }

  /**
   * Build system prompt for AI generation
   */
  private buildSystemPrompt(request: ChallengeGenerationRequest): string {
    return `You are an expert educational content generator specializing in creating engaging, practical challenges for skill-based learning.

Your task is to generate a challenge that:
1. Tests the specific skill comprehensively
2. Provides appropriate difficulty level (${request.difficultyLevel})
3. Includes clear validation criteria
4. Offers progressive hints for learning
5. Connects to real-world applications

Generate challenges that are:
- Unique and varied in scenario/context
- Appropriately scoped for the difficulty level
- Include starter code/templates when applicable
- Have clear, measurable success criteria
- Provide educational value beyond just testing

Return ONLY valid JSON matching this exact structure:
{
  "title": "Engaging challenge title",
  "description": "Clear, detailed instructions",
  "starterCode": "Initial code/template (if applicable)",
  "validationCriteria": ["Specific criterion 1", "Specific criterion 2"],
  "hints": ["Progressive hint 1", "Progressive hint 2", "Progressive hint 3"],
  "estimatedTime": 15,
  "learningObjectives": ["What user will learn 1", "What user will learn 2"]
}`;
  }

  /**
   * Build user prompt for AI generation
   */
  private buildUserPrompt(request: ChallengeGenerationRequest): string {
    let prompt = `Generate a ${request.difficultyLevel} challenge for skill: ${request.skillId}`;
    
    if (request.challengeType) {
      prompt += `\nChallenge type: ${request.challengeType}`;
    }

    if (request.userHistory && request.userHistory.length > 0) {
      const recentAttempts = request.userHistory.slice(-3);
      const successRate = recentAttempts.filter(a => a.success).length / recentAttempts.length;
      prompt += `\nUser's recent performance: ${(successRate * 100).toFixed(0)}% success rate`;
      
      if (successRate < 0.5) {
        prompt += `\nNote: User is struggling - provide extra scaffolding and clearer instructions`;
      } else if (successRate > 0.8) {
        prompt += `\nNote: User is performing well - can handle more complex scenarios`;
      }
    }

    return prompt;
  }

  /**
   * Parse AI response into challenge object
   */
  private parseAIResponse(response: string, request: ChallengeGenerationRequest): GeneratedChallenge {
    try {
      // Clean up response (remove markdown formatting if present)
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);
      
      return {
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        skillId: request.skillId,
        title: parsed.title || 'Generated Challenge',
        description: parsed.description || 'Challenge description',
        starterCode: parsed.starterCode,
        validationCriteria: Array.isArray(parsed.validationCriteria) ? parsed.validationCriteria : [],
        hints: Array.isArray(parsed.hints) ? parsed.hints : [],
        difficultyLevel: request.difficultyLevel,
        estimatedTime: parsed.estimatedTime || 15,
        learningObjectives: Array.isArray(parsed.learningObjectives) ? parsed.learningObjectives : []
      };
    } catch (error) {
      throw new ChallengeGenerationError(
        `Failed to parse AI response: ${error}`,
        request.skillId,
        true
      );
    }
  }

  /**
   * Validate generated challenge
   */
  private validateChallenge(challenge: GeneratedChallenge): void {
    const errors: string[] = [];

    if (!challenge.title || challenge.title.trim().length === 0) {
      errors.push('Challenge must have a title');
    }

    if (!challenge.description || challenge.description.trim().length === 0) {
      errors.push('Challenge must have a description');
    }

    if (!Array.isArray(challenge.validationCriteria) || challenge.validationCriteria.length === 0) {
      errors.push('Challenge must have validation criteria');
    }

    if (!Array.isArray(challenge.hints) || challenge.hints.length === 0) {
      errors.push('Challenge must have hints');
    }

    if (challenge.estimatedTime <= 0) {
      errors.push('Challenge must have positive estimated time');
    }

    if (errors.length > 0) {
      throw new ChallengeGenerationError(
        `Invalid challenge: ${errors.join(', ')}`,
        challenge.skillId,
        true
      );
    }
  }

  /**
   * Extract scenario identifier from challenge for uniqueness checking
   */
  private extractScenario(challenge: GeneratedChallenge): string {
    // Simple heuristic: use first few words of title + key terms from description
    const titleWords = challenge.title.toLowerCase().split(' ').slice(0, 3).join(' ');
    const descWords = challenge.description.toLowerCase()
      .split(' ')
      .filter(word => word.length > 4)
      .slice(0, 2)
      .join(' ');
    
    return `${titleWords}_${descWords}`;
  }

  /**
   * Apply adaptive difficulty to a challenge generation request
   */
  private async applyAdaptiveDifficulty(request: ChallengeGenerationRequest): Promise<ChallengeGenerationRequest> {
    if (!request.userId) {
      return request;
    }

    try {
      const difficultyAdjustment = await adaptiveDifficultyService.analyzeDifficultyAdjustment(
        request.userId,
        request.skillId,
        request.difficultyLevel
      );

      // Only apply adjustment if confidence is high enough
      if (difficultyAdjustment.confidenceScore >= 0.6) {
        return {
          ...request,
          difficultyLevel: difficultyAdjustment.suggestedDifficulty
        };
      }

      return request;
    } catch (error) {
      console.warn('Failed to apply adaptive difficulty, using original request:', error);
      return request;
    }
  }

  /**
   * Initialize fallback templates for common skill types
   */
  private initializeFallbackTemplates(): void {
    // Default programming challenges
    this.fallbackTemplates.set('programming', [
      {
        id: 'prog_basic_1',
        skillType: 'programming',
        title: 'Variable Declaration Practice',
        description: 'Create variables of different types and perform basic operations',
        starterCode: '// Declare your variables here\n',
        validationCriteria: [
          'Variables are properly declared',
          'Correct data types are used',
          'Operations produce expected results'
        ],
        hints: [
          'Remember to choose appropriate variable names',
          'Consider the data type that best fits your data',
          'Test your operations with different values'
        ],
        difficultyLevel: 'Easy',
        estimatedTime: 10,
        learningObjectives: [
          'Understand variable declaration syntax',
          'Practice choosing appropriate data types'
        ]
      }
    ]);

    // Default math challenges
    this.fallbackTemplates.set('mathematics', [
      {
        id: 'math_basic_1',
        skillType: 'mathematics',
        title: 'Equation Solving',
        description: 'Solve the given equation step by step',
        validationCriteria: [
          'Correct solution is found',
          'Steps are clearly shown',
          'Work is mathematically sound'
        ],
        hints: [
          'Identify the type of equation first',
          'Apply appropriate solving techniques',
          'Check your answer by substitution'
        ],
        difficultyLevel: 'Medium',
        estimatedTime: 15,
        learningObjectives: [
          'Practice equation solving techniques',
          'Develop systematic problem-solving approach'
        ]
      }
    ]);

    // Default general challenges
    this.fallbackTemplates.set('default', [
      {
        id: 'default_1',
        skillType: 'general',
        title: 'Skill Practice Challenge',
        description: 'Apply the concepts you have learned to solve this problem',
        validationCriteria: [
          'Problem is solved correctly',
          'Approach demonstrates understanding',
          'Solution is well-explained'
        ],
        hints: [
          'Break the problem into smaller parts',
          'Apply the key concepts from this skill',
          'Verify your solution makes sense'
        ],
        difficultyLevel: 'Medium',
        estimatedTime: 20,
        learningObjectives: [
          'Apply learned concepts practically',
          'Develop problem-solving skills'
        ]
      }
    ]);
  }
}

// Export singleton instance
export const challengeGenerator = new ChallengeGenerator();