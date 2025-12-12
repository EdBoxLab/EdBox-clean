import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { count, error } = await supabaseAdmin
      .from('beta_signups')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    const currentCount = count || 0;
    const isFull = currentCount >= 100;

    return NextResponse.json({
      currentCount,
      isFull,
      remainingSpots: Math.max(0, 100 - currentCount)
    });
  } catch (error) {
    console.error('Error checking beta status:', error);
    return NextResponse.json(
      { error: 'Failed to check beta status' },
      { status: 500 }
    );
  }
}
