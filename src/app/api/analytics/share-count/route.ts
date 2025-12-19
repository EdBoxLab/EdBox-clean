import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('type');
    const contentId = searchParams.get('id');

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: 'Content type and ID are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('share_statistics')
      .select('total_shares, unique_sharers, last_shared_at')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Failed to get share count:', error);
      return NextResponse.json(
        { error: 'Failed to get share count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      count: data?.total_shares || 0,
      uniqueSharers: data?.unique_sharers || 0,
      lastSharedAt: data?.last_shared_at || null,
      contentType,
      contentId
    });

  } catch (error) {
    console.error('Share count API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}