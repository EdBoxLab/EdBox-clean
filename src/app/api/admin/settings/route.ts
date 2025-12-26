import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';

export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Admin settings GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createSupabaseServerClient();
    const { key, value } = await request.json();

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('system_settings')
      .upsert({ 
        key, 
        value, 
        updated_at: new Date().toISOString(),
        updated_by: user?.id 
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Admin settings POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
