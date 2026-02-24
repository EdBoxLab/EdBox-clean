export type Currency = 'USD' | 'NGN';

export interface PlanDetails {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  interval: 'monthly' | 'yearly';
  features: string[];
}

export const PRICING_PLANS: Record<Currency, PlanDetails[]> = {
  USD: [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'USD',
      interval: 'monthly',
      features: [
        '15 free courses per month',
        '50 free Genie messages daily',
        'Unlimited notes',
        '60 study kits per month',
        '10 study circles you can create',
        'Ad-supported feed',
      ],
    },
    {
      id: 'premium_monthly',
      name: 'Premium Monthly',
      price: 6.99,
      currency: 'USD',
      interval: 'monthly',
      features: [
        'Unlimited everything',
        'No ads in feed or study kits',
        'Batch generate 10+ quizzes/flashcards',
        'Advanced detailed notes customization',
        'Full access to all AI Engines',
        'Verified Smart Certificates',
      ],
    },
    {
      id: 'premium_yearly',
      name: 'Premium Yearly',
      price: 71.29, // 15% discount on 6.99 * 12 (83.88)
      currency: 'USD',
      interval: 'yearly',
      features: [
        'Unlimited everything',
        'No ads in feed or study kits',
        'Batch generate 10+ quizzes/flashcards',
        'Advanced detailed notes customization',
        'Full access to all AI Engines',
        'Verified Smart Certificates',
        'Priority support',
      ],
    },
  ],
  NGN: [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'NGN',
      interval: 'monthly',
      features: [
        '15 free courses per month',
        '50 free Genie messages daily',
        'Unlimited notes',
        '60 study kits per month',
        '10 study circles you can create',
        'Ad-supported feed',
      ],
    },
    {
      id: 'premium_monthly',
      name: 'Premium Monthly',
      price: 2500,
      currency: 'NGN',
      interval: 'monthly',
      features: [
        'Unlimited everything',
        'No ads in feed or study kits',
        'Batch generate 10+ quizzes/flashcards',
        'Advanced detailed notes customization',
        'Full access to all AI Engines',
        'Verified Smart Certificates',
      ],
    },
    {
      id: 'premium_yearly',
      name: 'Premium Yearly',
      price: 25500, // 15% discount on 2500 * 12 (30000)
      currency: 'NGN',
      interval: 'yearly',
      features: [
        'Unlimited everything',
        'No ads in feed or study kits',
        'Batch generate 10+ quizzes/flashcards',
        'Advanced detailed notes customization',
        'Full access to all AI Engines',
        'Verified Smart Certificates',
        'Priority support',
      ],
    },
  ],
};

export function formatPrice(price: number, currency: Currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

export function getRecommendedCurrency(countryCode?: string): Currency {
  if (countryCode === 'NG') return 'NGN';
  // Add other countries here if needed, e.g. India fallback to USD for now or handle INR
  return 'USD';
}

export async function getLiveExchangeRate(from: Currency, to: Currency): Promise<number> {
  if (from === to) return 1;

  try {
    // using a highly available free API, no auth required for base rates
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`, {
      next: { revalidate: 3600 } // Cache for 1 hour to prevent rate limiting
    });

    if (!response.ok) throw new Error('Failed to fetch exchange rates');

    const data = await response.json();
    const rate = data.rates[to];

    if (!rate) throw new Error(`Exchange rate for ${to} not found`);

    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Fallback to a safe hardcoded rate if the API fails just in case (e.g., 1 USD = 1500 NGN)
    return from === 'USD' && to === 'NGN' ? 1500 : 1;
  }
}
