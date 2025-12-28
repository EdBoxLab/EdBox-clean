import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { feed_item_id, feed_item_type, content } = await req.json();

        if (!feed_item_id || !feed_item_type || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if already saved
        const { data: existing } = await supabase
            .from('saved_feed_items')
            .select('id')
            .eq('user_id', user.id)
            .eq('feed_item_id', feed_item_id)
            .single();

        if (existing) {
            // Unsave if already exists (toggle behavior)
            const { error } = await supabase
                .from('saved_feed_items')
                .delete()
                .eq('id', existing.id);

            if (error) throw error;
            return NextResponse.json({ success: true, action: 'unsaved' });
        } else {
            // Save new item
            const { error } = await supabase
                .from('saved_feed_items')
                .insert({
                    user_id: user.id,
                    feed_item_id,
                    feed_item_type,
                    content
                });

            if (error) throw error;
            return NextResponse.json({ success: true, action: 'saved' });
        }
    } catch (error: any) {
        console.error('Error in feed save API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
