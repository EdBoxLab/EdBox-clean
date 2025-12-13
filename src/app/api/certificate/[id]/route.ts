import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // await the promise

  if (!id) {
    return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data: cert, error } = await supabase
      .from('certificates')
      .select('certificate_data')
      .eq('id', id)
      .single();

    if (error || !cert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      certificate: cert.certificate_data,
    });
  } catch (err: any) {
    console.error('Certificate Fetch Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch certificate' },
      { status: 500 }
    );
  }
}
