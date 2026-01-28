/**
 * GENIE COGNITIVE ENGINE V2
 * 
 * Architecture:
 * - State Machine driven (not rule-based spaghetti)
 * - Iteration tracking (every loop is logged)
 * - Fast decisions (<100ms)
 * - Separation: Decision → Content Generation → Delivery
 */

import { generateWithRetry, cleanJsonResponse, streamWithFallback } from '@/lib/ai-providers';
import { KnowledgeNode, MasteryRecord } from './types';
import { VectorBrain } from './vector';

// ============================================================================
// STATE MACHINE
// ============================================================================

export enum LearningState {
  ONBOARDING = 'onboarding',        // Show roadmap, set expectations
  TEACHING = 'teaching',             // Explain concepts
  ASSESSING = 'assessing',           // Quiz to verify understanding
  REINFORCING = 'reinforcing',       // Challenge to deepen mastery
  REMEDIATING = 'remediating',       // Fill knowledge gaps
  MASTERED = 'mastered'              // Move to next concept
}

export enum ActionType {
  ROADMAP = 'roadmap',
  EXPLAIN = 'explain',
  QUIZ = 'quiz',
  CHALLENGE = 'challenge',
  REMEDIATE = 'remediate',
  ADVANCE = 'advance'
}

interface LearningIteration {
  iteration_number: number;
  state: LearningState;
  actions_taken: ActionType[];
  mastery_progression: number[];
  timestamp: Date;
}

interface CognitiveDecision {
  action: ActionType;
  next_state: LearningState;
  thought_process: string;
  confidence: number;           // 0-1, how confident is this decision
  evaluation_score: number;     // 0-100, user's estimated mastery
  feedback: string;
  iteration: LearningIteration;
}

// ============================================================================
// DECISION ENGINE (Fast, Pure Logic)
// ============================================================================

export class CognitiveEngine {

  /**
   * CORE DECISION FUNCTION
   * Pure state machine - no AI calls, just logic
   * Returns action in <10ms
   */
  static decide(
    currentState: LearningState,
    masteryScore: number,
    conversationLength: number,
    userIntent: 'vague' | 'question' | 'answer' | 'request',
    previousActions: ActionType[]
  ): { action: ActionType; nextState: LearningState } {

    // RULE 1: First interaction → Show roadmap
    if (conversationLength === 0) {
      return { action: ActionType.ROADMAP, nextState: LearningState.ONBOARDING };
    }

    // RULE 2: Vague responses after explanation → Assess
    const lastAction = previousActions[previousActions.length - 1];
    if (userIntent === 'vague' && lastAction === ActionType.EXPLAIN) {
      return { action: ActionType.QUIZ, nextState: LearningState.ASSESSING };
    }

    // RULE 3: User explicitly requests something → Honor it
    if (userIntent === 'request') {
      const requestedAction = this.extractRequestedAction(previousActions);
      return {
        action: requestedAction,
        nextState: this.getStateForAction(requestedAction)
      };
    }

    // RULE 4: State machine transitions
    switch (currentState) {
      case LearningState.ONBOARDING:
        return { action: ActionType.EXPLAIN, nextState: LearningState.TEACHING };

      case LearningState.TEACHING:
        // After explanation, always assess
        if (lastAction === ActionType.EXPLAIN) {
          return { action: ActionType.QUIZ, nextState: LearningState.ASSESSING };
        }
        return { action: ActionType.EXPLAIN, nextState: LearningState.TEACHING };

      case LearningState.ASSESSING:
        if (masteryScore < 50) {
          return { action: ActionType.REMEDIATE, nextState: LearningState.REMEDIATING };
        } else if (masteryScore >= 80) {
          return { action: ActionType.CHALLENGE, nextState: LearningState.REINFORCING };
        } else {
          return { action: ActionType.EXPLAIN, nextState: LearningState.TEACHING };
        }

      case LearningState.REINFORCING:
        if (masteryScore >= 90) {
          return { action: ActionType.ADVANCE, nextState: LearningState.MASTERED };
        }
        return { action: ActionType.CHALLENGE, nextState: LearningState.REINFORCING };

      case LearningState.REMEDIATING:
        return { action: ActionType.EXPLAIN, nextState: LearningState.TEACHING };

      case LearningState.MASTERED:
        return { action: ActionType.ADVANCE, nextState: LearningState.MASTERED };

      default:
        return { action: ActionType.EXPLAIN, nextState: LearningState.TEACHING };
    }
  }

  /**
   * Classify user's intent (used by decision engine)
   */
  static classifyIntent(userResponse: string): 'vague' | 'question' | 'answer' | 'request' {
    const lower = userResponse.toLowerCase().trim();

    // Vague affirmatives
    const vaguePatterns = ['ok', 'yes', 'yeah', 'sure', 'uhm', 'uh', 'go on', 'continue', 'next', 'i understand'];
    if (vaguePatterns.some(p => lower === p || lower.startsWith(p + ' '))) {
      return 'vague';
    }

    // Explicit requests
    const requestPatterns = ['quiz me', 'give me a challenge', 'test me', 'explain', 'show me', 'can you'];
    if (requestPatterns.some(p => lower.includes(p))) {
      return 'request';
    }

    // Questions
    if (lower.includes('?') || lower.startsWith('what') || lower.startsWith('how') || lower.startsWith('why')) {
      return 'question';
    }

    // Default to answer
    return 'answer';
  }

