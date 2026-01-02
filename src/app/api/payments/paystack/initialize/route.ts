import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { initializeTransaction } from '@/lib/services/paystack';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });  // Pass factory directly—no await
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { amount, currency, plan, metadata } = await req.json();

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
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Paystack initialization error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
