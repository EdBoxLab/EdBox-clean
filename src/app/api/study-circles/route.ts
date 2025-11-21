import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createSupabaseServerClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the new database function to get circle details for the current user
    const { data: studyCircles, error } = await supabase.rpc('get_circles_with_details', { p_user_id: user.id });

    if (error) throw error;

    return NextResponse.json(studyCircles);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
    }

    const { data: newCircle, error: insertError } = await supabase
      .from('study_circles')
      .insert([{ name, description, creator_id: user.id }])
      .select()
      .single();

    if (insertError) throw insertError;

    // After creating the circle, add the creator as the first member
    await supabase.from('circle_members').insert({ circle_id: newCircle.id, user_id: user.id });

    return NextResponse.json(newCircle, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
