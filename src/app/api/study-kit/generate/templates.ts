export const QUIZ_TEMPLATE = `
Generate 15 high-quality multiple-choice questions.

CRITICAL REQUIREMENTS:
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

Output format (ONLY JSON, no other text):
[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": 2,
    "explanation": "Paris is correct (index 2, third option).",
    "difficulty": "Easy"
  }
]
`;

export const FLASHCARD_TEMPLATE = `
Generate 15-20 professional flashcards that focus on key concepts, terminology, and critical insights.
Avoid one-word answers; provide clear, descriptive definitions.
Each card should include:
- Front: The concept or question.
- Back: The detailed explanation or answer.
- Hint: A subtle clue to help the learner.

Format as a JSON array:
[
  {
    "front": "string",
    "back": "string",
    "hint": "string"
  }
]
`;

export const NOTES_TEMPLATE = `
Generate comprehensive, professionally structured study notes.
Use Markdown for formatting. The notes should be detailed, reliable, and cover:
1. Overview: High-level overview.
2. Core Concepts: Detailed breakdown of key ideas with definitions.
3. Examples & Use Cases: Concrete examples to illustrate concepts.
4. Deep Dive: Nuanced details, edge cases, or advanced context.
5. Common Pitfalls / Misconceptions: What to avoid or clarify.
6. Key Takeaways: Bulleted list of critical points.

Structure the response with clear H1, H2, and H3 headers.
`;

export const MINDMAP_TEMPLATE = `
Generate a structured, hierarchical mind map of the topic.
The mind map should be beautigully organized and logically consistent.

Format as a strict JSON object with a central node and branches:
{
  "central": "Main Topic Name",
  "branches": [
    {
      "topic": "Major Category",
      "subtopics": ["Sub-point 1", "Sub-point 2", "Sub-point 3"],
      "details": "Brief summary of this category"
    }
  ]
}
`;
