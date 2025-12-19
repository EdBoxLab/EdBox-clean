import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { contentType, contentId, platform, userId, timestamp } = body;

    if (!contentType || !contentId || !platform) {
      return NextResponse.json(
        { error: 'Content type, content ID, and platform are required' },
        { status: 400 }
      );
    }

    // Get client IP address for analytics
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    const { data, error } = await supabase
      .from('share_events')
      .insert({
        content_type: contentType,
        content_id: contentId,
        platform,
        user_id: userId || user?.id || null,
        shared_at: timestamp || new Date().toISOString(),
        ip_address: ip
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to track share event:', error);
      return NextResponse.json(
        { error: 'Failed to track share event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, event: data });

  } catch (error) {
    console.error('Share tracking API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}