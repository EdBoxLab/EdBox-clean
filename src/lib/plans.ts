export type SubscriptionTier = 'free' | 'premium';

export interface PlanFeatures {
  courses_per_month: number | 'unlimited';
  genie_messages_per_day: number | 'unlimited';
  ads_in_feed: boolean;
  unlimited_notes: boolean;
  study_kits_per_month: number | 'unlimited';
  circles_per_month: number | 'unlimited';
  can_generate_more_batches: boolean;
  advanced_notes_details: boolean;
}

export const PLANS: Record<SubscriptionTier, PlanFeatures> = {
  free: {
    courses_per_month: 15,
    genie_messages_per_day: 50,
    ads_in_feed: true,
    unlimited_notes: true,
    study_kits_per_month: 60,
    circles_per_month: 10,
    can_generate_more_batches: false,
    advanced_notes_details: false,
  },
  premium: {
    courses_per_month: 'unlimited',
    genie_messages_per_day: 'unlimited',
    ads_in_feed: false,
    unlimited_notes: true,
    study_kits_per_month: 'unlimited',
    circles_per_month: 'unlimited',
    can_generate_more_batches: true,
    advanced_notes_details: true,
  },
};
