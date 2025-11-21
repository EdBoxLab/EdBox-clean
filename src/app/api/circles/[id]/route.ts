import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const supabase = await createSupabaseServerClient();
    try {
        const circleId = parseInt(params.id, 10);
        if (isNaN(circleId)) {
            return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: memberCheck, error: memberCheckError } = await supabase
            .from('circle_members')
            .select('user_id')
            .eq('circle_id', circleId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (memberCheckError) throw memberCheckError;
        if (!memberCheck) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: circleDetails, error: detailsError } = await supabase
            .rpc('get_circle_details', { p_circle_id: circleId })
            .single();

        if (detailsError) throw detailsError;
        if (!circleDetails) return NextResponse.json({ error: 'Circle not found' }, { status: 404 });

        const { data: circleMembers, error: membersError } = await supabase
            .rpc('get_circle_members', { p_circle_id: circleId });

        if (membersError) throw membersError;

        return NextResponse.json(Object.assign({}, circleDetails, {
            members: circleMembers || [],
        }));

    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
