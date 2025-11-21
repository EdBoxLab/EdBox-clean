
export type Screen = 'allCourses' | 'createCourse' | 'selectFormat' | 'loading' | 'takeCourse' | 'recommendations' | 'moduleView' | 'stats' | 'genieChat';

export enum CourseCategory {
  Programming = 'Programming',
  Math = 'Math',
  History = 'History',
  Physics = 'Physics',
  Chemistry = 'Chemistry',
  Biology = 'Biology',
  Art = 'Art',
  Languages = 'Languages',
  Finance = 'Finance',
  Other = 'Other',
}

export enum EngineType {
    Physics = 'Physics',
    Chemistry = 'Chemistry',
    Biology = 'Biology',
    Coding = 'Coding',
    Art = 'Art',
    Language = 'Language',
    History = 'History',
    Finance = 'Finance',
    Math = 'Math',
    Default = 'Default',
}

export enum CourseFormat {
    MasteryLadder = "Mastery Ladder",
    SystemsLab = "Systems Lab",
    ApprenticeGarage = "Apprentice Garage",
    SocraticTutor = "Socratic Tutor",
    ScenarioSimulator = 'Scenario Simulator',
    OpenWorldSandbox = 'Open-World Sandbox',
    CrisisDrill = 'Crisis Drill',
    ApprenticeshipTrack = 'Apprenticeship Track',
    SocraticDialogue = 'Socratic Dialogue',
    CapstoneBuilder = 'Capstone Builder',
    DesignStudio = 'Design Studio',
    MakerSprint = 'Maker Sprint',
    TimeTravelTour = 'Time-Travel Tour',
    MysteryInvestigation = 'Mystery Investigation',
    CrossfireDebate = 'Crossfire Debate',
    NegotiationTable = 'Negotiation Table',
    DeliberatePracticeLoop = 'Deliberate Practice Loop',
}

export enum LearningMode {
    Fun = 'Fun',
    SkillFocused = 'Skill-focused',
    ExamPrep = 'Exam Prep',
    CreativeExploration = "Creative Exploration",
}

export enum CourseArchetype {
    Academic = 'Academic', // Theoretical, research-focused
    Vocational = 'Vocational', // Practical, skill-based, for a specific job
    Creative = 'Creative', // Arts, design, open-ended projects
    PersonalDevelopment = 'Personal Development', // Self-improvement, hobbies
}


