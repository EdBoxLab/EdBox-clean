import { createSupabaseServerClient } from './supabase/server';

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
