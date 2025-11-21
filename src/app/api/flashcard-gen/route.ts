
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { notes } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Generate flashcards from the following notes. Each flashcard should be a question and an answer, separated by a colon.
      Return the flashcards as a JSON array of objects, where each object has a "question" and "answer" property.

      For example:
      [{"question":"What is the capital of France?","answer":"Paris"},{"question":"What is the powerhouse of the cell?","answer":"Mitochondria"}]

      Notes:
      ${notes}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // Clean the text to ensure it is valid JSON
    const cleanedText = text.replace(/```json\n|```/g, '').trim();

    const flashcards = JSON.parse(cleanedText);

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    return NextResponse.json({ message: 'Error generating flashcards' }, { status: 500 });
  }
}
