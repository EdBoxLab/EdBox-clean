// app/api/study-kit/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // Get current logged-in user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch study kits created by this user
        const { data: studyKits, error } = await supabase
            .from('study_kit_content')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ studyKits });
    } catch (error: any) {
        console.error('Study Kit List GET Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch study kits', details: error?.message },
            { status: 500 }
        );
    }
}
