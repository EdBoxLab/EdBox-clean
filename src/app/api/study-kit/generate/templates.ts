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
Generate comprehensive, professionally structured study notes that are DETAILED and HIGHLY USEFUL for students.

CRITICAL: These notes must be SUBSTANTIAL and THOROUGH - at least 2500 words minimum. Do NOT generate basic, surface-level summaries.

Use Markdown formatting. Structure as follows:

# [Topic Title]

## Overview
Provide a comprehensive introduction (3-4 paragraphs) explaining what this topic is, why it matters, and how it connects to broader concepts. Include real-world relevance and historical context if applicable.

## Core Concepts
For EACH major concept:
### [Concept Name]
- **Definition**: Clear, precise explanation.
- **Detailed Breakdown**: Use multiple bullet points to explain nuances.
- **How It Works**: Step-by-step explanation of processes or mechanisms.
- **Formulas/Notation**: Use clear text or LaTeX-style formatting for mathematical expressions.
- **Example**: Concrete illustration. ONLY include code snippets (use \`\`\`language) if the topic is specifically about programming, software development, or if a simulation is highly relevant.

## Examples & Use Cases
Provide 4-6 detailed, practical examples that show the concept in action. Include:
- Real-world scenarios.
- Detailed walkthroughs of how to solve related problems.
- Visual descriptions or diagrams represented in text.

## Deep Dive
Advanced details including:
- Edge cases and exceptions.
- Performance considerations (if technical) or advanced theoretical implications.
- Best practices and expert-level insights.
- Related advanced concepts and future trends.

## Common Pitfalls / Misconceptions
List at least 7-10 common mistakes with a detailed table:
| Pitfall | Why It Happens | How to Avoid / Correct Understanding |
|---------|----------------|-------------------------------------|

## Key Takeaways
- Comprehensive bulleted summary (10-15 key points).
- Each takeaway should be actionable, specific, and memorable.

## Quick Reference & Cheat Sheet
Provide a summary of the most important formulas, terms, or syntax in an easy-to-scan format.

IMPORTANT RULES:
- **NO BOGUS CODE**: Do NOT include Python/Java/etc. code for non-programming topics (like Kepler's Law, History, etc.) unless explicitly useful for a simulation.
- **THOROUGHNESS**: Expand on every point. Be the ultimate resource for this topic.
- **FORMATTING**: Use headers, bold text, lists, and tables effectively.
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
