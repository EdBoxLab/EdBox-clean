import { createSupabaseServerClient } from './supabase/server';
import { PLANS, SubscriptionTier } from './plans';

export async function getUserTier(): Promise<SubscriptionTier> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 'free';

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('plan_id')
    .eq('user_id', user.id)
    .single();

  return (subscription?.plan_id as SubscriptionTier) || 'free';
}

export async function checkUsageLimit(
  usageType: 'course' | 'study_kit' | 'genie_message' | 'circle'
): Promise<{ allowed: boolean; remaining: number | 'unlimited' }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { allowed: false, remaining: 0 };

  const tier = await getUserTier();
  const plan = PLANS[tier];

  const { data: usage } = await supabase
    .from('user_usage')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!usage) {
    // If no usage record exists, create one
    await supabase.from('user_usage').insert({ user_id: user.id });
    return { allowed: true, remaining: getLimitForType(plan, usageType) };
  }

  // Handle resets
  const now = new Date();
  const lastResetDaily = new Date(usage.last_reset_daily);
  const lastResetMonth = new Date(usage.last_reset_month);

  const isNewDay = now.toDateString() !== lastResetDaily.toDateString();
  const isNewMonth = now.getMonth() !== lastResetMonth.getMonth() || now.getFullYear() !== lastResetMonth.getFullYear();

  let currentUsage = 0;
  let limit: number | 'unlimited' = getLimitForType(plan, usageType);

  if (usageType === 'genie_message') {
    if (isNewDay) {
      await supabase.from('user_usage').update({ genie_messages_daily: 0, last_reset_daily: now.toISOString() }).eq('user_id', user.id);
      currentUsage = 0;
    } else {
      currentUsage = usage.genie_messages_daily;
    }
  } else if (usageType === 'course') {
    if (isNewMonth) {
      await supabase.from('user_usage').update({ courses_created_month: 0, last_reset_month: now.toISOString() }).eq('user_id', user.id);
      currentUsage = 0;
    } else {
      currentUsage = usage.courses_created_month;
    }
} else if (usageType === 'study_kit') {
      if (isNewMonth) {
        await supabase.from('user_usage').update({ study_kits_created_week: 0, last_reset_month: now.toISOString() }).eq('user_id', user.id);
        currentUsage = 0;
      } else {
        currentUsage = usage.study_kits_created_week;
      }

  } else if (usageType === 'circle') {
     currentUsage = usage.circles_created;
  }

  if (limit === 'unlimited') return { allowed: true, remaining: 'unlimited' };
  
  const allowed = currentUsage < limit;
  const remaining = Math.max(0, limit - currentUsage);

  return { allowed, remaining };
}

function getLimitForType(plan: any, type: string): number | 'unlimited' {
  switch (type) {
    case 'course': return plan.courses_per_month;
    case 'study_kit': return plan.study_kits_per_month;
    case 'genie_message': return plan.genie_messages_per_day;
    case 'circle': return plan.circles_per_month;
    default: return 0;
  }
}

export async function incrementUsage(usageType: 'course' | 'study_kit' | 'genie_message' | 'circle') {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase.rpc('increment_usage', {
    row_user_id: user.id,
    usage_type: usageType
  });

  if (error) console.error('Error incrementing usage:', error);
  return data;
}

export async function grantAdCredit(userId: string, credits: number = 1) {
  const supabase = await createSupabaseServerClient();
  
  const { data: usage } = await supabase
    .from('user_usage')
    .select('ad_credits')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    await supabase.from('user_usage').insert({
      user_id: userId,
      ad_credits: credits
    });
  } else {
    await supabase
      .from('user_usage')
      .update({ ad_credits: (usage.ad_credits || 0) + credits })
      .eq('user_id', userId);
  }
}
