import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getExamRuntimeBySlug } from '@/lib/exams/engine';

export async function GET(_: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const runtime = await getExamRuntimeBySlug(slug);
    return NextResponse.json({
      success: true,
      exam: runtime.exam,
      domains: runtime.domains,
      questions: runtime.questions,
      materials: runtime.materials,
    });
  } catch (error: any) {
    console.error('Exam GET failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to load exam' }, { status: 500 });
  }
}
