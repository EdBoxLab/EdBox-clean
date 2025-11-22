import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createSupabaseServerClient();
    try {
        const { id } = await params;
        const circleId = parseInt(id, 10);
        
        if (isNaN(circleId)) {
            return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { study_set_id } = await request.json();
        if (!study_set_id) {
            return NextResponse.json({ error: 'Missing study_set_id' }, { status: 400 });
        }

        // Check if the user is a member of the circle
        const { data: memberCheck, error: memberCheckError } = await supabase
            .from('circle_members')
            .select('user_id')
            .eq('circle_id', circleId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (memberCheckError) throw memberCheckError;
        if (!memberCheck) {
            return NextResponse.json({ error: 'You must be a member to share sets in this circle' }, { status: 403 });
        }

        // Check if the user owns the study set they are trying to share
        const { data: setOwnerCheck, error: setOwnerError } = await supabase
            .from('study_sets')
            .select('user_id')
            .eq('id', study_set_id)
            .eq('user_id', user.id)
            .maybeSingle();

        if (setOwnerError) throw setOwnerError;
        if (!setOwnerCheck) {
            return NextResponse.json({ error: 'You can only share study sets that you own' }, { status: 403 });
        }

        // Share the set
        const { error: shareError } = await supabase
            .from('circle_study_sets')
            .insert({
                circle_id: circleId,
                study_set_id: study_set_id,
                shared_by_user_id: user.id,
            });

        if (shareError) {
            // Handle potential unique constraint violation gracefully
            if (shareError.code === '23505') { // unique_violation
                return NextResponse.json({ error: 'This study set has already been shared in this circle' }, { status: 409 });
            }
            throw shareError;
        }

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}