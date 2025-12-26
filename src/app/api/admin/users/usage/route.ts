import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createSupabaseServerClient();
    const { userId, usage } = await request.json();

    if (!userId || !usage) {
      return NextResponse.json({ error: 'userId and usage are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_usage')
      .update({
        courses_created_month: usage.coursesCreated,
        study_kits_created_week: usage.studyKitsCreated,
        research_queries_week: usage.researchQueries,
        ad_credits: usage.adCredits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Admin usage PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
