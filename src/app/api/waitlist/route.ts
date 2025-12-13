import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase environment variables are missing');
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request: Request) {
  try {
    const body: { email?: string } = await request.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('waitlist')
      .insert([{ email }]);

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { message: 'Email already registered on waitlist!' },
          { status: 200 }
        );
      }
      throw error;
    }

    return NextResponse.json({ message: 'Successfully added to waitlist!' }, { status: 201 });

  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to waitlist' },
      { status: 500 }
    );
  }
}
