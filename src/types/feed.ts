export interface Comment {
  id: string;
  username: string;
  text: string;
  avatar: string;
}

export type FeedItemType = 'video' | 'story' | 'infographic' | 'quiz' | 'article' | 'challenge' | 'fact' | 'meme' | 'ad' | 'insight' | 'poll' | 'debate';

export type GenieReaction = 'cheer' | 'wink' | 'hint' | 'hype' | 'default' | 'sad';
export type Theme = 'purple-gradient' | 'blue-gradient' | 'green-gradient' | 'orange-gradient' | 'red-gradient' | 'cyan-gradient' | 'rose-gradient';
export type Feedback = 'like' | 'dislike';
export type LoadingState = 'idle' | 'loading' | 'complete' | 'error';
export type ImageGenerationState = 'pending' | 'generating' | 'ready' | 'error';
export type AudioGenerationState = 'idle' | 'generating' | 'ready' | 'error' | 'playing' | 'paused';

export interface BaseFeedItem {
  id: string;
  type: FeedItemType;
  topic: string;
  title: string;
  xp_reward: number;
  genie_reaction: GenieReaction;
  theme: Theme;
  likedByUser: boolean;
  likes: number;
  shares: number;
  comments: Comment[];
  feedback?: Feedback | null;
  courseReference?: string;
}

// === Content Specific Interfaces ===

export interface Slide {
  text: string;
  visualDetail?: string;
  image_prompt?: string;
  imageGenerationState?: ImageGenerationState;
  image_url?: string;
}

export interface StoryFeedItem extends BaseFeedItem {
  type: 'story';
  slides: Slide[];
  visualPrompt: string; // Background/Atmosphere
}

export interface InfographicFeedItem extends BaseFeedItem {
  type: 'infographic';
  points: string[];
  visualPrompt: string;
  imageUrl?: string;
}

export interface VideoFeedItem extends BaseFeedItem {
  type: 'video';
  script: string;
  visualPrompt: string;
  imageUrl?: string; // Thumbnail/Placeholder
  audioBuffer?: AudioBuffer; // For TTS
  video_url?: string; // If we have actual video generation later
}

export interface QuizFeedItem extends BaseFeedItem {
  type: 'quiz';
  question: string; // Main question
  options: string[];
  answer: string; // Correct answer text
  correctIndex: number;
  streak_bonus: boolean;
  explanation?: string; // Why it's correct
  visualPrompt?: string;
  imageUrl?: string;
  imageGenerationState?: ImageGenerationState;
}

export interface ArticleFeedItem extends BaseFeedItem {
  type: 'article';
  summary: string;
  full_article_content: string; // Supports {Term|Def} and [QUIZ]
  visualPrompt?: string;
  imageUrl?: string;
  imageGenerationState?: ImageGenerationState;
}

export interface InsightFeedItem extends BaseFeedItem {
  type: 'insight';
  summary: string;
  full_content: string;
  visualPrompt?: string;
  imageUrl?: string;
  imageGenerationState?: ImageGenerationState;
}

export interface ChallengeFeedItem extends BaseFeedItem {
  type: 'challenge';
  question: string;
  answer: string;
  time_limit: number;
  streak_bonus: boolean;
  visualPrompt?: string;
  imageUrl?: string;
  imageGenerationState?: ImageGenerationState;
}

export interface FactFeedItem extends BaseFeedItem {
  type: 'fact';
  explanation: string;
  visualPrompt: string;
  imageUrl?: string;
  imageGenerationState: ImageGenerationState;
}

export interface PollFeedItem extends BaseFeedItem {
  type: 'poll';
  question: string;
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
  total_votes: number;
  visualPrompt?: string;
}

export interface MemeFeedItem extends BaseFeedItem {
  type: 'meme';
  concept: string;
  meme_template: string; // e.g., 'drake', 'distracted_boyfriend', 'two_buttons', 'expanding_brain'
  top_text: string;
  bottom_text: string;
  visualPrompt: string; // For generating the meme image if not using standard templates
  imageUrl?: string;
  imageGenerationState?: ImageGenerationState;
}

export interface DebateFeedItem extends BaseFeedItem {
  type: 'debate';
  question: string;
  viewpoint_a: string;
  viewpoint_b: string;
  visualPrompt?: string;
  imageUrl?: string;
  imageGenerationState?: ImageGenerationState;
}

// Unified Feed Item Type
export type FeedItem =
  | StoryFeedItem
  | InfographicFeedItem
  | VideoFeedItem
  | QuizFeedItem
  | ArticleFeedItem
  | InsightFeedItem
  | ChallengeFeedItem
  | FactFeedItem
  | MemeFeedItem
  | PollFeedItem
  | DebateFeedItem;

// Legacy alias to support existing code during migration (will be removed)
export type Lesson = FeedItem;

export interface UserPreferences {
  interests: string[];
  learningStyle: 'visual' | 'auditory' | 'theoretical';
  onboarded: boolean;
  tour_completed?: boolean;
}

export interface UserStats {
  xp: number;
  edCoins: number;
  streak: number;
  lastActive?: Date;
}

export type ViewState = 'onboarding' | 'feed' | 'profile';