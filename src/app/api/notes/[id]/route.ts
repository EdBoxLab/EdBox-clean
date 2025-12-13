import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// GET a single note by ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ Note: params is now a Promise
) {
  const { id } = await context.params; // ✅ Await the params
  const supabase = await createSupabaseServerClient();

  try {
    const { data: note, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !note) throw error;

    return NextResponse.json(note);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching note' }, { status: 500 });
  }
}

// PUT (update) a note by ID
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();

  try {
    const { title, content } = await req.json();
    const { data, error } = await supabase
      .from('notes')
      .update({ title, content })
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: 'Error updating note' }, { status: 500 });
  }
}

// DELETE a note by ID
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();

  try {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: 'Error deleting note' }, { status: 500 });
  }
}
