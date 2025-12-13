import { createServerSupabaseClient } from '@/lib/supabase/server';

// Rate Limits for Free Tier
export const LIMITS = {
    FREE: {
        COURSES_PER_MONTH: 10,
        STUDY_KITS_PER_WEEK: 6,
        RESEARCH_PER_WEEK: 1,
    },
};

export type UsageType = 'course' | 'study_kit' | 'research';

interface RateLimitResult {
    allowed: boolean;
    isPro: boolean;
    usedAdCredit?: boolean;
    remaining?: number;
    limit?: number;
    resetDate?: Date;
}

/**
 * Check if user can perform an action based on rate limits
 * Returns true if allowed (either Pro user, within limits, or consumed ad credit)
 */
export async function checkRateLimit(
    userId: string,
    usageType: UsageType
): Promise<RateLimitResult> {
    const supabase = await createServerSupabaseClient();

    // Check subscription status
    const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan_id, status')
        .eq('user_id', userId)
        .single();

    const isPro = subscription?.plan_id?.startsWith('pro') && subscription?.status === 'active';

    // Pro users have unlimited access
    if (isPro) {
        return { allowed: true, isPro: true };
    }

    // Get or create usage record
    let { data: usage, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !usage) {
        // Create usage record if it doesn't exist
        const { data: newUsage } = await supabase
            .from('user_usage')
            .insert({ user_id: userId })
            .select()
            .single();
        usage = newUsage;
    }

    // Reset counters if needed
    const now = new Date();
    const lastResetMonth = new Date(usage.last_reset_month);
    const lastResetWeek = new Date(usage.last_reset_week);

    let needsUpdate = false;
    const updates: any = {};

    // Monthly reset (courses)
    if (now.getMonth() !== lastResetMonth.getMonth() || now.getFullYear() !== lastResetMonth.getFullYear()) {
        updates.courses_created_month = 0;
        updates.last_reset_month = now.toISOString();
        needsUpdate = true;
    }

    // Weekly reset (study kits, research)
    const weeksDiff = Math.floor((now.getTime() - lastResetWeek.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (weeksDiff >= 1) {
        updates.study_kits_created_week = 0;
        updates.research_queries_week = 0;
        updates.last_reset_week = now.toISOString();
        needsUpdate = true;
    }

    if (needsUpdate) {
        const { data: updatedUsage } = await supabase
            .from('user_usage')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();
        usage = updatedUsage || usage;
    }

    // Check limits based on usage type
    let currentUsage = 0;
    let limit = 0;
    let resetDate: Date;

    switch (usageType) {
        case 'course':
            currentUsage = usage.courses_created_month || 0;
            limit = LIMITS.FREE.COURSES_PER_MONTH;
            resetDate = new Date(lastResetMonth);
            resetDate.setMonth(resetDate.getMonth() + 1);
            break;
        case 'study_kit':
            currentUsage = usage.study_kits_created_week || 0;
            limit = LIMITS.FREE.STUDY_KITS_PER_WEEK;
            resetDate = new Date(lastResetWeek);
            resetDate.setDate(resetDate.getDate() + 7);
            break;
        case 'research':
            currentUsage = usage.research_queries_week || 0;
            limit = LIMITS.FREE.RESEARCH_PER_WEEK;
            resetDate = new Date(lastResetWeek);
            resetDate.setDate(resetDate.getDate() + 7);
            break;
    }

    // If within limit, allow
    if (currentUsage < limit) {
        return {
            allowed: true,
            isPro: false,
            remaining: limit - currentUsage,
            limit,
            resetDate,
        };
    }

    // If limit reached, try to consume ad credit
    const adCredits = usage.ad_credits || 0;
    if (adCredits > 0) {
        // Consume one ad credit
        await supabase
            .from('user_usage')
            .update({ ad_credits: adCredits - 1 })
            .eq('user_id', userId);

        return {
            allowed: true,
            isPro: false,
            usedAdCredit: true,
            remaining: 0,
            limit,
        };
    }

    // Limit reached and no ad credits
    return {
        allowed: false,
        isPro: false,
        remaining: 0,
        limit,
        resetDate,
    };
}

/**
 * Increment usage counter after successful action
 */
export async function incrementUsage(userId: string, usageType: UsageType): Promise<void> {
    const supabase = await createServerSupabaseClient();

    const updates: any = { updated_at: new Date().toISOString() };

    switch (usageType) {
        case 'course':
            // Use Postgres increment
            await supabase.rpc('increment_usage', {
                row_user_id: userId,
                usage_type: 'course',
            });
            break;
        case 'study_kit':
            await supabase.rpc('increment_usage', {
                row_user_id: userId,
                usage_type: 'study_kit',
            });
            break;
        case 'research':
            await supabase.rpc('increment_usage', {
                row_user_id: userId,
                usage_type: 'research',
            });
            break;
    }
}

/**
 * Grant ad credits after user watches ads
 * Each ad watched gives 1 credit
 */
export async function grantAdCredit(userId: string, credits: number = 1): Promise<void> {
    const supabase = await createServerSupabaseClient();

    const { data: usage } = await supabase
        .from('user_usage')
        .select('ad_credits')
        .eq('user_id', userId)
        .single();

    const currentCredits = usage?.ad_credits || 0;

    await supabase
        .from('user_usage')
        .update({ ad_credits: currentCredits + credits })
        .eq('user_id', userId);
}
