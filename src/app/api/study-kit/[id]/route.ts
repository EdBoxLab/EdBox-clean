import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
