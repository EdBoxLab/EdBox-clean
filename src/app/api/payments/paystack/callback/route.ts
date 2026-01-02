import { createServerClient } from '@supabase/ssr';
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
    console.log('Verifying Paystack transaction:', reference);

    const result = await verifyTransaction(reference);

    if (!result.status || result.data.status !== 'success') {
      console.error('Payment verification failed:', result);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=payment_failed`);
    }

    console.log('Payment verified successfully:', result.data);

    const { user_id, plan_id } = result.data.metadata || {};

    if (!user_id) {
      console.error('No user_id in payment metadata');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=invalid_metadata`);
    }

    const cookieStore = await cookies();

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
            } catch { }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== user_id) {
      console.error('User mismatch:', { requestUser: user?.id, paymentUser: user_id });
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=unauthorized`);
    }

    // Get subscription code from authorization
    const subscriptionCode = result.data.authorization?.subscription_code;

    const currentPeriodEnd = result.data.next_payment_date
      ? new Date(result.data.next_payment_date).toISOString()
      : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();

    console.log('Updating subscription in database:', {
      user_id,
      plan_id: plan_id || 'premium',
      subscription_code: subscriptionCode,
      current_period_end: currentPeriodEnd,
    });

    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id,
        plan_id: plan_id || 'premium',
        status: 'active',
        paystack_customer_code: result.data.customer?.customer_code,
        paystack_subscription_code: subscriptionCode || null,
        paystack_authorization_code: result.data.authorization?.authorization_code,
        currency: result.data.currency,
        amount: result.data.amount / 100,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Database update error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=db_error`);
    }

    console.log('Subscription activated successfully');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=subscription_activated`);
  } catch (error: any) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=unknown_error`);
  }
}