import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { initializeTransaction } from '@/lib/services/paystack';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    // Create Supabase client with Next.js 15 compatible approach
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, currency, plan, metadata } = await req.json();

    // Validate required fields
    if (!amount || !currency || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, currency, or plan' },
        { status: 400 }
      );
    }

    console.log('Initializing Paystack transaction:', {
      email: user.email,
      amount,
      currency,
      plan
    });

    const result = await initializeTransaction(
      user.email!,
      amount,
      currency,
      plan,
      {
        ...metadata,
        user_id: user.id,
      }
    );

    if (!result.status) {
      console.error('Paystack initialization failed:', result.message);
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    console.log('Paystack transaction initialized successfully');
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Paystack initialization error:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}