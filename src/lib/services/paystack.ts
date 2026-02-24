export const PAYSTACK_PLANS = {
  PREMIUM_MONTHLY_USD: {
    name: 'EdBox Premium Monthly (Global)',
    amount: 999, // $9.99 in cents
    currency: 'USD',
    interval: 'monthly',
    plan_code: process.env.PAYSTACK_PLAN_USD_MONTHLY,
  },
  PREMIUM_YEARLY_USD: {
    name: 'EdBox Premium Yearly (Global)',
    amount: 10188, // $101.88 in cents (15% discount)
    currency: 'USD',
    interval: 'annually',
    plan_code: process.env.PAYSTACK_PLAN_USD_YEARLY,
  },
  PREMIUM_MONTHLY_NGN: {
    name: 'EdBox Premium Monthly (Nigeria)',
    amount: 250000, // ₦2,500 in kobo
    currency: 'NGN',
    interval: 'monthly',
    plan_code: process.env.PAYSTACK_PLAN_NGN_MONTHLY,
  },
  PREMIUM_YEARLY_NGN: {
    name: 'EdBox Premium Yearly (Nigeria)',
    amount: 2550000, // ₦25,500 in kobo (15% discount)
    currency: 'NGN',
    interval: 'annually',
    plan_code: process.env.PAYSTACK_PLAN_NGN_YEARLY,
  },
};

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY is not defined in environment variables');
}

interface PaystackResponse {
  status: boolean;
  message: string;
  data?: any;
}

