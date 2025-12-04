export interface Comment {
  id: string;
  username: string;
  text: string;
  avatar: string;
}

export type LessonType = 'video' | 'story' | 'infographic';

export interface Slide {
  text: string;
  visualDetail?: string;
}

export interface Lesson {
  id: string;
  type: LessonType;
  topic: string;
  title: string;
  script?: string;
  slides?: Slide[];
  points?: string[];
  keyTakeaway: string;
  visualPrompt: string;
  quiz?: Quiz;
  imageUrl?: string;
  audioBuffer?: AudioBuffer;
  likes: number;
  likedByUser: boolean;
  shares: number;
  comments: Comment[];
}

export interface Quiz {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface UserPreferences {
  interests: string[];
  learningStyle: 'visual' | 'auditory' | 'theoretical';
  onboarded: boolean;
}

export type ViewState = 'onboarding' | 'feed' | 'profile';

export enum LoadingState {
  IDLE,
  LOADING,
  COMPLETE,
  ERROR
}