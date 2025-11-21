import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET a single study set with its terms
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const supabase = createSupabaseServerClient();
    const setId = parseInt(params.id, 10);

    if (isNaN(setId)) {
        return NextResponse.json({ error: 'Invalid study set ID' }, { status: 400 });
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: set, error: setError } = await supabase
            .from('study_sets')
            .select('*, user:user_profiles(username)')
            .eq('id', setId)
            .eq('user_id', user.id) // Ensure user owns the set
            .single();

        if (setError) throw setError;
        if (!set) return NextResponse.json({ error: 'Study set not found or access denied.' }, { status: 404 });

        const { data: terms, error: termsError } = await supabase
            .from('study_set_terms')
            .select('id, term, definition')
            .eq('study_set_id', setId)
            .order('created_at', { ascending: true });

        if (termsError) throw termsError;

        return NextResponse.json({ ...set, terms: terms || [] });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

// PUT (update) a study set
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const supabase = createSupabaseServerClient();
    const setId = parseInt(params.id, 10);

    if (isNaN(setId)) {
        return NextResponse.json({ error: 'Invalid study set ID' }, { status: 400 });
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { title, description, terms } = await request.json();

        if (!title || !description) {
            return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
        }

        // 1. Update the study set details
        const { error: updateSetError } = await supabase
            .from('study_sets')
            .update({ title, description })
            .eq('id', setId)
            .eq('user_id', user.id); // Security check

        if (updateSetError) throw updateSetError;

        // 2. Sync terms (delete old, insert/update new)
        // This is a simplified sync. A more robust solution might handle updates without deleting.
        const { error: deleteTermsError } = await supabase
            .from('study_set_terms')
            .delete()
            .eq('study_set_id', setId);

        if (deleteTermsError) throw deleteTermsError;

        if (terms && terms.length > 0) {
            const termsToInsert = terms.map((term: { term: string, definition: string }) => ({
                study_set_id: setId,
                term: term.term,
                definition: term.definition,
                user_id: user.id,
            }));

            const { error: insertTermsError } = await supabase
                .from('study_set_terms')
                .insert(termsToInsert);

            if (insertTermsError) throw insertTermsError;
        }

        return NextResponse.json({ id: setId }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}


// DELETE a study set
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const supabase = createSupabaseServerClient();
    const setId = parseInt(params.id, 10);

    if (isNaN(setId)) {
        return NextResponse.json({ error: 'Invalid study set ID' }, { status: 400 });
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // The database is set up with cascading delete, so deleting the set 
        // will automatically delete its terms and any shares.
        const { error } = await supabase
            .from('study_sets')
            .delete()
            .eq('id', setId)
            .eq('user_id', user.id); // Security check

        if (error) throw error;

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