// Modified: Now supports recurring payments via plans, with dynamic USD-NGN conversion & plan creation
export async function initializeTransaction(
  email: string,
  amount: number, // amount here is originally in cents (e.g. 699 for $6.99) or kobo if NGN
  currency: string,
  planId?: string,
  metadata?: any
): Promise<PaystackResponse> {
  try {
    console.log('Initializing Paystack transaction:', {
      email,
      amount,
      currency,
      planId,
      metadata,
    });

    if (!email || !amount || !currency) {
      throw new Error('Missing required fields: email, amount, or currency');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // We import dynamically to avoid circular dependencies if getLiveExchangeRate isn't readily available
    const { getLiveExchangeRate } = await import('@/lib/utils/pricing');

    const payload: any = {
      email,
      amount,
      metadata: {
        ...metadata,
        plan_id: planId,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paystack/callback`,
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
    };

    let finalPlanCode: string | undefined = undefined;

    if (currency === 'USD') {
      // It's a USD payment, we must convert it to NGN and create a dynamic plan
      // amount is currently in cents (e.g., 699 = $6.99)
      const usdAmount = amount / 100;

      const liveRate = await getLiveExchangeRate('USD', 'NGN');

      // Calculate NGN equivalent (in Kobo). Round up.
      const ngnAmount = Math.ceil(usdAmount * liveRate);
      const ngnAmountKobo = ngnAmount * 100;

      // Override payload to strictly use NGN
      payload.amount = ngnAmountKobo;
      payload.currency = 'NGN';

      const interval = planId?.includes('yearly') ? 'annually' : 'monthly';

      // Create a unique name to avoid naming collisions but be recognizable
      const planName = `EdBox ${interval === 'monthly' ? 'Monthly' : 'Yearly'} Global (NGN eqv of $${usdAmount})`;

      // Call Paystack to create this plan on the fly
      // Note: If a user checks out today at 6.99 with rate 1500 -> 10,485 NGN
      // The plan will be created. We could technically reuse it via DB, but creating on the fly solves Option 1 directly.
      const newPlan = await createPlan(planName, ngnAmountKobo, interval, 'NGN');
      finalPlanCode = newPlan.data?.plan_code;

    } else {
      // Standard NGN process
      const planKey = `PREMIUM_${planId?.includes('yearly') ? 'YEARLY' : 'MONTHLY'}_${currency}` as keyof typeof PAYSTACK_PLANS;
      const staticPlan = PAYSTACK_PLANS[planKey];

      if (!staticPlan) {
        throw new Error(`Invalid static plan: ${planKey}`);
      }

      payload.currency = currency;
      finalPlanCode = staticPlan.plan_code;
    }

    // Add plan code for recurring payments
    if (finalPlanCode) {
      payload.plan = finalPlanCode;
      console.log('Using plan for recurring payment:', finalPlanCode);
    }

    // Only pass currency if it's NGN, or omit entirely as per user request to bypass USD restriction
    if (currency && currency !== 'USD') {
      payload.currency = currency;
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: PaystackResponse = await response.json();

    if (!response.ok) {
      console.error('Paystack initialization failed:', data);
      throw new Error(data.message || 'Failed to initialize transaction');
    }

    console.log('Paystack transaction initialized:', data.data?.reference);
    return data;
  } catch (error: any) {
    console.error('Paystack initializeTransaction error:', error);
    throw new Error(error.message || 'Failed to initialize payment');
  }
}

export async function verifyTransaction(reference: string): Promise<PaystackResponse> {
  try {
    console.log('Verifying Paystack transaction:', reference);

    if (!reference) {
      throw new Error('Transaction reference is required');
    }

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data: PaystackResponse = await response.json();

    if (!response.ok) {
      console.error('Paystack verification failed:', data);
      throw new Error(data.message || 'Failed to verify transaction');
    }

    console.log('Transaction verified:', {
      reference,
      status: data.data?.status,
      amount: data.data?.amount,
      subscription_code: data.data?.authorization?.subscription_code,
    });

    return data;
  } catch (error: any) {
    console.error('Paystack verifyTransaction error:', error);
    throw new Error(error.message || 'Failed to verify payment');
  }
}

export async function createPlan(
  name: string,
  amount: number,
  interval: string,
  currency: string
): Promise<PaystackResponse> {
  try {
    console.log('Creating Paystack plan:', { name, amount, interval, currency });

    if (!name || !amount || !interval || !currency) {
      throw new Error('Missing required fields for plan creation');
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/plan`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        amount,
        interval, // 'monthly', 'annually', 'quarterly', 'weekly'
        currency,
      }),
    });

    const data: PaystackResponse = await response.json();

    if (!response.ok) {
      console.error('Paystack plan creation failed:', data);
      throw new Error(data.message || 'Failed to create plan');
    }

    console.log('Plan created successfully:', data.data?.plan_code);
    return data;
  } catch (error: any) {
    console.error('Paystack createPlan error:', error);
    throw new Error(error.message || 'Failed to create plan');
  }
}

// Get subscription details
export async function getSubscription(
  subscriptionCode: string
): Promise<PaystackResponse> {
  try {
    const response = await fetch(
      `${PAYSTACK_BASE_URL}/subscription/${encodeURIComponent(subscriptionCode)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data: PaystackResponse = await response.json();

    if (!response.ok) {
      console.error('Failed to get subscription:', data);
      throw new Error(data.message || 'Failed to get subscription');
    }

    return data;
  } catch (error: any) {
    console.error('Paystack getSubscription error:', error);
    throw new Error(error.message || 'Failed to get subscription');
  }
}

// Cancel subscription
export async function cancelSubscription(
  subscriptionCode: string,
  emailToken: string
): Promise<PaystackResponse> {
  try {
    console.log('Cancelling Paystack subscription:', subscriptionCode);

    const response = await fetch(`${PAYSTACK_BASE_URL}/subscription/disable`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: subscriptionCode,
        token: emailToken,
      }),
    });

    const data: PaystackResponse = await response.json();

    if (!response.ok) {
      console.error('Paystack subscription cancellation failed:', data);
      throw new Error(data.message || 'Failed to cancel subscription');
    }

    console.log('Subscription cancelled successfully');
    return data;
  } catch (error: any) {
    console.error('Paystack cancelSubscription error:', error);
    throw new Error(error.message || 'Failed to cancel subscription');
  }
}