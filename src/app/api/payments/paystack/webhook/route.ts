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
        // Handle successful charge
        const { user_id, plan_id } = event.data.metadata;
        await supabase
          .from('user_subscriptions')
          .upsert({
            user_id,
            plan_id,
            status: 'active',
            paystack_customer_code: event.data.customer.customer_code,
            currency: event.data.currency,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        break;

      case 'subscription.create':
        // Handle subscription creation
        break;

      case 'subscription.disable':
        // Handle subscription cancellation
        const customerCode = event.data.customer.customer_code;
        await supabase
          .from('user_subscriptions')
          .update({ status: 'cancelled' })
          .eq('paystack_customer_code', customerCode);
        break;
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