  /**
   * Extract what the user is requesting
   */
  private static extractRequestedAction(previousActions: ActionType[]): ActionType {
    // Simple heuristic - in production, use NLU
    return ActionType.QUIZ; // Placeholder
  }

  /**
   * Map actions to states
   */
  private static getStateForAction(action: ActionType): LearningState {
    const mapping: Record<ActionType, LearningState> = {
      [ActionType.ROADMAP]: LearningState.ONBOARDING,
      [ActionType.EXPLAIN]: LearningState.TEACHING,
      [ActionType.QUIZ]: LearningState.ASSESSING,
      [ActionType.CHALLENGE]: LearningState.REINFORCING,
      [ActionType.REMEDIATE]: LearningState.REMEDIATING,
      [ActionType.ADVANCE]: LearningState.MASTERED
    };
    return mapping[action];
  }
}

// ============================================================================
// AI EVALUATOR (Determines mastery from user responses)
// ============================================================================

export class MasteryEvaluator {

  /**
   * Evaluate user's response to determine mastery score
   * This is the ONLY place we call AI for evaluation
   */
  static async evaluate(
    userResponse: string,
    currentNode: KnowledgeNode,
    expectedAnswer?: string
  ): Promise<{ score: number; feedback: string; reasoning: string }> {

    const systemPrompt = `You are a mastery evaluator. Analyze the user's response and assign a mastery score (0-100).

Scoring rubric:
- 0-20: No understanding, incorrect fundamental concepts
- 21-40: Partial understanding, major gaps
- 41-60: Basic understanding, some misconceptions
- 61-80: Good understanding, minor errors
- 81-100: Excellent understanding, can apply concepts

Topic: "${currentNode.title}"
Expected answer: ${expectedAnswer || 'N/A'}

Return JSON only.`;

    const result = await generateWithRetry({
      prompt: `User Response: "${userResponse}"`,
      systemPrompt,
      schema: {
        type: "object",
        properties: {
          score: { type: "number", minimum: 0, maximum: 100 },
          feedback: { type: "string" },
          reasoning: { type: "string" }
        },
        required: ["score", "feedback", "reasoning"]
      }
    });

    try {
      const parsed = JSON.parse(cleanJsonResponse(result.text));
      return {
        score: Math.max(0, Math.min(100, parsed.score)),
        feedback: parsed.feedback || "Keep going!",
        reasoning: parsed.reasoning || ""
      };
    } catch (e) {
      console.error('[EVALUATOR] Failed to parse evaluation', e);
      return { score: 50, feedback: "Let's continue.", reasoning: "Parse error" };
    }
  }
}

// ============================================================================
// CONTENT GENERATOR (Creates quizzes, challenges, explanations)
// ============================================================================

export class ContentGenerator {

