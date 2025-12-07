import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server'; // Assuming this exists or similar

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { priceId, planType } = await req.json();

        if (!priceId) {
            return new NextResponse("Missing priceId", { status: 400 });
        }

        // Check if user already has a customer ID in user_subscriptions
        // For now we'll let Stripe handle customer creation if we don't store it yet, 
        // or look it up. Best practice: look up via supabase.

        // For simplicity in this step, we will rely on email-based matching/creation by Stripe 
        // or create a new one. Ideal: Fetch from `user_subscriptions` table.

        // Fetch subscription record
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .single();

        let customerId = subscription?.stripe_customer_id;

        if (!customerId) {
            // Create new customer if not exists
            const customerData: any = {
                email: user.email,
                metadata: {
                    userId: user.id,
                }
            };
            const customer = await stripe.customers.create(customerData);
            customerId = customer.id;

            // Save to Supabase immediately or wait for webhook? 
            // Safer to wait for webhook or save here. Let's save here for immediate reference.
            await supabase.from('user_subscriptions').upsert({
                user_id: user.id,
                stripe_customer_id: customerId,
            });
        }

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
            metadata: {
                userId: user.id,
                planType: planType, // 'monthly', 'quarterly', 'yearly'
            },
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.error("[STRIPE_CHECKOUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
