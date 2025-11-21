
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET a single note by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  try {
    const { data: note, error } = await supabase.from('notes').select('*').eq('id', params.id).single();
    if (error) throw error;
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching note' }, { status: 500 });
  }
}

// PUT (update) a note by ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  try {
    const { title, content } = await request.json();
    const { data, error } = await supabase.from('notes').update({ title, content }).eq('id', params.id).select();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'Error updating note' }, { status: 500 });
  }
}

// DELETE a note by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient();
  try {
    const { error } = await supabase.from('notes').delete().eq('id', params.id);
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting note' }, { status: 500 });
  }
}
