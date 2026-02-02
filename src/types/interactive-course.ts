// ============================================
// Interactive Course Experience - Core Data Models
// TypeScript interfaces for conversational learning sessions
// ============================================

/**
 * Interactive course session between learner and Genie
 */
export interface InteractiveCourseSession {
  id: string;
  courseId: string;
  userId: string;
  currentTopic?: string;
  learningContext: LearningContext;
  progressState: CourseProgressState;
  sessionStartTime: Date;
  lastInteraction: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Individual conversation message in a learning session
 */
export interface ConversationMessage {
  id: string;
  sessionId: string;
  role: 'genie' | 'learner';
  content: string;
  messageType: MessageType;
  metadata?: MessageMetadata;
  timestamp: Date;
  createdAt: Date;
}

/**
 * Types of messages in conversational learning
 */
export type MessageType = 'explanation' | 'question' | 'assessment' | 'quiz' | 'challenge_trigger' | 'challenge' | 'feedback' | 'encouragement' | 'summary' | 'roadmap';

/**
 * Specific learning goal for mastery tracking
 */
export interface LearningGoal {
  id: string;
  text: string;
  status: 'pending' | 'in_progress' | 'mastered';
  confidence: number;
  quizzes_completed?: number;
  challenges_completed?: number;
  evidence?: string;
  timestamp: string;
}

/**
 * Learning context maintained throughout the session
 */
export interface LearningContext {
  currentConcepts: string[];
  masteredConcepts: string[];
  strugglingAreas: string[];
  comprehensionLevel: number; // 0-1 scale
  preferredLearningStyle?: string;
  goals?: LearningGoal[]; // Replaced string[] with strict schema
  masteryScore?: number; // 0-100 overall mastery
}

/**
 * Course progress state within the session
 */
export interface CourseProgressState {
  completedTopics: string[];
  currentTopicProgress: number; // 0-1 scale
  overallCourseProgress: number; // 0-1 scale
  masteredSkills: string[];
  strugglingSkills: string[];
  totalTimeSpent: number; // minutes
  challengesCompleted: number;
  assessmentsCompleted: number;
}

/**
 * Metadata attached to conversation messages
 */
export interface MessageMetadata {
  conceptsCovered?: string[];
  difficultyLevel?: DifficultyLevel;
  learnerEngagement?: number; // 0-1 scale
  responseTime?: number; // seconds
  hintsUsed?: number;
  relatedChallenges?: string[];
  roadmapData?: {
    title: string;
    description: string;
    items: any[];
  };
  quizData?: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    answered?: string;
    isCorrect?: boolean;
  };
  challengeData?: {
    challengeId: string;
    title: string;
    description: string;
    difficulty: DifficultyLevel;
    status: 'pending' | 'started' | 'completed' | 'failed';
  };
}

/**
 * Understanding assessment question and response
 */
export interface UnderstandingAssessment {
  id: string;
  sessionId: string;
  concept: string;
  questionType: QuestionType;
  questionData: AssessmentQuestionData;
  learnerResponse?: string;
  isCorrect?: boolean;
  comprehensionLevel?: number; // 0-1 scale
  feedback?: string;
  createdAt: Date;
  answeredAt?: Date;
}

/**
 * Types of assessment questions
 */
export type QuestionType = 'multiple_choice' | 'short_answer' | 'true_false' | 'drag_drop';

/**
 * Assessment question data structure
 */
export interface AssessmentQuestionData {
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
  explanation?: string;
  hints?: string[];
  answered?: string;
  isCorrect?: boolean;
}

/**
 * Contextual challenge linked to learning session
 */
export interface ContextualChallenge {
  id: string;
  sessionId: string;
  challengeId: string;
  skillId: string;
  currentConcepts: string[];
  conversationalIntro: string;
  connectionToTopic: string;
  difficultyLevel: DifficultyLevel;
  presentedAt: Date;
  completedAt?: Date;
  success?: boolean;
  feedback?: string;
  createdAt: Date;
}

/**
 * Learning loop iteration tracking
 */
