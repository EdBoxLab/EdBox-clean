import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/admin';
import { getExamRuntimeBySlug, buildMaterialCorpus, generateExamQuestions } from '@/lib/exams/engine';

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const authClient = await createSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const domainSlug = String(body.domainSlug ?? '').trim();
    const count = Number(body.count ?? 10);

    const runtime = await getExamRuntimeBySlug(slug);
    const adminClient = createServerSupabaseClient();
    const targetDomain = runtime.domains.find((domain) => domain.slug === domainSlug) ?? runtime.domains[0];

    if (!targetDomain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    const { data: existingQuestions } = await adminClient
      .from('exam_questions')
      .select('*')
      .eq('exam_id', runtime.examId ?? targetDomain.exam_id)
      .eq('domain_id', targetDomain.id)
      .order('created_at', { ascending: false });

    if (existingQuestions && existingQuestions.length > 0 && !body.force) {
      return NextResponse.json({
        success: true,
        generated: false,
        questions: existingQuestions,
        domain: targetDomain,
      });
    }

    const domainMaterials = runtime.materials.filter((material) => material.domain_id === targetDomain.id || material.domain_id === null);
    const corpus = await buildMaterialCorpus(adminClient, domainMaterials);
    const generatedQuestions = await generateExamQuestions({
      exam: runtime.exam,
      domain: targetDomain,
      corpus,
      count,
    });

    const rows = generatedQuestions.map((question) => ({
      ...question,
      exam_id: runtime.examId ?? targetDomain.exam_id,
      domain_id: targetDomain.id,
    }));

    const { data: inserted, error } = await adminClient
      .from('exam_questions')
      .insert(rows)
      .select('*');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      generated: true,
      questions: inserted ?? rows,
      domain: targetDomain,
    });
  } catch (error: any) {
    console.error('Exam generation failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate exam questions' }, { status: 500 });
  }
}
