
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { notes } = await request.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Generate a multiple-choice quiz from the following notes. Each question should have four options, and one correct answer.
      Return the quiz as a JSON object with a "questions" property, which is an array of objects. 
      Each question object should have a "question", "options" (an array of four strings), and "answer" (the correct option string).

      For example:
      {
        "questions": [
          {
            "question": "What is the capital of France?",
            "options": ["London", "Berlin", "Paris", "Madrid"],
            "answer": "Paris"
          },
          {
            "question": "What is the powerhouse of the cell?",
            "options": ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
            "answer": "Mitochondria"
          }
        ]
      }

      Notes:
      ${notes}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // Clean the text to ensure it is valid JSON
    const cleanedText = text.replace(/```json\n|```/g, '').trim();

    const quiz = JSON.parse(cleanedText);

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json({ message: 'Error creating quiz' }, { status: 500 });
  }
}
