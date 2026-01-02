import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex');

    const paystackSignature = req.headers.get('x-paystack-signature');

    if (hash !== paystackSignature) {
      console.error('Invalid webhook signature');
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Paystack webhook event:', event.event);

    const cookieStore = await cookies();

    // Create Supabase client for webhook
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for webhooks
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
              // Ignore - called from Server Component
            }
          },
        },
      }
    );

    switch (event.event) {
      case 'charge.success':
      case 'subscription.create':
      case 'invoice.payment_succeeded':
        // Handle successful charge, subscription creation, or renewal
        const { user_id, plan_id } = event.data.metadata || {};

        if (!user_id) {
          console.error('No user_id in webhook metadata:', event.data.metadata);
          return new NextResponse('Missing user_id', { status: 400 });
        }

        console.log('Processing payment success for user:', user_id);

        const currentPeriodEnd = event.data.next_payment_date
          ? new Date(event.data.next_payment_date).toISOString()
          : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();

        const { error: upsertError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id,
            plan_id: plan_id || 'premium',
            status: 'active',
            paystack_customer_code: event.data.customer?.customer_code,
            paystack_subscription_code: event.data.subscription_code || null,
            currency: event.data.currency,
            amount: event.data.amount ? event.data.amount / 100 : null, // Convert from kobo/cents
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (upsertError) {
          console.error('Database upsert error:', upsertError);
          return new NextResponse('Database error', { status: 500 });
        }

        console.log('Subscription activated successfully via webhook');
        break;

      case 'subscription.disable':
      case 'subscription.not_renew':
        // Handle subscription cancellation or non-renewal
        const customerCode = event.data.customer?.customer_code;

        if (!customerCode) {
          console.error('No customer_code in webhook data');
          return new NextResponse('Missing customer_code', { status: 400 });
        }

        console.log('Processing subscription cancellation for customer:', customerCode);

        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('paystack_customer_code', customerCode);

        if (updateError) {
          console.error('Database update error:', updateError);
          return new NextResponse('Database error', { status: 500 });
        }

        console.log('Subscription cancelled successfully via webhook');
        break;

      case 'charge.failed':
        // Handle failed payment
        console.log('Payment failed:', event.data);
        // Optionally update subscription status to 'past_due'
        break;

      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}