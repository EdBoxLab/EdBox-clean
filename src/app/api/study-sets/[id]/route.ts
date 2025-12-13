import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET a single study set with its terms
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServerClient(); // ✅ await here
  const setId = parseInt(params.id, 10);

  if (isNaN(setId)) return NextResponse.json({ error: 'Invalid study set ID' }, { status: 400 });

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // ✅ now works
    if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: set, error: setError } = await supabase
      .from('study_sets') // ✅ now works
      .select('*, user:user_profiles(username)')
      .eq('id', setId)
      .eq('user_id', user.id)
      .single();

    if (setError || !set) return NextResponse.json({ error: 'Study set not found or access denied.' }, { status: 404 });

    const { data: terms, error: termsError } = await supabase
      .from('study_set_terms')
      .select('id, term, definition')
      .eq('study_set_id', setId)
      .order('created_at', { ascending: true });

    if (termsError) throw termsError;

    return NextResponse.json({ ...set, terms: terms || [] });
  } catch (error) {
    console.error('GET study set error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// PUT (update) a study set
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServerClient(); // ✅ await here
  const setId = parseInt(params.id, 10);

  if (isNaN(setId)) return NextResponse.json({ error: 'Invalid study set ID' }, { status: 400 });

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // ✅ works
    if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, description, terms } = await request.json();
    if (!title || !description) return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });

    const { error: updateSetError } = await supabase
      .from('study_sets')
      .update({ title, description })
      .eq('id', setId)
      .eq('user_id', user.id);

    if (updateSetError) throw updateSetError;

    const { error: deleteTermsError } = await supabase
      .from('study_set_terms')
      .delete()
      .eq('study_set_id', setId);

    if (deleteTermsError) throw deleteTermsError;

    if (terms?.length) {
      const termsToInsert = terms.map((t: { term: string; definition: string }) => ({
        study_set_id: setId,
        term: t.term,
        definition: t.definition,
        user_id: user.id,
      }));

      const { error: insertTermsError } = await supabase
        .from('study_set_terms')
        .insert(termsToInsert);

      if (insertTermsError) throw insertTermsError;
    }

    return NextResponse.json({ id: setId }, { status: 200 });
  } catch (error) {
    console.error('PUT study set error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// DELETE a study set
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServerClient(); // ✅ await here
  const setId = parseInt(params.id, 10);

  if (isNaN(setId)) return NextResponse.json({ error: 'Invalid study set ID' }, { status: 400 });

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // ✅ works
    if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('study_sets')
      .delete()
      .eq('id', setId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE study set error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
