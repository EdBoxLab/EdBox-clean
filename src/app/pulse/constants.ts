import { WindowType } from './types';

export const INITIAL_WINDOWS = [];

// Helper to generate default configs for groups
const createConfig = (title: string, w = 400, h = 300) => ({ defaultTitle: title, defaultWidth: w, defaultHeight: h });

export const WIDGET_CONFIGS: Record<string, { defaultTitle: string, defaultWidth: number, defaultHeight: number }> = {
  [WindowType.CUSTOM_GENERATED]: createConfig('Custom Tool', 600, 600),
  // Core
  [WindowType.NEURON_VISUALIZER]: createConfig('Interactive Neuron Model', 600, 450),
  [WindowType.CODE_EDITOR]: createConfig('Live Code Execution', 500, 500),
  [WindowType.QUIZ_CARD]: createConfig('Knowledge Check', 400, 500),
  [WindowType.TEXT_NOTE]: createConfig('Quick Note', 300, 200),
  [WindowType.BLACKBOARD]: createConfig('SmartBoard', 600, 400),
  [WindowType.SMART_BOARD]: createConfig('SmartBoard', 600, 600),
  [WindowType.STUDY_KIT]: createConfig('Study Kit', 800, 600),
  [WindowType.DASHBOARD_SUMMARY]: createConfig('Overview', 400, 500),
  [WindowType.NOTE_WRITER]: createConfig('Rich Notes', 400, 500),
  [WindowType.SKILL_GRAPH]: createConfig('Learning Path', 800, 600),
  [WindowType.SKILL_SESSION]: createConfig('Skill Session', 800, 600),

  // Math
  [WindowType.MATH_GRAPHING_CALC]: createConfig('Graphing Calculator', 500, 400),
  [WindowType.MATH_GEOMETRY]: createConfig('Geometry Board', 500, 500),
  [WindowType.MATH_MATRIX]: createConfig('Matrix Solver', 400, 400),
  [WindowType.MATH_PROBABILITY]: createConfig('Probability Sim', 450, 350),
  [WindowType.MATH_CONVERTER]: createConfig('Unit Converter', 300, 400),
  [WindowType.MATH_FRACTAL]: createConfig('Fractal Explorer', 500, 500),
  [WindowType.MATH_PRIME_SPIRAL]: createConfig('Prime Spiral', 450, 450),
  [WindowType.MATH_FOURIER]: createConfig('Fourier Series', 600, 400),
  [WindowType.MATH_LINEAR_ALG]: createConfig('Linear Algebra', 500, 400),
  [WindowType.MATH_CALCULUS]: createConfig('Calculus Viz', 500, 400),

  // Code
  [WindowType.CODE_REGEX]: createConfig('Regex Tester', 500, 300),
  [WindowType.CODE_JSON_FORMAT]: createConfig('JSON Formatter', 500, 500),
  [WindowType.CODE_DIFF]: createConfig('Diff Viewer', 700, 500),
  [WindowType.CODE_COLOR]: createConfig('Color Picker', 300, 350),
  [WindowType.CODE_GIT_VIS]: createConfig('Git Visualizer', 600, 400),
  [WindowType.CODE_ALGO_SORT]: createConfig('Sorting Algorithm', 600, 300),
  [WindowType.CODE_BINARY_TREE]: createConfig('Binary Tree', 500, 400),
  [WindowType.CODE_SQL_PLAY]: createConfig('SQL Playground', 600, 400),
  [WindowType.CODE_REST_CLIENT]: createConfig('REST Client', 500, 500),
  [WindowType.CODE_MARKDOWN]: createConfig('Markdown Preview', 500, 500),

  // Writing
  [WindowType.WRITING_KANBAN]: createConfig('Kanban Board', 700, 400),
  [WindowType.WRITING_MINDMAP]: createConfig('Mind Map', 600, 500),
  [WindowType.WRITING_POMODORO]: createConfig('Focus Timer', 300, 200),
  [WindowType.WRITING_WORD_COUNT]: createConfig('Word Counter', 300, 200),
  [WindowType.WRITING_RHYME]: createConfig('Rhyme Finder', 350, 400),
  [WindowType.WRITING_THESAURUS]: createConfig('Thesaurus', 350, 400),
  [WindowType.WRITING_STORYBOARD]: createConfig('Storyboard', 700, 500),
  [WindowType.WRITING_CITATION]: createConfig('Citation Gen', 400, 300),
  [WindowType.WRITING_CHAR_PROFILE]: createConfig('Character Profile', 400, 500),
  [WindowType.WRITING_PLOT_STRUCT]: createConfig('Plot Structure', 600, 400),

  // STEM
  [WindowType.STEM_PERIODIC_TABLE]: createConfig('Periodic Table', 800, 500),
  [WindowType.STEM_MOLECULE]: createConfig('Molecule Viewer', 500, 500),
  [WindowType.STEM_PENDULUM]: createConfig('Pendulum Lab', 500, 400),
  [WindowType.STEM_OPTICS]: createConfig('Optics Bench', 600, 400),
  [WindowType.STEM_CIRCUIT]: createConfig('Circuit Builder', 600, 500),
  [WindowType.STEM_DNA]: createConfig('DNA Model', 400, 600),
  [WindowType.STEM_CELL]: createConfig('Cell Structure', 500, 500),
  [WindowType.STEM_SOLAR]: createConfig('Solar System', 700, 600),
  [WindowType.STEM_TECTONIC]: createConfig('Tectonic Plates', 600, 400),
  [WindowType.STEM_WEATHER]: createConfig('Weather Sim', 500, 400),
  [WindowType.STEM_ECOSYSTEM]: createConfig('Ecosystem', 600, 450),
  [WindowType.STEM_WAVE]: createConfig('Wave Interference', 600, 300),
  [WindowType.STEM_PROJECTILE]: createConfig('Projectile Motion', 600, 400),
  [WindowType.STEM_GAS_LAWS]: createConfig('Gas Laws', 500, 400),
  [WindowType.STEM_PH_SCALE]: createConfig('pH Scale', 600, 300),
  [WindowType.STEM_ATOM]: createConfig('Atom Builder', 500, 500),
  [WindowType.STEM_LOGIC_GATES]: createConfig('Logic Gates', 600, 400),
  [WindowType.STEM_ENGINE]: createConfig('Engine Cycles', 500, 400),
  [WindowType.STEM_FLUIDS]: createConfig('Fluid Dynamics', 600, 400),
  [WindowType.STEM_ROCKET]: createConfig('Rocket Launch', 400, 600),
};
