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

CRITICAL: These notes must be SUBSTANTIAL and THOROUGH - at least 2000 words minimum. Do NOT generate basic, surface-level summaries.

Use Markdown formatting. Structure as follows:

# [Topic Title]

## Overview
Provide a comprehensive introduction (2-3 paragraphs) explaining what this topic is, why it matters, and how it connects to broader concepts. Include real-world relevance.

## Core Concepts
For EACH major concept:
### [Concept Name]
- **Definition**: Clear, precise explanation
- **Key Points**: Detailed breakdown with multiple bullet points
- **How It Works**: Step-by-step explanation where applicable
- **Example**: Concrete illustration with code snippets (use \`\`\`language) if relevant

## Examples & Use Cases
Provide 3-5 detailed, practical examples that show the concept in action. Include:
- Real-world scenarios
- Code examples with explanations (properly formatted in code blocks)
- Step-by-step walkthroughs

## Deep Dive
Advanced details including:
- Edge cases and exceptions
- Performance considerations
- Best practices and patterns
- How experts approach this topic
- Related advanced concepts

## Common Pitfalls / Misconceptions
List at least 5 common mistakes with:
| Pitfall | Why It Happens | How to Avoid |
|---------|----------------|--------------|
Create a detailed table format.

## Key Takeaways
- Comprehensive bulleted summary (8-12 key points)
- Each takeaway should be actionable and specific

## Quick Reference
Provide a cheat-sheet style summary with the most important syntax, formulas, or concepts in an easy-to-scan format.

IMPORTANT: 
- Be thorough and detailed - students should be able to learn the topic entirely from these notes
- Include code examples in proper code blocks when relevant
- Use tables for structured comparisons
- Do NOT be superficial or generic
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