export enum InteractionType {
  PreAssessment = "PreAssessment",
  Info = "Info",
  Fact = "Fact",
  CodingStudio = "CodingStudio",
  ChemistryLab = "ChemistryLab",
  PhysicsSim = "PhysicsSim",
  BiologySim = "BiologySim",
  Quiz = "Quiz",
   DragDrop = 'drag_drop',
  Image = 'image',
  Flashcard = 'flashcard',
  FillInTheBlank = 'fill_in_the_blank',
  MatchingPairs = 'matching_pairs',
  SequencingActivity = 'sequencing_activity',
  SocraticChat = 'socratic_chat',
  ArtStudio = 'art_studio',
  LanguageDialogue = 'language_dialogue',
  HistoryTimeline = 'history_timeline',
  FinancialSandbox = 'financial_sandbox',
  MathExplorer = 'math_explorer',
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface DragDropItem {
  id: string;
  text: string;
}

export interface FlashcardItem {
    front: string;
    back: string;
}

export interface MathStep {
    explanation: string;
    formula?: string;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  quizOptions: QuizOption[];
  correctAnswer: string;
}

export interface AssessmentCriterion {
  name: string;
  description: string;
  maxPoints: number;
}

export interface AssessmentRubric {
  criteria: AssessmentCriterion[];
  scoringGuide?: { [key: number]: string };
}

export interface MatchingPair {
  id: string;
  prompt: string;
  match: string;
}

export interface SequenceItem {
  id: string;
  text: string;
}

export interface TimelineEvent {
    id: string;
    year: number;
    title: string;
    description: string;
}

export interface StockDataPoint {
    name: string;
    price: number;
}

export interface Chemical {
    formula: string;
    state: 's' | 'l' | 'g' | 'aq';
}

export interface Interaction {
  id: string;
  type: InteractionType;
  title: string;
  content: string;
  // Quiz
  quizOptions?: QuizOption[];
  correctAnswer?: string;
  // Code
  starterCode?: string;
  explanation?: string;
  // Added `number[]` to the type of `solution` to support number array solutions for interactions like balancing chemistry equations.
  solution?: string | { [key: string]: string } | string[] | number[];
  demonstrationCode?: string;
  expectedOutput?: string;
  // DragDrop
  dragItems?: DragDropItem[];
  dropTargets?: DragDropItem[];
  // Image
  imageUrl?: string;
  altText?: string;
  // STEM Sims
  simulationType?: 'F=ma' | 'projectile_motion' | 'pendulum_motion' | 'electric_field' | 'snells_law' | 'states_of_matter' | 'balancing_equation' | 'titration' | 'solution_mixer' | 'cell_explorer' | 'ecosystem_balance' | 'graphing_calculator' | 'geometric_sandbox' | 'interactive_solver';
  initialParams?: { [key: string]: any };
  reactants?: Chemical[];
  products?: Chemical[];
  // Flashcard
  cards?: FlashcardItem[];
  // Math
  problem?: string;
  steps?: MathStep[];
  // PreAssessment
  questions?: QuizQuestion[];
  // Language Practice
  promptToSpeak?: string;
  targetLanguage?: string;
  // New Types
  matchingPairs?: MatchingPair[];
  sequenceItems?: SequenceItem[];
  // History
  events?: TimelineEvent[];
  // Finance
  initialPortfolio?: { stocks: number; bonds: number; cash: number };
  marketData?: StockDataPoint[];
  // Rubric
  rubric?: AssessmentRubric;
  // Art Studio Mode
  mode?: 'drawing' | 'writing';
}

export interface Module {
  id: string;
  title: string;
  estimatedTime: string;
  content: string;
  interactions: Interaction[];
  isCompleted: boolean;
  completedInteractionIds: string[];
}

export interface RoadmapNode {
  id:string;
  title: string;
  level: 'Foundations' | 'Core' | 'Advanced' | 'Capstone';
  modules: Module[];
}

export interface Gamification {
  xp: number;
  streak: number;
  edCoins: number;
  badges: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  subject: string;
  category: CourseCategory;
  engine: EngineType;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
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


export interface RecommendedFormat {
    format: CourseFormat;
    description: string;
}

export interface Recommendation {
    id: string;
    title: string;
    reason: string;
    type: 'course' | 'improvement_area';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export type PrebuiltVoice = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export type CardType = 'quiz' | 'video' | 'article' | 'challenge' | 'fact' | 'story';
export type GenieReaction = 'cheer' | 'wink' | 'hint' | 'hype' | 'default' | 'sad';
export type Theme = 'purple-gradient' | 'blue-gradient' | 'green-gradient' | 'orange-gradient' | 'red-gradient';
export type Feedback = 'like' | 'dislike';
export type AudioGenerationState = 'idle' | 'generating' | 'ready' | 'error' | 'playing' | 'paused';


export interface BaseFeedItem {
  id: string;
  type: CardType;
  xp_reward: number;
  genie_reaction: GenieReaction;
  theme: Theme;
  feedback?: Feedback | null;
}

export interface QuizFeedItem extends BaseFeedItem {
  type: 'quiz';
  title: string;
  options: string[];
  answer: string;
  streak_bonus: boolean;
  image_prompt?: string;
  imageGenerationState?: ImageGenerationState;
  image_url?: string;
}

export interface ChallengeFeedItem extends BaseFeedItem {
  type: 'challenge';
  title: string;
  question: string;
  answer: string; // Could be a word for fill-in-the-blank
  streak_bonus: boolean;
  time_limit: number;
  image_prompt?: string;
  imageGenerationState?: ImageGenerationState;
  image_url?: string;
}

export type VideoGenerationState = 'pending' | 'generating' | 'ready' | 'error';
export type ImageGenerationState = 'pending' | 'generating' | 'ready' | 'error';

export interface VideoFeedItem extends BaseFeedItem {
  type: 'video';
  title: string;
  prompt: string;
  placeholder_image_prompt: string;
  generationState: VideoGenerationState;
  video_url?: string;
  placeholderGenerationState: ImageGenerationState;
  placeholder_image_url?: string;
}

export interface ArticleFeedItem extends BaseFeedItem {
  type: 'article';
  title: string;
  summary: string;
  full_article_content: string;
  image_prompt?: string;
  imageGenerationState?: ImageGenerationState;
  image_url?: string;
}

export interface FactFeedItem extends BaseFeedItem {
  type: 'fact';
  title: string;
  explanation: string;
  image_prompt: string;
  imageGenerationState: ImageGenerationState;
  image_url?: string;
}

export interface StorySlide {
  text: string;
  image_prompt: string;
  imageGenerationState: ImageGenerationState;
  image_url?: string;
}

export interface StoryFeedItem extends BaseFeedItem {
  type: 'story';
  title: string;
  slides: StorySlide[];
}


export type FeedItem = QuizFeedItem | VideoFeedItem | ArticleFeedItem | ChallengeFeedItem | FactFeedItem | StoryFeedItem;

export interface UserStats {
  xp: number;
  edCoins: number;
  streak: number;
}

export type CitationStyle = 'APA' | 'MLA' | 'Chicago';

export interface Source {
  id: string; // Unique identifier for the source
  name: string;
  type: 'text' | 'file' | 'url';
  content: string; // The actual text content, or URL
}

export interface Citation {
  source_id: string; // Corresponds to the id of a Source
  quote: string;
}

export interface TieredSummary {
  one_sentence: string;
  one_paragraph: string;
  one_page: string;
  citations: Citation[];
}

export interface GeneratedImage {
  title: string;
  prompt: string;
  image_base64?: string; // Base64 encoded image data
}

export interface GeneratedAudio {
  title: string;
  script: string;
  audio_base64?: string; // Base64 encoded audio data (PCM)
}

export interface Flashcard {
  question: string;
  answer: string;
  citations: Citation[];
}

export interface QuizItem {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  citations: Citation[];
}

export interface ResearchPackage {
  id: number; // Using timestamp for simplicity
  title: string;
  goal: string;
  audience: string;
  citationStyle: CitationStyle;
  sources: Source[];
  summary: TieredSummary;
  image: GeneratedImage;
  audio_dialogue: GeneratedAudio;
  flashcards: Flashcard[];
  quiz: QuizItem[];
}
