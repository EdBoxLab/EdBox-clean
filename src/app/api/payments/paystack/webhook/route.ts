import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
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

    if (hash !== req.headers.get('x-paystack-signature')) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    const supabase = createRouteHandlerClient({ cookies });

      switch (event.event) {
        case 'charge.success':
        case 'subscription.create':
        case 'invoice.payment_succeeded':
          // Handle successful charge, subscription creation, or renewal
          const { user_id, plan_id } = event.data.metadata || {};
          
          if (!user_id) {
            console.error('No user_id in metadata');
            return new NextResponse('Missing user_id', { status: 400 });
          }

          await supabase
            .from('user_subscriptions')
            .upsert({
              user_id,
              plan_id: plan_id || 'premium',
              status: 'active',
              paystack_customer_code: event.data.customer?.customer_code,
              paystack_subscription_code: event.data.subscription_code || null,
              currency: event.data.currency,
              current_period_end: event.data.next_payment_date 
                ? new Date(event.data.next_payment_date).toISOString()
                : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
          break;

        case 'subscription.disable':
        case 'subscription.not_renew':
          // Handle subscription cancellation or non-renewal
          const customerCode = event.data.customer?.customer_code;
          if (customerCode) {
            await supabase
              .from('user_subscriptions')
              .update({ status: 'cancelled' })
              .eq('paystack_customer_code', customerCode);
          }
          break;
      }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
