import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createSupabaseServerClient();

        // Fetch certificate
        const { data: cert, error } = await supabase
            .from('certificates')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error || !cert) {
            return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            certificate: cert.certificate_data,
        });

    } catch (error: any) {
        console.error('Certificate Fetch Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch certificate' },
            { status: 500 }
        );
    }
}
