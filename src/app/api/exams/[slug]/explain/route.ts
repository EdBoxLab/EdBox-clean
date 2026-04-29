import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/admin';
import { cleanJsonResponse, generateWithRetry } from '@/lib/ai-providers';
import { getExamRuntimeBySlug } from '@/lib/exams/engine';

const fallbackFollowUp = (question: any) => ({
  question: `Which option best matches the core rule from this question? ${question.question_text}`,
  options: question.options,
  correctAnswer: question.correct_answer,
  explanation: question.explanation,
});

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const authClient = await createSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const questionId = String(body.questionId ?? '').trim();
    const userAnswer = String(body.userAnswer ?? '').trim();

    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
    }

    const runtime = await getExamRuntimeBySlug(slug);
    const adminClient = createServerSupabaseClient();

    const { data: question } = await adminClient
      .from('exam_questions')
      .select('*')
      .eq('id', questionId)
      .eq('exam_id', runtime.examId ?? '')
      .single();

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const fallback = {
      explanation: `Your answer: ${userAnswer || 'No answer provided'}\n\nCorrect answer: ${question.correct_answer}\n\n${question.explanation}`,
      followUp: fallbackFollowUp(question),
    };

    try {
      const prompt = `Question: ${question.question_text}
Options: ${JSON.stringify(question.options)}
User answer: ${userAnswer || 'No answer'}
Correct answer: ${question.correct_answer}
Stored explanation: ${question.explanation}

Return JSON only in this shape:
{
  "explanation": "string",
  "followUp": {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswer": "string",
    "explanation": "string"
  }
}`;

      const generated = await generateWithRetry({
        prompt,
        systemPrompt: 'You are Genie, a precise exam tutor. Output valid JSON only.',
        temperature: 0.3,
        maxTokens: 1800,
      });

      const parsed = JSON.parse(cleanJsonResponse(generated.text));
      return NextResponse.json({
        success: true,
        explanation: parsed.explanation || fallback.explanation,
        followUp: {
          question: parsed.followUp?.question || fallback.followUp.question,
          options: Array.isArray(parsed.followUp?.options) ? parsed.followUp.options : fallback.followUp.options,
          correctAnswer: parsed.followUp?.correctAnswer || fallback.followUp.correctAnswer,
          explanation: parsed.followUp?.explanation || fallback.followUp.explanation,
        },
      });
    } catch {
      return NextResponse.json({ success: true, ...fallback });
    }
  } catch (error: any) {
    console.error('Exam explain failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to explain answer' }, { status: 500 });
  }
}
