import { NextResponse } from 'next/server';
import { generateWithRetry } from '@/lib/ai-providers';

export async function POST(request: Request) {
  try {
    const { notes } = await request.json();

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
in total the quiz should consist of between 10-20 questions.
      Notes:
      ${notes}
    `;

    const result = await generateWithRetry({
      prompt,
      systemPrompt: 'You are an expert at creating educational quizzes. Generate clear multiple-choice questions with four options each.',
      schema: {},
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Clean the text to ensure it is valid JSON
    const cleanedText = result.text.replace(/```json\n|```/g, '').trim();
    console.log("AI response:", result.text);
    const quiz = JSON.parse(cleanedText);

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json({ message: 'Error creating quiz' }, { status: 500 });
  }
}