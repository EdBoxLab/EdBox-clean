import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// POST a new study set
export async function POST(request: Request) {
    const supabase = createSupabaseServerClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { title, description, terms } = await request.json();

        if (!title || !description) {
            return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
        }

        // Insert the study set
        const { data: newSet, error: setError } = await supabase
            .from('study_sets')
            .insert({ title, description, user_id: user.id })
            .select('id')
            .single();
        
        if (setError) throw setError;

        if (terms && terms.length > 0) {
            const termsToInsert = terms.map((term: { term: string, definition: string }) => ({
                study_set_id: newSet.id,
                term: term.term,
                definition: term.definition,
                user_id: user.id
            }));

            const { error: termsError } = await supabase
                .from('study_set_terms')
                .insert(termsToInsert);

            if (termsError) {
                // If terms fail, we should ideally roll back the set creation.
                // For now, we'll just return the error.
                console.error("Failed to add terms, but set was created:", termsError);
                return NextResponse.json({ id: newSet.id, warning: 'Set created, but failed to add terms.' }, { status: 201 });
            }
        }

        return NextResponse.json({ id: newSet.id }, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
