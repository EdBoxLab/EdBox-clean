import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createServerSupabaseClient } from './supabase/server';

let ratelimit: InstanceType<typeof Ratelimit> | null = null;

export function getRateLimiter() {
  if (ratelimit) return ratelimit;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!upstashUrl || !upstashToken) {
    console.warn('Upstash Redis credentials not configured. Rate limiting disabled.');
    return null;
  }

  const redis = new Redis({
    url: upstashUrl,
    token: upstashToken,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 m'),
    analytics: true,
    prefix: 'edbox:ratelimit:study-kit',
  });

  return ratelimit;
}

export async function grantAdCredit(userId: string, credits: number = 1): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  const { data: usage } = await supabase
    .from('user_usage')
    .select('ad_credits')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    await supabase.from('user_usage').insert({ user_id: userId, ad_credits: credits });
    return;
  }

  await supabase
    .from('user_usage')
    .update({ ad_credits: (usage.ad_credits || 0) + credits })
    .eq('user_id', userId);
}

export async function grantAdCredit(userId: string, credits: number = 1): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  const { data: usage } = await supabase
    .from('user_usage')
    .select('ad_credits')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    await supabase.from('user_usage').insert({ user_id: userId, ad_credits: credits });
    return;
  }

  await supabase
    .from('user_usage')
    .update({ ad_credits: (usage.ad_credits || 0) + credits })
    .eq('user_id', userId);
}

export async function grantAdCredit(userId: string, credits: number = 1): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  const { data: usage } = await supabase
    .from('user_usage')
    .select('ad_credits')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    await supabase.from('user_usage').insert({ user_id: userId, ad_credits: credits });
    return;
  }

  await supabase
    .from('user_usage')
    .update({ ad_credits: (usage.ad_credits || 0) + credits })
    .eq('user_id', userId);
}

export async function grantAdCredit(userId: string, credits: number = 1): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  const { data: usage } = await supabase
    .from('user_usage')
    .select('ad_credits')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    await supabase.from('user_usage').insert({ user_id: userId, ad_credits: credits });
    return;
  }

  await supabase
    .from('user_usage')
    .update({ ad_credits: (usage.ad_credits || 0) + credits })
    .eq('user_id', userId);
}

export async function grantAdCredit(userId: string, credits: number = 1): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  const { data: usage } = await supabase
    .from('user_usage')
    .select('ad_credits')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    await supabase.from('user_usage').insert({ user_id: userId, ad_credits: credits });
    return;
  }

  await supabase
    .from('user_usage')
    .update({ ad_credits: (usage.ad_credits || 0) + credits })
    .eq('user_id', userId);
}

export async function grantAdCredit(userId: string, credits: number = 1): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  const { data: usage } = await supabase
    .from('user_usage')
    .select('ad_credits')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    await supabase.from('user_usage').insert({ user_id: userId, ad_credits: credits });
    return;
  }

  await supabase
    .from('user_usage')
    .update({ ad_credits: (usage.ad_credits || 0) + credits })
    .eq('user_id', userId);
}
export async function grantAdCredit(userId: string, credits: number = 1): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  const { data: usage } = await supabase
    .from('user_usage')
    .select('ad_credits')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    await supabase.from('user_usage').insert({ user_id: userId, ad_credits: credits });
    return;
  }

  await supabase
    .from('user_usage')
    .update({ ad_credits: (usage.ad_credits || 0) + credits })
    .eq('user_id', userId);
}

export async function grantAdCredit(userId: string, credits: number = 1): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  const { data: usage } = await supabase
    .from('user_usage')
    .select('ad_credits')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    await supabase.from('user_usage').insert({ user_id: userId, ad_credits: credits });
    return;
  }

  await supabase
    .from('user_usage')
    .update({ ad_credits: (usage.ad_credits || 0) + credits })
    .eq('user_id', userId);
}

export async function grantAdCredit(userId: string, credits: number = 1): Promise<void> {
  const supabase = await createSupabaseServerClient();
  
  const { data: usage } = await supabase
    .from('user_usage')
    .select('ad_credits')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    await supabase.from('user_usage').insert({ user_id: userId, ad_credits: credits });
    return;
  }

  await supabase
    .from('user_usage')
    .update({ ad_credits: (usage.ad_credits || 0) + credits })
    .eq('user_id', userId);
}
}


export async function grantAdCredit(userId: string, credits: number = 1): Promise<void> {
  const supabase = await createSupabaseServerClient();
  
  const { data: usage } = await supabase
    .from('user_usage')
    .select('ad_credits')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    await supabase.from('user_usage').insert({ user_id: userId, ad_credits: credits });
    return;
  }

  await supabase
    .from('user_usage')
    .update({ ad_credits: (usage.ad_credits || 0) + credits })
    .eq('user_id', userId);
}


}

export async function grantAdCredit(userId: string, credits: number = 1): Promise<void> {
  const supabase = await createSupabaseServerClient();
  
  const { data: usage } = await supabase
    .from('user_usage')
    .select('ad_credits')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    await supabase.from('user_usage').insert({ user_id: userId, ad_credits: credits });
    return;
  }

  await supabase
    .from('user_usage')
    .update({ ad_credits: (usage.ad_credits || 0) + credits })
    .eq('user_id', userId);
}


export async function grantAdCredit(userId: string, credits: number = 1): Promise<void> {
  const supabase = await createSupabaseServerClient();
  
  const { data: usage } = await supabase
    .from('user_usage')
    .select('ad_credits')
    .eq('user_id', userId)
    .single();

  if (!usage) {
    await supabase.from('user_usage').insert({ user_id: userId, ad_credits: credits });
    return;
  }

  await supabase
    .from('user_usage')
    .update({ ad_credits: (usage.ad_credits || 0) + credits })
    .eq('user_id', userId);
}



