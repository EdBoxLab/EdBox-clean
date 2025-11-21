export type CardType = 'quiz' | 'article' | 'challenge' | 'fact' | 'story';
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

// export type VideoGenerationState = 'pending' | 'generating' | 'ready' | 'error';
export type ImageGenerationState = 'pending' | 'generating' | 'ready' | 'error';

/*
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
*/

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


export type FeedItem = QuizFeedItem | ArticleFeedItem | ChallengeFeedItem | FactFeedItem | StoryFeedItem;

export interface UserStats {
  xp: number;
  edCoins: number;
  streak: number;
}
