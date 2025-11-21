export enum ModuleType {
  SYNTAX = 'SYNTAX',
  PHONETICS = 'PHONETICS',
  SEMANTICS = 'SEMANTICS',
  TRANSLATION = 'TRANSLATION',
  CONVERSATION = 'CONVERSATION'
}

// Syntax Tree Types
export interface SyntaxNode {
  name: string; // The label (e.g., "NP", "VP", "Dog")
  attributes?: { [key: string]: string }; // e.g., { pos: "noun" }
  children?: SyntaxNode[];
}

// Phonetics Types
export interface Phoneme {
  symbol: string; // IPA symbol
  description: string; // e.g., "Voiceless bilabial plosive"
  type: 'consonant' | 'vowel' | 'other';
  duration?: number; // simulated ms
}

export interface PhoneticsAnalysis {
  ipa: string;
  segments: Phoneme[];
  stressPattern: string;
}

// Semantics Types
export interface SemanticNode {
  id: string;
  label: string; // The word or concept
  type: 'entity' | 'concept' | 'attribute';
  value: number; // Importance/Centrality 1-10
}

export interface SemanticLink {
  source: string;
  target: string;
  relation: string; // e.g., "agent", "patient", "is_a"
}

export interface SemanticGraph {
  nodes: SemanticNode[];
  links: SemanticLink[];
}

// Translation Types
export interface TranslationResult {
  original: string;
  translated: string;
  targetLanguage: string;
  alignment: Array<{ originalWord: string; translatedWord: string; confidence: number }>;
}