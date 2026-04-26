import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/admin';
import { getExamRuntimeBySlug, scoreExamResponses } from '@/lib/exams/engine';
import { applySm2 } from '@/lib/exams/sm2';

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const authClient = await createSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const responses = body.responses ?? {};
    const domainSlug = String(body.domainSlug ?? '').trim();
    const startedAt = body.startedAt ? new Date(body.startedAt) : new Date();
    const submittedAt = body.submittedAt ? new Date(body.submittedAt) : new Date();
    const durationSeconds = Math.max(0, Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000));

    const runtime = await getExamRuntimeBySlug(slug);
    const domain = runtime.domains.find((item) => item.slug === domainSlug) ?? runtime.domains[0];

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const adminClient = createServerSupabaseClient();
    const { data: questions } = await adminClient
      .from('exam_questions')
      .select('*')
      .eq('exam_id', runtime.examId ?? domain.exam_id)
      .eq('domain_id', domain.id)
      .order('created_at', { ascending: true });

    const questionRows = questions ?? [];
    const result = scoreExamResponses(questionRows, responses);

    const questionIds = questionRows.map((question: any) => question.id).filter(Boolean);
    const submittedDate = new Date(submittedAt);

    if (questionIds.length > 0) {
      const { data: existingSm2Rows } = await authClient
        .from('user_question_sm2')
        .select('question_id, interval_days, ease_factor, repetitions')
        .eq('user_id', user.id)
        .in('question_id', questionIds);

      const previousByQuestionId = new Map(
        (existingSm2Rows ?? []).map((row: any) => [row.question_id, row])
      );

      const sm2Upserts = questionRows.map((question: any) => {
        const givenAnswer = String(responses[question.id] ?? '').trim().toLowerCase();
        const correctAnswer = String(question.correct_answer ?? '').trim().toLowerCase();
        const grade = givenAnswer && givenAnswer === correctAnswer ? 5 : 2;
        const previous = previousByQuestionId.get(question.id);

        const nextState = applySm2(
          previous
            ? {
                intervalDays: previous.interval_days,
                easeFactor: Number(previous.ease_factor),
                repetitions: previous.repetitions,
              }
            : null,
          grade,
          submittedDate
        );

        return {
          user_id: user.id,
          exam_id: runtime.examId ?? domain.exam_id,
          domain_id: domain.id,
          question_id: question.id,
          interval_days: nextState.intervalDays,
          ease_factor: nextState.easeFactor,
          repetitions: nextState.repetitions,
          last_grade: nextState.grade,
          next_review_date: nextState.nextReviewDate,
          last_reviewed_at: submittedDate.toISOString(),
        };
      });

      const { error: sm2Error } = await authClient
        .from('user_question_sm2')
        .upsert(sm2Upserts, { onConflict: 'user_id,question_id' });

      if (sm2Error) {
        console.error('SM-2 update failed:', sm2Error);
      }
    }

    const { data: attempt, error } = await authClient
      .from('exam_attempts')
      .insert({
        exam_id: runtime.examId ?? domain.exam_id,
        user_id: user.id,
        domain_id: domain.id,
        score: result.score,
        passed: result.passed,
        duration_seconds: durationSeconds,
        responses,
        started_at: startedAt.toISOString(),
        submitted_at: submittedAt.toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      attempt,
      score: result.score,
      passed: result.passed,
      correctCount: result.correctCount,
      total: result.total,
      questions: questionRows,
    });
  } catch (error: any) {
    console.error('Exam submission failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit exam attempt' }, { status: 500 });
  }
}
