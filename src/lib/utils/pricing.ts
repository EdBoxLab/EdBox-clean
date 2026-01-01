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
        id: 'premium',
        name: 'Premium',
        price: 9.99,
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
        id: 'premium',
        name: 'Premium',
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