export interface LearningLoopIteration {
  id: string;
  sessionId: string;
  iterationNumber: number;
  concept: string;
  explanationCompleted: boolean;
  assessmentCompleted: boolean;
  challengeCompleted: boolean;
  evaluationCompleted: boolean;
  masteryAchieved: boolean;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

/**
 * Difficulty levels for challenges and assessments
 */
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

// ============================================
// Service Interfaces
// ============================================

/**
 * Conversation engine for managing dialogue flow
 */
export interface ConversationEngine {
  initializeSession(courseId: string, userId: string): Promise<InteractiveCourseSession>;
  resumeSession(sessionId: string): Promise<InteractiveCourseSession>;
  processLearnerInput(sessionId: string, input: string): Promise<GenieResponse>;
  generateExplanation(topic: string, context: LearningContext): Promise<string>;
  createAssessmentQuestion(concept: string, difficulty: DifficultyLevel): Promise<AssessmentQuestion>;
  adaptConversationFlow(sessionId: string, comprehensionData: ComprehensionData): Promise<void>;
  endSession(sessionId: string): Promise<boolean>;
}

/**
 * Genie response structure
 */
export interface GenieResponse {
  content: string;
  responseType: GenieResponseType;
  nextAction: NextAction;
  suggestedFollowUp?: string;
  metadata?: Record<string, any>;
}

/**
 * Types of Genie responses
 */
export type GenieResponseType = 'explanation' | 'question' | 'encouragement' | 'challenge_intro' | 'feedback';

/**
 * Next actions in conversation flow
 */
export type NextAction = 'continue_explanation' | 'assess_understanding' | 'deliver_challenge' | 'move_to_next_topic' | 'end_session';

/**
 * Understanding assessment service
 */
export interface UnderstandingAssessmentService {
  createQuickCheck(concept: string, difficulty: DifficultyLevel): Promise<QuickCheckQuestion>;
  evaluateResponse(questionId: string, response: string): Promise<ComprehensionResult>;
  generateAdaptiveQuestions(context: LearningContext): Promise<AssessmentQuestion[]>;
}

/**
 * Quick comprehension check question
 */
export interface QuickCheckQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  concept: string;
  difficulty: DifficultyLevel;
}

/**
 * Assessment question for deeper evaluation
 */
export interface AssessmentQuestion {
  id: string;
  concept: string;
  question: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  expectedAnswer: string;
  rubric: AssessmentRubric;
}

/**
 * Assessment rubric for evaluation
 */
export interface AssessmentRubric {
  fullCredit: string[];
  partialCredit: string[];
  commonMistakes: string[];
  hints: string[];
}

/**
 * Comprehension evaluation result
 */
export interface ComprehensionResult {
  correct: boolean;
  confidenceLevel: number; // 0-1 scale
  conceptMastery: number; // 0-1 scale
  suggestedAction: SuggestedAction;
  feedback: string;
}

/**
 * Suggested actions based on comprehension
 */
export type SuggestedAction = 'proceed' | 'review' | 'practice' | 'challenge';

/**
 * Comprehension data for adaptation
 */
export interface ComprehensionData {
  assessmentId: string;
  concept: string;
  correct: boolean;
  responseTime: number;
  confidenceLevel: number;
  strugglingIndicators: string[];
}

/**
 * Challenge integration service
 */
export interface ChallengeIntegrationService {
  generateContextualChallenge(
    sessionId: string,
    currentConcepts: string[],
    difficulty: DifficultyLevel
  ): Promise<ContextualChallengeData>;
  evaluateChallenge(challengeId: string, submission: string): Promise<ChallengeEvaluation>;
  provideChallengeHints(challengeId: string, attemptCount: number): Promise<string>;
}

/**
 * Contextual challenge data
 */
export interface ContextualChallengeData {
  id: string;
  skillId: string;
  title: string;
  description: string;
  conversationalIntro: string;
  connectionToCurrentTopic: string;
  successCriteria: string[];
  adaptiveHints: string[];
  difficulty: DifficultyLevel;
  estimatedTime: number; // minutes
}

