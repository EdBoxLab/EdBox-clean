import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/admin';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        // Use admin client to bypass RLS - allows viewing shared study kits
        const supabase = createServerSupabaseClient();

        const { data: studyKit, error } = await supabase
            .from('study_kit_content')
            .select('id, title, source_type, content_types, generated_content, created_at, user_id')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Study kit not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json({ studyKit });
    } catch (error: any) {
        console.error('Study Kit GET Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch study kit' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const supabase = await createSupabaseServerClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error: deleteError } = await supabase
            .from('study_kit_content')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (deleteError) {
            throw deleteError;
        }

        return NextResponse.json({ success: true, message: 'Study kit deleted successfully' });
    } catch (error: any) {
        console.error('Study Kit Deletion Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete study kit' },
            { status: 500 }
        );
    }
}
