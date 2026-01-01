import { createPlan, PAYSTACK_PLANS } from './src/lib/services/paystack';

async function setup() {
  console.log('Setting up Paystack plans...');
  
  const usdPlan = await createPlan(
    PAYSTACK_PLANS.PREMIUM_MONTHLY_USD.name,
    PAYSTACK_PLANS.PREMIUM_MONTHLY_USD.amount,
    PAYSTACK_PLANS.PREMIUM_MONTHLY_USD.interval,
    PAYSTACK_PLANS.PREMIUM_MONTHLY_USD.currency
  );
  console.log('USD Plan:', usdPlan);

  const ngnPlan = await createPlan(
    PAYSTACK_PLANS.PREMIUM_MONTHLY_NGN.name,
    PAYSTACK_PLANS.PREMIUM_MONTHLY_NGN.amount,
    PAYSTACK_PLANS.PREMIUM_MONTHLY_NGN.interval,
    PAYSTACK_PLANS.PREMIUM_MONTHLY_NGN.currency
  );
  console.log('NGN Plan:', ngnPlan);
}

// setup();
