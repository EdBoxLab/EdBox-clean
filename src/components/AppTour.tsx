'use client';

import { useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const SUPADEMO_ID = 'cmllhfspu2bdt5yi35o3fmqi8';

export const AppTour = () => {
  const supabase = createSupabaseBrowserClient();

  const openSupademo = useCallback(() => {
    if (typeof window !== 'undefined' && window.Supademo) {
      window.Supademo.open(SUPADEMO_ID);
    }
  }, []);

  const markSupademoSeen = useCallback(async (userId: string) => {
    await supabase
      .from('user_preferences')
      .upsert({ id: userId, supademo_seen: true }, { onConflict: 'id' });
  }, [supabase]);

  useEffect(() => {
    const checkAndShowTour = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('supademo_seen, onboarded')
        .eq('id', user.id)
        .maybeSingle();

      const hasSeenSupademo = prefs?.supademo_seen ?? false;
      const isOnboarded = prefs?.onboarded ?? false;

      if (!hasSeenSupademo && isOnboarded) {
        setTimeout(() => {
          openSupademo();
          markSupademoSeen(user.id);
        }, 2000);
      }
    };

    checkAndShowTour();

    const handleRestartTour = () => {
      openSupademo();
    };

    window.addEventListener('restart-tour', handleRestartTour);

    return () => {
      window.removeEventListener('restart-tour', handleRestartTour);
    };
  }, [supabase, openSupademo, markSupademoSeen]);

  return null;
};
