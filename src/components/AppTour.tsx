'use client';

import React, { useEffect, useState } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { supabase } from '@/lib/supabase/client';
import { saveUserPreferences, getUserPreferences } from '@/services/userPreferencesService';

const steps: Step[] = [
  {
    target: '[data-tour="step-1"]',
    content: 'Welcome to EdBox! This is your personalized learning hub. Let\'s show you around.',
    disableBeacon: true,
  },
  {
    target: '[data-tour="step-2"]',
    content: 'The Home dashboard gives you a quick overview of your progress and active learning paths.',
  },
  {
    target: '[data-tour="step-3"]',
    content: 'Explore Courses to find structured learning content tailored to your goals.',
  },
  {
    target: '[data-tour="step-4"]',
    content: 'The Feed is where you\'ll find daily bite-sized learning content like quizzes, facts, and insights.',
  },
  {
    target: '[data-tour="step-5"]',
    content: 'Use Tools like the Note Taker and Study Kit to enhance your learning experience.',
  },
  {
    target: '[data-tour="step-6"]',
    content: 'Socials allow you to connect with others in Study Circles and join the community.',
  },
  {
    target: '[data-tour="step-user"]',
    content: 'Manage your profile, settings, and track your achievements here.',
  },
];

export function AppTour() {
  const [run, setRun] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkTourStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const prefs = await getUserPreferences(user.id);
        if (prefs && !prefs.tour_completed) {
          setRun(true);
        }
      }
    };
    checkTourStatus();

    // Listen for custom event to restart tour
    const handleRestartTour = () => setRun(true);
    window.addEventListener('restart-tour', handleRestartTour);
    return () => window.removeEventListener('restart-tour', handleRestartTour);
  }, []);

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      if (userId) {
        const prefs = await getUserPreferences(userId);
        if (prefs) {
          await saveUserPreferences(userId, {
            ...prefs,
            tour_completed: true,
          });
        }
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#4f46e5',
          backgroundColor: '#18181b',
          textColor: '#ffffff',
          arrowColor: '#18181b',
        },
        tooltip: {
          borderRadius: '12px',
          padding: '20px',
        },
        buttonNext: {
          borderRadius: '8px',
          fontWeight: '600',
        },
        buttonBack: {
          color: '#a1a1aa',
        },
        buttonSkip: {
          color: '#a1a1aa',
        },
      }}
    />
  );
}