/**
 * Challenge evaluation result
 */
export interface ChallengeEvaluation {
  success: boolean;
  score: number;
  feedback: string;
  masteryIndicators: string[];
  nextSteps: NextSteps;
  xpAwarded?: number;
}

/**
 * Next steps after challenge evaluation
 */
export type NextSteps = 'advance' | 'practice_more' | 'review_concept';

// ============================================
// Session Management
// ============================================

/**
 * Session lifecycle manager
 */
export interface SessionManager {
  createSession(courseId: string, userId: string): Promise<InteractiveCourseSession>;
  resumeSession(userId: string, courseId: string): Promise<InteractiveCourseSession | null>;
  persistSession(session: InteractiveCourseSession): Promise<void>;
  endSession(sessionId: string): Promise<void>;
  getSessionHistory(sessionId: string, limit?: number): Promise<ConversationMessage[]>;
}

/**
 * Session creation options
 */
export interface SessionCreationOptions {
  courseId: string;
  userId: string;
  initialTopic?: string;
  learningGoals?: string[];
  preferredStyle?: string;
}

/**
 * Session resume data
 */
export interface SessionResumeData {
  session: InteractiveCourseSession;
  recentMessages: ConversationMessage[];
  currentIteration?: LearningLoopIteration;
  pendingAssessments: UnderstandingAssessment[];
}

// ============================================
// Analytics and Tracking
// ============================================

/**
 * Learning analytics for session tracking
 */
export interface LearningAnalytics {
  sessionId: string;
  userId: string;
  courseId: string;
  interactionEvents: InteractionEvent[];
  comprehensionMetrics: ComprehensionMetrics;
  engagementMetrics: EngagementMetrics;
}

/**
 * Interaction event tracking
 */
export interface InteractionEvent {
  timestamp: Date;
  eventType: InteractionEventType;
  data: Record<string, any>;
}

/**
 * Types of interaction events
 */
export type InteractionEventType =
  | 'message_sent'
  | 'assessment_completed'
  | 'challenge_attempted'
  | 'hint_requested'
  | 'session_started'
  | 'session_resumed'
  | 'session_ended';

/**
 * Comprehension metrics
 */
export interface ComprehensionMetrics {
  averageResponseTime: number;
  correctAnswerRate: number;
  conceptMasteryScores: Record<string, number>;
  strugglingIndicators: string[];
}

/**
 * Engagement metrics
 */
export interface EngagementMetrics {
  sessionDuration: number;
  messageCount: number;
  questionsAsked: number;
  challengesAttempted: number;
  hintsRequested: number;
}

// ============================================
// Error Types
// ============================================

/**
 * Base error for interactive course system
 */
export class InteractiveCourseError extends Error {
  constructor(
    message: string,
    public code: string,
    public sessionId?: string,
    public userId?: string
  ) {
    super(message);
    this.name = 'InteractiveCourseError';
  }
}

/**
 * Session management errors
 */
export class SessionError extends InteractiveCourseError {
  constructor(message: string, sessionId?: string, userId?: string) {
    super(message, 'SESSION_ERROR', sessionId, userId);
    this.name = 'SessionError';
  }
}

/**
 * Conversation flow errors
 */
export class ConversationError extends InteractiveCourseError {
  constructor(message: string, sessionId: string, public messageId?: string) {
    super(message, 'CONVERSATION_ERROR', sessionId);
    this.name = 'ConversationError';
  }
}

/**
 * Assessment errors
 */
export class AssessmentError extends InteractiveCourseError {
  constructor(message: string, sessionId: string, public assessmentId?: string) {
    super(message, 'ASSESSMENT_ERROR', sessionId);
    this.name = 'AssessmentError';
  }
}

/**
 * Challenge integration errors
 */
export class ChallengeIntegrationError extends InteractiveCourseError {
  constructor(message: string, sessionId: string, public challengeId?: string) {
    super(message, 'CHALLENGE_INTEGRATION_ERROR', sessionId);
    this.name = 'ChallengeIntegrationError';
  }
}