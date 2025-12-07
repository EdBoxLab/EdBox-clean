'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Feed from '@/components/feed/Feed';
import Onboarding from '@/components/feed/Onboarding';
import type { UserPreferences } from '@/types/feed';
import { supabase } from '@/lib/supabase/client';
import { getUserPreferences, saveUserPreferences } from '@/services/userPreferencesService';
import { Loader2 } from 'lucide-react';

export default function FeedPage() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndPreferences = async () => {
      try {
        // Check if user is authenticated
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
          // Redirect to login if not authenticated
          router.push('/login');
          return;
        }

        setUser(currentUser);

        // Fetch user preferences from Supabase
        const userPrefs = await getUserPreferences(currentUser.id);

        if (userPrefs && userPrefs.onboarded) {
          setPreferences(userPrefs);
        } else {
          // User needs to complete onboarding
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

    // Save to Supabase
    const success = await saveUserPreferences(user.id, prefs);

    if (success) {
      setPreferences(prefs);
    } else {
      console.error('Failed to save preferences');
      // Still set preferences locally so user can proceed
      setPreferences(prefs);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-light tracking-wide text-muted-foreground">
          Loading...
        </h2>
      </div>
    );
  }

  if (!preferences) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return <Feed preferences={preferences} />;
}