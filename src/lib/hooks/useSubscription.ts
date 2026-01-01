import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { SubscriptionTier, PLANS, PlanFeatures } from '@/lib/plans';

export function useSubscription() {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getSubscription() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTier('free');
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_subscriptions')
        .select('plan_id')
        .eq('user_id', user.id)
        .single();

      if (data?.plan_id) {
        setTier(data.plan_id as SubscriptionTier);
      }
      setLoading(false);
    }

    getSubscription();
  }, []);

  return {
    tier,
    plan: PLANS[tier],
    isPremium: tier === 'premium',
    loading,
  };
}
