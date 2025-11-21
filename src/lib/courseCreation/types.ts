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
