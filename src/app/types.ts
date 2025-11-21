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
