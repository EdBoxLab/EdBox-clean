export type DocumentType = 
  | 'textbook' 
  | 'research' 
  | 'technical' 
  | 'article' 
  | 'reference' 
  | 'narrative' 
  | 'mixed'
  | 'unknown';

export type StructuralPattern = 
  | 'hierarchical' 
  | 'sequential' 
  | 'comparative' 
  | 'problem-solution' 
  | 'chronological' 
  | 'spiral';

export type ComplexityLevel = 'beginner' | 'intermediate' | 'advanced' | 'mixed';

export type DetectionMethod = 'explicit' | 'semantic' | 'fallback';

export interface DocumentAnalysis {
  detectedType: DocumentType;
  structuralPattern: StructuralPattern;
  overallTheme: string;
  targetAudience: string;
  complexity: ComplexityLevel;
}

export interface DetectedChapter {
  id: string;
  chapterNumber: number;
  title: string;
  summary: string;
  keyTopics: string[];
  learningObjectives: string[];
  startPosition: number;
  endPosition: number;
  contentPreview: string;
  sourceContext: string;
  confidence: number;
  boundaryReason: string;
  relationshipToPrevious: string | null;
  relationshipToNext: string | null;
  detectionMethod: DetectionMethod;
}

export interface ChapterRelationships {
  overallFlow: string;
  prerequisites: Record<string, string[]>;
}

export interface ChapterRecommendations {
  suggestedStudyOrder: number[];
  optionalChapters: number[];
  coreChapters: number[];
  estimatedStudyTime: Record<string, string>;
  notes?: string;
}

export interface ChapterDetectionResult {
  documentAnalysis: DocumentAnalysis;
  chapters: DetectedChapter[];
  chapterRelationships: ChapterRelationships;
  recommendations: ChapterRecommendations;
}

export interface ChapterContent {
  id: string;
  title: string;
  summary: string;
  quizzes?: any[];
  flashcards?: any[];
  notes?: {
    deepExplanation: string;
    cheatsheet: string;
    application: string;
    tables: string;
  };
  mindmaps?: {
    central: string;
    branches: Array<{
      topic: string;
      subtopics: string[];
      details: string;
    }>;
  };
}

export interface StudyKitWithChapters {
  chapters: ChapterContent[];
  chaptersMeta: {
    detectedAt: string;
    detectionModel: string;
    userModified: boolean;
    documentAnalysis: DocumentAnalysis;
  };
}

export interface ChapterEditAction {
  type: 'edit_title' | 'edit_summary' | 'merge' | 'split' | 'delete' | 'reorder' | 'add';
  chapterIds: string[];
  data?: Record<string, any>;
}

export interface ChapterDetectionOptions {
  minChapters?: number;
  maxChapters?: number;
  minChapterLength?: number;
  preferExplicit?: boolean;
  maxTokens?: number;
  model?: 'versatile' | 'oss' | 'vision' | 'llama-3.3-70b-versatile';
}

export const DEFAULT_DETECTION_OPTIONS: ChapterDetectionOptions = {
  minChapters: 1,
  maxChapters: 10,
  minChapterLength: 3000,
  preferExplicit: true,
  maxTokens: 4000,
  model: 'llama-3.3-70b-versatile'
};
