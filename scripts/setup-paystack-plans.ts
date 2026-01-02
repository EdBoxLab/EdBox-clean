import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function setupPlans() {
    // Dynamic import to ensure env vars are loaded first
    const { createPlan } = await import('@/lib/services/paystack');

    try {
        // Create NGN Monthly Plan
        const ngnMonthly = await createPlan(
            'EdBox Premium Monthly (Nigeria)',
            250000, // ₦2,500 in kobo
            'monthly',
            'NGN'
        );
        console.log('NGN Monthly Plan:', ngnMonthly.data?.plan_code);

        // Create NGN Yearly Plan
        const ngnYearly = await createPlan(
            'EdBox Premium Yearly (Nigeria)',
            2550000, // ₦25,500 in kobo (15% discount)
            'annually',
            'NGN'
        );
        console.log('NGN Yearly Plan:', ngnYearly.data?.plan_code);

        // Create USD Monthly Plan
        const usdMonthly = await createPlan(
            'EdBox Premium Monthly (Global)',
            999, // $9.99 in cents
            'monthly',
            'USD'
        );
        console.log('USD Monthly Plan:', usdMonthly.data?.plan_code);

        // Create USD Yearly Plan
        const usdYearly = await createPlan(
            'EdBox Premium Yearly (Global)',
            10188, // $101.88 in cents (15% discount)
            'annually',
            'USD'
        );
        console.log('USD Yearly Plan:', usdYearly.data?.plan_code);

        console.log('\n✅ All plans created successfully!');
        console.log('Save these plan codes in your environment variables.');
    } catch (error) {
        console.error('Error setting up plans:', error);
    }
}

setupPlans();