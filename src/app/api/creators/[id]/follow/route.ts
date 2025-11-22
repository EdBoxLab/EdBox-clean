import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createSupabaseServerClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const followed_id = id;

        const { error } = await supabase
            .from('followers')
            .insert({ follower_id: user.id, followed_id });

        if (error) throw error;

        return NextResponse.json({ message: 'Successfully followed creator' });

    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createSupabaseServerClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const followed_id = id;

        const { error } = await supabase
            .from('followers')
            .delete()
            .eq('follower_id', user.id)
            .eq('followed_id', followed_id);

        if (error) throw error;

        return NextResponse.json({ message: 'Successfully unfollowed creator' });

    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}