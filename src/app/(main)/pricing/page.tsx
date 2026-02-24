import { headers } from 'next/headers';
import { PricingClient } from './PricingClient';
import { getRecommendedCurrency } from '@/lib/utils/pricing';

export const metadata = {
  title: 'Pricing | EdBox',
  description: 'Choose the best plan for your learning journey.',
};

export default async function PricingPage() {
  const headersList = await headers();
  const countryCode = headersList.get('x-vercel-ip-country') || 'US';
  const currency = getRecommendedCurrency(countryCode);

  console.log('--- Pricing Detection Logs ---');
  console.log('Raw x-vercel-ip-country value:', headersList.get('x-vercel-ip-country'));
  console.log('Final countryCode used:', countryCode);
  console.log('Mapped currency result:', currency);
  console.log('------------------------------');

  return (
    <div className="min-h-screen bg-background">
      <PricingClient initialCurrency={currency} />
    </div>
  );
}
