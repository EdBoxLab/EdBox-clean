import { PricingClient } from './PricingClient';

export const metadata = {
  title: 'Pricing | EdBox',
  description: 'Choose the best plan for your learning journey.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PricingClient />
    </div>
  );
}
