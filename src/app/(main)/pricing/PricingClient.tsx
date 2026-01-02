'use client';

import { useState } from 'react';
import { Check, Globe, Zap } from 'lucide-react';
import { PRICING_PLANS, formatPrice, Currency } from '@/lib/utils/pricing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export function PricingClient() {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const plans = PRICING_PLANS[currency].filter(p => p.id === 'free' || p.interval === billingInterval);

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
        credentials: 'include', // ← ADD THIS - Important for cookies!
        body: JSON.stringify({
          amount: plan.price * 100, // Paystack expects kobo/cents
          currency: plan.currency,
          plan: plan.id, // ← ADD THIS - Your backend expects this
          metadata: {
            plan_id: plan.id,
            interval: plan.interval, // Also good to include
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to initialize payment',
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

        <div className="flex flex-col items-center mt-8 gap-6">
          <div className="flex items-center gap-4">
            <span className={`text-sm ${currency === 'USD' ? 'font-bold' : 'text-muted-foreground'}`}>Global (USD)</span>
            <button
              onClick={() => setCurrency(currency === 'USD' ? 'NGN' : 'USD')}
              className="relative w-12 h-6 bg-primary/20 rounded-full p-1 transition-colors"
            >
              <div
                className={`w-4 h-4 bg-primary rounded-full transition-transform ${currency === 'NGN' ? 'translate-x-6' : 'translate-x-0'
                  }`}
              />
            </button>
            <span className={`text-sm ${currency === 'NGN' ? 'font-bold' : 'text-muted-foreground'}`}>Nigeria (NGN)</span>
          </div>

          <div className="flex items-center gap-4 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingInterval === 'monthly' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-zinc-400 hover:text-white'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billingInterval === 'yearly' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-zinc-400 hover:text-white'
                }`}
            >
              Yearly
              <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">
                -15%
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card key={plan.id} className={`flex flex-col ${plan.id.includes('premium') ? 'border-primary shadow-lg scale-105' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {plan.id === 'free' ? 'Essential tools to get started' : 'Everything you need to excel'}
                  </CardDescription>
                </div>
                {plan.id.includes('premium') && (
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" /> RECOMMENDED
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-6">
                <span className="text-4xl font-bold">{formatPrice(plan.price, plan.currency)}</span>
                <span className="text-muted-foreground">/{plan.interval === 'monthly' ? 'mo' : 'yr'}</span>
                {plan.interval === 'yearly' && (
                  <p className="text-xs text-green-500 font-medium mt-1">
                    Equivalent to {formatPrice(plan.price / 12, plan.currency)}/mo
                  </p>
                )}
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
                variant={plan.id.includes('premium') ? 'default' : 'outline'}
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