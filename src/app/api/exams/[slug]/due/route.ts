import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/admin';
import { getExamRuntimeBySlug } from '@/lib/exams/engine';

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const authClient = await createSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const runtime = await getExamRuntimeBySlug(slug);
    if (!runtime.examId || runtime.domains.length === 0) {
      return NextResponse.json({ success: true, questions: [], dueCount: 0 });
    }

    const domainSlug = request.nextUrl.searchParams.get('domainSlug')?.trim();
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 10);
    const boundedLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, limit)) : 10;

    const domain = domainSlug
      ? runtime.domains.find((item) => item.slug === domainSlug) ?? runtime.domains[0]
      : runtime.domains[0];

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const adminClient = createServerSupabaseClient();
    const { data: domainQuestions } = await adminClient
      .from('exam_questions')
      .select('*')
      .eq('exam_id', runtime.examId)
      .eq('domain_id', domain.id)
      .order('created_at', { ascending: true });

    const questions = domainQuestions ?? [];
    const questionIds = questions.map((question: any) => question.id);

    if (questionIds.length === 0) {
      return NextResponse.json({ success: true, questions: [], dueCount: 0, domain });
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data: sm2Rows } = await authClient
      .from('user_question_sm2')
      .select('question_id, next_review_date')
      .eq('user_id', user.id)
      .eq('exam_id', runtime.examId)
      .eq('domain_id', domain.id)
      .in('question_id', questionIds)
      .order('next_review_date', { ascending: true });

    const dueIds = (sm2Rows ?? [])
      .filter((row: any) => row.next_review_date <= today)
      .map((row: any) => row.question_id);

    const seenIds = new Set((sm2Rows ?? []).map((row: any) => row.question_id));
    const questionById = new Map(questions.map((question: any) => [question.id, question]));

    const dueQuestions = dueIds
      .map((id: string) => questionById.get(id))
      .filter(Boolean);

    const unseenQuestions = questions.filter((question: any) => !seenIds.has(question.id));
    const merged = [...dueQuestions, ...unseenQuestions].slice(0, boundedLimit);

    return NextResponse.json({
      success: true,
      domain,
      dueCount: dueQuestions.length,
      questions: merged,
      queueMode: dueQuestions.length > 0 ? 'due' : 'new',
    });
  } catch (error: any) {
    console.error('Exam due queue failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to load due questions' }, { status: 500 });
  }
}
