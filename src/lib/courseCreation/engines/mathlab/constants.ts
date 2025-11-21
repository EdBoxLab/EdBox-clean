export const APP_NAME = "MathStudio";

// Using Gemini 3 for complex reasoning as requested
export const REASONING_MODEL = 'gemini-3-pro-preview'; 

// Using Flash TTS for voice generation
export const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

export const DEFAULT_GRAPH_RANGE = {
  min: -10,
  max: 10,
  step: 0.5
};

export const SAMPLE_PROBLEMS = [
  "Solve x^2 + 5x + 6 = 0",
  "Plot sin(x) * x for x from -10 to 10",
  "Find the derivative of x^3 - 2x + 1",
  "Calculate the integral of e^x from 0 to 1"
];
