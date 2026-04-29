import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/admin';
import { getExamRuntimeBySlug } from '@/lib/exams/engine';

export async function GET(_: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const authClient = await createSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const runtime = await getExamRuntimeBySlug(slug);
    if (!runtime.examId) {
      return NextResponse.json({ success: true, files: [], hasAudio: false });
    }

    const adminClient = createServerSupabaseClient();
    const { data: files } = await adminClient
      .from('exam_audio_files')
      .select('*')
      .eq('exam_id', runtime.examId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      hasAudio: (files ?? []).length > 0,
      files: files ?? [],
      domains: runtime.domains,
    });
  } catch (error: any) {
    console.error('Official audio fetch failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to load audio files' }, { status: 500 });
  }
}
