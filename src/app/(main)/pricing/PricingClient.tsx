'use client';

import { useState } from 'react';
import { Check, Globe, Zap } from 'lucide-react';
import { PRICING_PLANS, formatPrice, Currency } from '@/lib/utils/pricing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export function PricingClient() {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      toast({
        title: 'Already on Free Plan',
        description: 'You already have access to all free features.',
      });
      return;
    }

    setLoading(planId);
    try {
      const plan = PRICING_PLANS[currency].find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      const response = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currency === 'NGN' ? plan.price * 100 : plan.price * 100, // Paystack expects kobo/cents
          currency: plan.currency,
          metadata: {
            plan_id: plan.id,
          },
        }),
      });

      const data = await response.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Path to Mastery</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Unlock the full power of EdBox with Premium. Personalized, unlimited, and designed for your success.
        </p>

        <div className="flex items-center justify-center mt-8 gap-4">
          <span className={`text-sm ${currency === 'USD' ? 'font-bold' : 'text-muted-foreground'}`}>Global (USD)</span>
          <button
            onClick={() => setCurrency(currency === 'USD' ? 'NGN' : 'USD')}
            className="relative w-12 h-6 bg-primary/20 rounded-full p-1 transition-colors"
          >
            <div
              className={`w-4 h-4 bg-primary rounded-full transition-transform ${
                currency === 'NGN' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm ${currency === 'NGN' ? 'font-bold' : 'text-muted-foreground'}`}>Nigeria (NGN)</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {PRICING_PLANS[currency].map((plan) => (
          <Card key={plan.id} className={`flex flex-col ${plan.id === 'premium' ? 'border-primary shadow-lg scale-105' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {plan.id === 'free' ? 'Essential tools to get started' : 'Everything you need to excel'}
                  </CardDescription>
                </div>
                {plan.id === 'premium' && (
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" /> RECOMMENDED
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-6">
                <span className="text-4xl font-bold">{formatPrice(plan.price, plan.currency)}</span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </div>
              <ul className="space-y-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full h-12 text-lg"
                variant={plan.id === 'premium' ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null}
              >
                {loading === plan.id ? 'Processing...' : plan.id === 'free' ? 'Current Plan' : 'Upgrade to Premium'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Globe className="w-5 h-5" />
          <span>Regional pricing enabled for accessibility</span>
        </div>
        <p className="text-sm">
          Secure payments powered by Paystack. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
