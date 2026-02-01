'use client';

import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export const AppTour = () => {
  const driverObj = useRef<any>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const initDriver = () => {
      const isMobile = window.innerWidth < 1024;

      driverObj.current = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayOpacity: 0.75,
        stagePadding: 10,
        nextBtnText: 'Next →',
        prevBtnText: '← Back',
        doneBtnText: 'Get Started! 🚀',
        steps: [
          {
            element: isMobile ? '[data-tour="step-1-mobile"]' : '[data-tour="step-1"]',
            popover: {
              title: 'Welcome to EdBox! 👋',
              description: 'We\'re thrilled to have you! This is your ultimate AI-powered workspace. Ready to see how it works?',
              side: isMobile ? "bottom" : "right",
              align: 'start'
            }
          },
          {
            element: isMobile ? '[data-tour="step-2-mobile"]' : '[data-tour="step-2"]',
            popover: {
              title: 'Your Dashboard Hub 📊',
              description: 'Keep track of your learning streaks, goals, and recent activity at a glance. Everything you need is right here.',
              side: isMobile ? "top" : "right",
              align: 'start'
            }
          },
          {
            element: isMobile ? '[data-tour="step-3-mobile"]' : '[data-tour="step-3"]',
            popover: {
              title: 'Interactive Courses 📚',
              description: 'Dive into courses that adapt to you. Generate quizzes, challenges, and roadmaps with a single click!',
              side: isMobile ? "top" : "right",
              align: 'start'
            }
          },
          {
            element: isMobile ? '[data-tour="step-4-mobile"]' : '[data-tour="step-4"]',
            popover: {
              title: 'Smart Study Tools 🛠️',
              description: 'Notes, Flashcards, and Study Kits—supercharged by AI to help you learn 2x faster.',
              side: isMobile ? "top" : "right",
              align: 'start'
            }
          },
          {
            element: isMobile ? '[data-tour="step-6-mobile"]' : '[data-tour="step-6"]',
            popover: {
              title: 'Study Circles 🤝',
              description: 'Learning is better together! Join circles, chat with peers, and collaborate on shared goals.',
              side: isMobile ? "top" : "right",
              align: 'start'
            }
          },
          {
            element: isMobile ? '[data-tour="step-user-mobile-trigger"]' : '[data-tour="step-user"]',
            popover: {
              title: 'You\'re in Control ⚙️',
              description: 'Customize your profile, adjust your learning preferences, and toggle the appearance from this menu.',
              side: "top",
              align: 'start'
            }
          },
          {
            element: '[data-tour="step-genie"]',
            popover: {
              title: 'Meet Genie 🧞‍♂️',
              description: 'Genie is always here to help. Stuck on a topic? Just ask! It can explain complex concepts in seconds.',
              side: isMobile ? "top" : "left",
              align: 'start'
            }
          },
        ],

        onDestroyed: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('user_preferences')
              .upsert({ id: user.id, onboarded: true });
          }
        }
      });
    };

    initDriver();

    const handleRestartTour = () => {
      if (!driverObj.current) initDriver();
      // Give UI a moment to stabilize
      setTimeout(() => {
        driverObj.current?.drive();
      }, 100);
    };

    window.addEventListener('restart-tour', handleRestartTour);

    const checkOnboarding = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('onboarded')
          .eq('id', user.id)
          .maybeSingle();

        if (!prefs || !prefs.onboarded) {
          setTimeout(() => {
            if (!driverObj.current) initDriver();
            driverObj.current?.drive();
          }, 2000);
        }
      }
    };

    checkOnboarding();

    return () => {
      window.removeEventListener('restart-tour', handleRestartTour);
      driverObj.current?.destroy();
    };
  }, [supabase]);


  return null;
};
