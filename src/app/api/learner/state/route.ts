import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, skillGraphId, currentSkill } = body;

    if (!userId || !skillGraphId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Update learner state
    const { data, error } = await supabase
      .from('learner_states')
      .update({
        current_skill: currentSkill,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('skill_graph_id', skillGraphId)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to update learner state:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update state',
      },
      { status: 500 }
    );
  }
}
