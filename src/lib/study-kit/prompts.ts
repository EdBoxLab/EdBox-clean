import { ContentType, NoteType } from './types';
import { NOTE_TEMPLATES, MINDMAP_TEMPLATE } from './constants';
import { extractContextForType, isProgrammingTopic } from './utils';

export function buildPrompt(
    type: ContentType,
    prompt: string,
    isAppend: boolean = false,
    customInstructions: string = '',
    itemCount?: number,
    notesDepth?: string
): string {
    const contextualPrompt = extractContextForType(type, prompt);
    const base = `Topic/Content Source: "${contextualPrompt}"\n\n`;
    const count = itemCount || (isAppend ? 10 : 15);

    switch (type) {
        case 'quizzes':
            return base + `Generate EXACTLY ${count} high-quality multiple-choice questions.

QUESTION QUALITY REQUIREMENTS:
- Include questions at multiple Bloom's Taxonomy levels:
  • 30% Remember/Understand (definitions, recall)
  • 40% Apply/Analyze (scenarios, problem-solving)
  • 30% Evaluate/Create (judgment calls, synthesis)
- Each question MUST include a "bloomLevel" field

CRITICAL REQUIREMENTS:
- Generate EXACTLY ${count} questions. No more, no less.
- The output must be a single continuous set of ${count} questions.
- correctAnswer MUST be 0, 1, 2, or 3 (NOT 1-4!)
- 0 = first option
- 1 = second option  
- 2 = third option
- 3 = fourth option

IMPORTANT FOR MATH/SCIENCE TOPICS:
- Write mathematical expressions in plain text (e.g., "x^2 + 2x + 1" instead of LaTeX)
- Use words for operations when clearer (e.g., "the square root of 16" or "sqrt(16)")
- Avoid special Unicode math symbols that may break JSON
- For fractions, use "/" notation (e.g., "3/4" or "three-fourths")
- Keep all text ASCII-safe

CRITICAL: correctAnswer is 0-indexed (0=first option, 3=fourth option)
Output ONLY JSON array:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","difficulty":"Easy","bloomLevel":"apply"}]`;

        case 'flashcards':
            return base + `Generate EXACTLY ${count} professional flashcards that focus on key concepts, terminology, and critical insights.
Generate EXACTLY ${count} flashcards. No more, no less.
The output must be a single continuous set of ${count} flashcards.
Avoid one-word answers; provide clear, descriptive definitions.
Each card should include:
- Front: The concept or question.
- Back: The detailed explanation or answer.
- Hint: A subtle clue to help the learner.
- ExamRelevance: A score from 1-5 indicating how likely this concept appears on exams (5 = almost certain).
- KeyTakeaway: A single sentence summarizing why this concept matters.

Format as a JSON array:
[
  {
    "front": "string",
    "back": "string",
    "hint": "string",
    "examRelevance": 4,
    "keyTakeaway": "string"
  }
]
\nOutput ONLY JSON array.`;

        case 'mindmaps':
            return base + MINDMAP_TEMPLATE + '\nOutput ONLY JSON object.';

        case 'notes':
            return buildNotePrompt(prompt, notesDepth, customInstructions);
        default:
            return '';
    }
}

export function buildNotePrompt(
    prompt: string,
    notesDepth?: string,
    customInstructions?: string,
    noteType?: NoteType
): string {
    const contextualPrompt = extractContextForType('notes', prompt);
    const base = `Topic/Content Source: "${contextualPrompt}"\n\n`;
    const isCodeRelated = isProgrammingTopic(prompt);
    let depthInstructions = '';

    switch (notesDepth) {
        case 'summary':
            depthInstructions = 'Focus: High-level overview. Provide a concise but comprehensive summary of the key points.';
            break;
        case 'deepdive':
            depthInstructions = 'Focus: Deep Dive. Provide detailed explanations, intricate nuances, and in-depth analysis of every aspect.';
            break;
        case 'coverage':
            depthInstructions = 'Focus: Balanced mix of breadth and depth. Ensure all major topics are covered with sufficient detail.';
            break;
        case 'shi':
            depthInstructions = 'Focus: SHI Mode (Experimental). Provide a creative, unconventional, and highly engaging perspective. Use analogies, storytelling, and unique insights while maintaining academic accuracy.';
            break;
        default:
            depthInstructions = 'Focus: Comprehensive coverage.';
    }

    const template = noteType ? NOTE_TEMPLATES[noteType] : NOTE_TEMPLATES.deepExplanation;
    let notesPrompt = base + depthInstructions + '\n\n' + template;

    if (!isCodeRelated) {
        notesPrompt += `\n\n**EXTRA CRITICAL REMINDER FOR THIS TOPIC:**
This topic ("${prompt}") is NOT about programming or software development.
Therefore, you MUST NOT include ANY code examples, function definitions, or programming syntax.
Use plain text explanations, mathematical notation, and prose examples only.
Any code-like syntax will be considered an error.`;
    }

    if (customInstructions) {
        notesPrompt += `\n\nCUSTOM INSTRUCTIONS FOR THESE NOTES: ${customInstructions}\nIMPORTANT: Please follow these details strictly.`;
    }
    return notesPrompt;
}
