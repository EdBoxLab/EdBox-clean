export const PAYSTACK_PLANS = {
  PREMIUM_MONTHLY_USD: {
    name: 'EdBox Premium Monthly (Global)',
    amount: 999, // In cents
    currency: 'USD',
    interval: 'monthly',
  },
  PREMIUM_MONTHLY_NGN: {
    name: 'EdBox Premium Monthly (Nigeria)',
    amount: 250000, // In kobo
    currency: 'NGN',
    interval: 'monthly',
  },
};

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function initializeTransaction(email: string, amount: number, currency: string, plan?: string, metadata?: any) {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount,
      currency,
      plan,
      metadata,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paystack/callback`,
    }),
  });

  return await response.json();
}

export async function verifyTransaction(reference: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  return await response.json();
}

export async function createPlan(name: string, amount: number, interval: string, currency: string) {
  const response = await fetch('https://api.paystack.co/plan', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      amount,
      interval,
      currency,
    }),
  });

  return await response.json();
}