  /**
   * Generate quiz question
   */
  static async generateQuiz(
    node: KnowledgeNode,
    difficulty: 'easy' | 'medium' | 'hard',
    previousQuestions: string[] = []
  ) {
    const systemPrompt = `Generate a ${difficulty} quiz question for: "${node.title}"

Rules:
- Question must test conceptual understanding, not memorization
- Include 4 options (A, B, C, D)
- Only one correct answer
- Avoid questions similar to: ${previousQuestions.join(', ')}

Return JSON only.`;

    const result = await generateWithRetry({
      prompt: node.content.substring(0, 500),
      systemPrompt,
      schema: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
          correctAnswer: { type: "string" },
          explanation: { type: "string" }
        },
        required: ["question", "options", "correctAnswer", "explanation"]
      }
    });

    return JSON.parse(cleanJsonResponse(result.text));
  }

  /**
   * Generate challenge
   */
  static async generateChallenge(
    node: KnowledgeNode,
    difficulty: 'Easy' | 'Medium' | 'Hard'
  ) {
    const systemPrompt = `Create a ${difficulty} hands-on challenge for: "${node.title}"

Requirements:
- Must require application of the concept, not just recall
- Should be completable in 5-10 minutes
- Include a hint and expected outcome

Return JSON only.`;

    const result = await generateWithRetry({
      prompt: node.content.substring(0, 500),
      systemPrompt,
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          hint: { type: "string" },
          difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
          expectedOutcome: { type: "string" }
        },
        required: ["title", "description", "hint", "difficulty", "expectedOutcome"]
      }
    });

    return JSON.parse(cleanJsonResponse(result.text));
  }

  /**
   * Stream personalized explanation
   */
  static async *streamExplanation(
    node: KnowledgeNode,
    userContext: string,
    simplify: boolean = false
  ) {
    const relatedContext = await VectorBrain.findRelatedNodes(userContext);
    const contextText = relatedContext.map(m => m.content).join('\n---\n');

    const style = simplify
      ? "Use simple language, metaphors, and examples. Avoid jargon."
      : "Be clear and thorough. Use examples to illustrate concepts.";

    const stream = streamWithFallback({
      prompt: `Explain "${node.title}" in the context of: ${userContext}\n\nRelated concepts:\n${contextText}`,
      systemPrompt: `You are Genie, an adaptive tutor. ${style} Be conversational but precise.`,
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }
}

// ============================================================================
// ORCHESTRATOR (Ties everything together)
// ============================================================================

export class LearningOrchestrator {
  private currentState: LearningState = LearningState.ONBOARDING;
  private iterations: LearningIteration[] = [];
  private currentIteration!: LearningIteration;

  constructor() {
    this.startNewIteration();
  }

  private startNewIteration() {
    this.currentIteration = {
      iteration_number: this.iterations.length + 1,
      state: this.currentState,
      actions_taken: [],
      mastery_progression: [],
      timestamp: new Date()
    };
  }

  /**
   * MAIN LOOP
   * This is what you call on every user message
   */
  async processUserMessage(
    userResponse: string,
    currentNode: KnowledgeNode,
    mastery: MasteryRecord | null,
    conversationHistory: any[] = []
  ): Promise<CognitiveDecision> {

    // Step 1: Classify user intent (fast, no AI)
    const intent = CognitiveEngine.classifyIntent(userResponse);

    // Step 2: Make decision (fast, pure logic)
    const decision = CognitiveEngine.decide(
      this.currentState,
      mastery?.mastery_score || 0,
      conversationHistory.length,
      intent,
      this.currentIteration.actions_taken
    );

    // Step 3: Evaluate mastery (only if user gave a substantive answer)
    let evaluation = { score: mastery?.mastery_score || 0, feedback: "", reasoning: "" };
    if (intent === 'answer' || intent === 'question') {
      evaluation = await MasteryEvaluator.evaluate(userResponse, currentNode);
    }

    // Step 4: Update state
    this.currentState = decision.nextState;
    this.currentIteration.actions_taken.push(decision.action);
    this.currentIteration.mastery_progression.push(evaluation.score);

    // Step 5: Check if iteration is complete (moved to new concept)
    if (decision.action === ActionType.ADVANCE) {
      this.iterations.push(this.currentIteration);
      this.startNewIteration();
    }

    // Step 6: Return full decision
    return {
      action: decision.action,
      next_state: decision.nextState,
      thought_process: `Intent: ${intent}, State: ${this.currentState}, Score: ${evaluation.score}`,
      confidence: 0.85,
      evaluation_score: evaluation.score,
      feedback: evaluation.feedback,
      iteration: { ...this.currentIteration }
    };
  }

  /**
   * Generate content based on decision
   */
  async generateContent(decision: CognitiveDecision, node: KnowledgeNode) {
    switch (decision.action) {
      case ActionType.QUIZ:
        return {
          type: 'quiz',
          data: await ContentGenerator.generateQuiz(node, 'medium')
        };

      case ActionType.CHALLENGE:
        return {
          type: 'challenge',
          data: await ContentGenerator.generateChallenge(node, 'Medium')
        };

      case ActionType.ROADMAP:
        return {
          type: 'roadmap',
          data: { message: "Here's your learning roadmap..." }
        };

      case ActionType.EXPLAIN:
      case ActionType.REMEDIATE:
        return {
          type: 'explanation',
          stream: ContentGenerator.streamExplanation(
            node,
            node.title,
            decision.action === ActionType.REMEDIATE
          )
        };

      default:
        return {
          type: 'message',
          data: { text: "Let's continue!" }
        };
    }
  }

  /**
   * Get analytics on learning progress
   */
  getAnalytics() {
    return {
      total_iterations: this.iterations.length,
      current_state: this.currentState,
      mastery_trend: this.currentIteration.mastery_progression,
      action_distribution: this.calculateActionDistribution()
    };
  }

  private calculateActionDistribution() {
    const allActions = this.iterations.flatMap(it => it.actions_taken);
    const counts = allActions.reduce((acc, action) => {
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {} as Record<ActionType, number>);
    return counts;
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// Initialize once per session
const orchestrator = new LearningOrchestrator();

// On every user message:
const decision = await orchestrator.processUserMessage(
  userResponse,
  currentNode,
  mastery,
  conversationHistory
);

// Generate content based on decision
const content = await orchestrator.generateContent(decision, currentNode);

// Stream to user
if (content.type === 'explanation') {
  for await (const chunk of content.stream) {
    sendToUser(chunk);
  }
} else {
  sendToUser(content.data);
}

// Get analytics
const analytics = orchestrator.getAnalytics();
console.log('Learning Progress:', analytics);
*/