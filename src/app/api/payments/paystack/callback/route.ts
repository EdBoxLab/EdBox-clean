import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyTransaction } from '@/lib/services/paystack';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=no_reference`);
  }

  try {
    const result = await verifyTransaction(reference);

    if (!result.status || result.data.status !== 'success') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=payment_failed`);
    }

    const { user_id, plan_id } = result.data.metadata || {};
    const supabase = createRouteHandlerClient({ cookies });

    // Update user subscription in database
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id,
        plan_id: plan_id || 'premium',
        status: 'active',
        paystack_customer_code: result.data.customer?.customer_code,
        paystack_subscription_code: result.data.plan_object?.plan_code || result.data.subscription_code || null,
        currency: result.data.currency,
        current_period_end: result.data.next_payment_date 
          ? new Date(result.data.next_payment_date).toISOString()
          : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Database update error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=db_error`);
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=subscription_activated`);
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=unknown_error`);
  }
}
