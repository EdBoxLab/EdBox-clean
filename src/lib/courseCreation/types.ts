export enum InteractionType {
  Info = 'info',
  Fact = 'fact',
  Quiz = 'quiz',
  Flashcard = 'flashcard',
  SocraticChat = 'socratic_chat',
  FillInTheBlank = 'fill_in_the_blank',
  SequencingActivity = 'sequencing_activity',
  CodingStudio = 'coding_studio',
  PhysicsSim = 'physics_sim',
  ChemistryLab = 'chemistry_lab',
  BiologySim = 'biology_sim',
  ArtStudio = 'art_studio',
  HistoryTimeline = 'history_timeline',
  FinancialSandbox = 'financial_sandbox',
  MathExplorer = 'math_explorer',
  LanguageDialogue = 'language_dialogue',
  MatchingPairs = 'matching_pairs',
  DragDrop = 'drag_drop'
}

export enum CourseCategory {
  Technology = 'Technology',
  Science = 'Science',
  Business = 'Business',
  Arts = 'Arts',
  Humanities = 'Humanities',
  Health = 'Health',
  Other = 'Other'
}

export enum CourseFormat {
  MasteryLadder = 'Mastery Ladder',
  ScenarioSimulator = 'Scenario Simulator',
  CapstoneBuilder = 'Capstone Builder',
  SocraticDialogue = 'Socratic Dialogue',
  GuidedTour = 'Guided Tour',
  SurvivalGuide = 'Survival Guide'
}

export enum EngineType {
  Default = 'Default',
  Coding = 'Coding',
  Physics = 'Physics',
  Chemistry = 'Chemistry',
  Biology = 'Biology',
  Art = 'Art',
  History = 'History',
  Finance = 'Finance',
  Math = 'Math',
  Language = 'Language'
}

export enum LearningMode {
  Structured = 'Structured',
  Guided = 'Guided',
  Expert = 'Expert'
}

export enum CourseArchetype {
  Academic = 'Academic',
  Corporate = 'Corporate',
  Hobbyist = 'Hobbyist',
  Practical = 'Practical'
}

export interface RecommendedFormat {
  format: CourseFormat;
  description: string;
}

export interface Gamification {
  xp: number;
  streak: number;
  edCoins: number;
  badges: string[];
}

export interface Interaction {
  id: string;
  type: InteractionType;
  title: string;
  content: string;
  quizOptions?: { id: string; text: string }[];
  correctAnswer?: string;
  explanation?: string;
  starterCode?: string;
  solution?: string;
  simulationType?: string;
  reactants?: { formula: string, state: string }[];
  products?: { formula: string, state: string }[];
  cards?: { front: string, back: string }[];
  events?: { id: string, year: number, title: string, description: string }[];
  dragItems?: { id: string, text: string }[];
  dropTargets?: { id: string, text: string }[];
  matchingPairs?: { id: string, prompt: string, match: string }[];
  sequenceItems?: { id: string, text: string }[];
  initialPortfolio?: { stocks: number, bonds: number, cash: number };
  marketData?: { name: string, price: number }[];
  problem?: string;
  steps?: { explanation: string, formula: string }[];
  targetLanguage?: string;
  promptToSpeak?: string;
  rubric?: { criteria: { name: string, description: string, maxPoints: number }[] };
  mode?: string;
}

export interface Module {
  id: string;
  title: string;
  estimatedTime: string;
  content: string;
  interactions: Interaction[];
  isCompleted: boolean;
  completedInteractionIds: string[];
  genieStrategy?: string;
}

export interface RoadmapNode {
  id: string;
  title: string;
  level: string;
  modules: Module[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  subject: string;
  category: CourseCategory;
  engine: EngineType;
  level: string;
  progress: number;
  roadmap: RoadmapNode[];
  gamification: Gamification;
  lastActivity: string;
  coverImageUrl: string;
  courseArchetype: CourseArchetype;
  format: CourseFormat;
  mode: LearningMode;
}

export interface AgentState {
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  message: string;
  percentage: number;
}

// ==========================================
// ENGINE-NATIVE LEARNING TYPES (NEW)
// ==========================================

export interface SkillNode {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  engine: string; // Using string to match database storage
  level: string; // 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  estimatedMinutes: number;
  prerequisites: string[]; // IDs of other SkillNodes
  masteryThreshold: {
    minSuccessRate: number;
    challengesRequired: number;
  };
  xpReward: number;
  vectorEmbedding?: number[]; // For AI similarity matching
}

export interface SkillGraph {
  id: string;
  userId: string;
  goal: string;
  nodes: SkillNode[];
  edges: { from: string; to: string }[]; // Directed graph
  createdAt: string;
  updatedAt: string;
}

export interface Challenge {
  id: string;
  skillId: string;
  title: string;
  description: string;
  engine: string; // Using string to match database storage
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedMinutes?: number;
  xpReward?: number;

  // Context for the AI to generate the challenge
  context?: string;

  // Engine-specific payload
  starterCode?: string; // For Coding
  initialState?: any; // For Physics/Chem/Math
  validationCriteria: {
    type: 'output_match' | 'function_test' | 'ai_eval' | 'value_check';
    expected?: any;
    rubric?: string; // For AI eval
  }[];

  // Immersive Experience (New)
  warmUp?: {
    description: string;
    type: 'concept_tap' | 'ordering' | 'true_false';
    steps: {
      prompt: string;
      options?: string[];
      correctAnswer: string;
    }[];
  };

  interactivePayloads?: {
    type: 'quiz' | 'drag_drop' | 'slider_model' | 'sort';
    data: any; // Type-specific data
  }[];

  hints: string[];
  explanation: string;
}

export interface UserCompetency {
  userId: string;
  skillId: string;
  masteryLevel: number; // 0.0 to 1.0
  challengesCompleted: string[];
  lastPracticed: string;
  provenBy: {
    challengeId: string;
    timestamp: string;
    artifactUrl?: string; // Link to saved code/project
  }[];
}

export interface PortfolioItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  skillsDemonstrated: string[]; // Skill IDs
  engine: EngineType;
  artifactUrl: string; // URL to the project/creation
  thumbnailUrl: string;
  aiAssessment?: string; // Summary of what this proves
  createdAt: string;
}
