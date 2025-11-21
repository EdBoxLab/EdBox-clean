export enum BrushType {
  PENCIL = 'Pencil',
  INK = 'Ink',
  MARKER = 'Marker',
  ERASER = 'Eraser'
}

export interface DrawingState {
  isDrawing: boolean;
  color: string;
  brushSize: number;
  brushType: BrushType;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string; // base64 data url
  audioData?: Uint8Array; // Raw PCM data for playback
}

export interface AIAnalysisResult {
  critique: string;
  suggestions: string[];
}

export enum ViewMode {
  CANVAS = 'canvas',
  GALLERY = 'gallery',
  SETTINGS = 'settings'
}