'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Feed from '@/components/feed/Feed';
import Onboarding from '@/components/feed/Onboarding';
import type { UserPreferences } from '@/types/feed';
import { supabase } from '@/lib/supabase/client';
import { getUserPreferences, saveUserPreferences } from '@/services/userPreferencesService';
import { Loader2 } from 'lucide-react';
import { NavigationTracker } from '@/components/NavigationTracker';

function FeedPageContent() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndPreferences = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
          router.push('/login');
          return;
        }

        setUser(currentUser);
        const userPrefs = await getUserPreferences(currentUser.id);

        if (userPrefs && userPrefs.onboarded) {
          setPreferences(userPrefs);
        } else {
          setPreferences(null);
        }
      } catch (error) {
        console.error('Error checking auth and preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndPreferences();
  }, [router]);

  const handleOnboardingComplete = async (prefs: UserPreferences) => {
    if (!user) return;
    const success = await saveUserPreferences(user.id, prefs);
    if (success) {
      setPreferences(prefs);
    } else {
      console.error('Failed to save preferences');
      setPreferences(prefs);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
        <h2 className="text-xl font-light tracking-wide text-white/50">
          Loading...
        </h2>
      </div>
    );
  }

  if (!preferences) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <NavigationTracker title="Daily Feed">
      <Feed preferences={preferences} />
    </NavigationTracker>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
      </div>
    }>
      <FeedPageContent />
    </Suspense>
  );
}
