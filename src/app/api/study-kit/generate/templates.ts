
export const QUIZ_TEMPLATE = `
Generate 10 highly professional and educationally sound multiple-choice questions.
Each question must include:
- A clear, concise question stems.
- 4 plausible options (A, B, C, D).
- The index of the correct answer (0-3).
- A detailed explanation of why the correct answer is right and why others are wrong.
- A difficulty level (Easy, Medium, Hard).

Format the output as a JSON array of objects:
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswer": number,
    "explanation": "string",
    "difficulty": "string"
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
1. Executive Summary: High-level overview.
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
