import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    const supabase = createSupabaseServerClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const studySetId = parseInt(params.id, 10);
        if (isNaN(studySetId)) {
            return NextResponse.json({ error: 'Invalid study set ID' }, { status: 400 });
        }

        const { data, error } = await supabase.rpc('remix_study_set', {
            p_study_set_id: studySetId,
            p_user_id: user.id
        });

        if (error) throw error;

        return NextResponse.json({ new_study_set_id: data });

    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
