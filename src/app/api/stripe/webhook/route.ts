import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js'; // Use direct client for service role access

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as any;

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const subscriptionId = session.subscription;
                const customerId = session.customer;
                const userId = session.metadata.userId;
                const planType = session.metadata.planType;

                // Retrieve subscription details to get the interval and current period end
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                await supabaseAdmin.from('user_subscriptions').upsert({
                    user_id: userId,
                    stripe_customer_id: customerId,
                    stripe_subscription_id: subscriptionId,
                    plan_id: `pro_${planType}`,
                    status: subscription.status,
                    billing_interval: subscription.items.data[0].plan.interval,
                    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                    updated_at: new Date().toISOString(),
                });

                break;
            }

            case 'customer.subscription.updated': {
                const subscriptionId = session.id;
                const customerId = session.customer;
                const status = session.status;

                await supabaseAdmin.from('user_subscriptions').update({
                    status: status,
                    current_period_end: new Date(session.current_period_end * 1000).toISOString(),
                    billing_interval: session.items.data[0].plan.interval,
                    updated_at: new Date().toISOString(),
                }).eq('stripe_subscription_id', subscriptionId);

                break;
            }

            case 'customer.subscription.deleted': {
                const subscriptionId = session.id;

                await supabaseAdmin.from('user_subscriptions').update({
                    status: 'canceled', // or 'deleted'
                    updated_at: new Date().toISOString(),
                }).eq('stripe_subscription_id', subscriptionId);

                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.error('Error handling webhook:', error);
        return new NextResponse('Webhook handler failed', { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
}
