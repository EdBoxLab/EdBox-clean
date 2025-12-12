import { NextResponse } from 'next/server';
import { generateWithRetry } from '@/lib/ai-providers';

export async function POST(request: Request) {
  try {
    const { notes } = await request.json();

    const prompt = `
      Generate flashcards from the following notes. Each flashcard should be a question and an answer, separated by a colon.
      Return the flashcards as a JSON array of objects, where each object has a "question" and "answer" property.

      For example:
      [{"question":"What is the capital of France?","answer":"Paris"},{"question":"What is the powerhouse of the cell?","answer":"Mitochondria"}]

      Notes:
      ${notes}
    `;

    const result = await generateWithRetry({
      prompt,
      systemPrompt: 'You are an expert at creating educational flashcards. Generate concise, clear questions and answers.',
      schema: {},
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Clean the text to ensure it is valid JSON
    const cleanedText = result.text.replace(/```json\n|```/g, '').trim();
    const flashcards = JSON.parse(cleanedText);

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    return NextResponse.json({ message: 'Error generating flashcards' }, { status: 500 });
  }
}