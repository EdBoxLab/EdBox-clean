
export enum WindowType {
  // Core
  NEURON_VISUALIZER = 'NEURON_VISUALIZER',
  CODE_EDITOR = 'CODE_EDITOR',
  QUIZ_CARD = 'QUIZ_CARD',
  TEXT_NOTE = 'TEXT_NOTE',
  BLACKBOARD = 'BLACKBOARD',
  NOTE_WRITER = 'NOTE_WRITER',
  SMART_BOARD = 'SMART_BOARD',
  STUDY_KIT = 'STUDY_KIT',
  DASHBOARD_SUMMARY = 'DASHBOARD_SUMMARY',
  CUSTOM_GENERATED = 'CUSTOM_GENERATED', // New Type for AI Created Widgets

  // Math (10)
  MATH_GRAPHING_CALC = 'MATH_GRAPHING_CALC',
  MATH_GEOMETRY = 'MATH_GEOMETRY',
  MATH_MATRIX = 'MATH_MATRIX',
  MATH_PROBABILITY = 'MATH_PROBABILITY',
  MATH_CONVERTER = 'MATH_CONVERTER',
  MATH_FRACTAL = 'MATH_FRACTAL',
  MATH_PRIME_SPIRAL = 'MATH_PRIME_SPIRAL',
  MATH_FOURIER = 'MATH_FOURIER',
  MATH_LINEAR_ALG = 'MATH_LINEAR_ALG',
  MATH_CALCULUS = 'MATH_CALCULUS',

  // Code (10)
  CODE_REGEX = 'CODE_REGEX',
  CODE_JSON_FORMAT = 'CODE_JSON_FORMAT',
  CODE_DIFF = 'CODE_DIFF',
  CODE_COLOR = 'CODE_COLOR',
  CODE_GIT_VIS = 'CODE_GIT_VIS',
  CODE_ALGO_SORT = 'CODE_ALGO_SORT',
  CODE_BINARY_TREE = 'CODE_BINARY_TREE',
  CODE_SQL_PLAY = 'CODE_SQL_PLAY',
  CODE_REST_CLIENT = 'CODE_REST_CLIENT',
  CODE_MARKDOWN = 'CODE_MARKDOWN',

  // Writing (10)
  WRITING_KANBAN = 'WRITING_KANBAN',
  WRITING_MINDMAP = 'WRITING_MINDMAP',
  WRITING_POMODORO = 'WRITING_POMODORO',
  WRITING_WORD_COUNT = 'WRITING_WORD_COUNT',
  WRITING_RHYME = 'WRITING_RHYME',
  WRITING_THESAURUS = 'WRITING_THESAURUS',
  WRITING_STORYBOARD = 'WRITING_STORYBOARD',
  WRITING_CITATION = 'WRITING_CITATION',
  WRITING_CHAR_PROFILE = 'WRITING_CHAR_PROFILE',
  WRITING_PLOT_STRUCT = 'WRITING_PLOT_STRUCT',

  // STEM (20)
  STEM_PERIODIC_TABLE = 'STEM_PERIODIC_TABLE',
  STEM_MOLECULE = 'STEM_MOLECULE',
  STEM_PENDULUM = 'STEM_PENDULUM',
  STEM_OPTICS = 'STEM_OPTICS',
  STEM_CIRCUIT = 'STEM_CIRCUIT',
  STEM_DNA = 'STEM_DNA',
  STEM_CELL = 'STEM_CELL',
  STEM_SOLAR = 'STEM_SOLAR',
  STEM_TECTONIC = 'STEM_TECTONIC',
  STEM_WEATHER = 'STEM_WEATHER',
  STEM_ECOSYSTEM = 'STEM_ECOSYSTEM',
  STEM_WAVE = 'STEM_WAVE',
  STEM_PROJECTILE = 'STEM_PROJECTILE',
  STEM_GAS_LAWS = 'STEM_GAS_LAWS',
  STEM_PH_SCALE = 'STEM_PH_SCALE',
  STEM_ATOM = 'STEM_ATOM',
  STEM_LOGIC_GATES = 'STEM_LOGIC_GATES',
  STEM_ENGINE = 'STEM_ENGINE',
  STEM_FLUIDS = 'STEM_FLUIDS',
  STEM_ROCKET = 'STEM_ROCKET'
}

export interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
}

export interface PulseWindow {
  id: string;
  type: WindowType;
  title: string;
  x: number; // Ignored in split view
  y: number; // Ignored in split view
  width: number; // Ignored in split view
  height: number; // Ignored in split view
  zIndex: number; // Used for focus/active state
  isMinimized?: boolean; // Controls visibility in the workspace
  metadata?: Record<string, any>; // For deep linking or other window-specific data
  data?: {
    // Code Editor Data Structure
    code?: string; // Legacy/Fallback
    files?: CodeFile[];
    activeFileId?: string;
    language?: string;

    logs?: string[];
    executionTrigger?: number;
    text?: string;

    // Neuron Visualizer
    inputs?: number[];
    weights?: number[];
    bias?: number;

    // Blackboard
    action?: 'write' | 'clear';
    content?: string;
    timestamp?: number;
    imageData?: string;

    [key: string]: any;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  attachments?: {
    type: 'widget-link';
    widgetId: string;
    label: string;
  }[];
}

export interface GenieState {
  isThinking: boolean;
  mood: 'neutral' | 'excited' | 'serene' | 'focused';
  mode: 'regular' | 'tutor';
  currentTopic?: string;
}
