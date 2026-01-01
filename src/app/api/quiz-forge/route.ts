import { NextResponse } from 'next/server';
import { generateWithRetry } from '@/lib/ai-providers';

export async function POST(request: Request) {
  try {
    const { notes } = await request.json();

    const prompt = `
      Generate a multiple-choice quiz from the following notes. 
      
      CRITICAL REQUIREMENT:
      Focus on application-based and calculation-heavy questions rather than just theoretical definitions. 
      If the notes involve math, physics, or any logic-based steps (like Mathematical Induction), ensure at least 60% of the questions involve actual computation or multi-step problem solving.
      
      Each question should have four options, and one correct answer.
      Return the quiz as a JSON object with a "questions" property, which is an array of objects. 
      Each question object should have a "question", "options" (an array of four strings), and "answer" (the correct option string).
      
      Example of a good calculation question:
      {
        "question": "In the induction step for P(n): 1+2+...+n = n(n+1)/2, if we assume P(k) is true, what is the value of 1+2+...+k + (k+1)?",
        "options": ["(k+1)(k+2)/2", "k(k+1)/2 + k", "(k+1)^2/2", "k^2/2 + k + 1"],
        "answer": "(k+1)(k+2)/2"
      }

      Total questions: between 10-20.
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