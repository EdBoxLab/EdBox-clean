
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET all notes
export async function GET() {
  try {
    const { data: notes, error } = await supabase.from('notes').select('*');
    if (error) throw error;
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching notes' }, { status: 500 });
  }
}

// POST a new note
export async function POST(request: Request) {
  try {
    const { title, content } = await request.json();
    const { data, error } = await supabase.from('notes').insert([{ title, content }]).select();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error creating note' }, { status: 500 });
  }
}
