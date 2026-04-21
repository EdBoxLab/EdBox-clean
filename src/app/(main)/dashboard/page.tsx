'use client';

import React from 'react';
import OnboardingForm from '@/components/OnboardingForm';
import { Zap } from 'lucide-react';
import { StreakCard } from '@/components/StreakXP';
import { DiscoverFeed } from '@/components/feed/DiscoverFeed';
import { useDashboardData } from '@/hooks/useDashboardData';
import { ExploreRow } from '@/components/dashboard/ExploreRow';

const Dashboard: React.FC = () => {
  const {
    user,
    profile,
    setProfile,
    loading,
    studyKits,
    kitsLoading,
    handleDelete
  } = useDashboardData();

  const tools = [
    { id: 't3', title: 'Study Kit', type: 'Tool', href: '/tools/study-kit', icon: <Zap className="w-8 h-8 text-yellow-300" /> },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-zinc-950 text-white gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400">Loading your dashboard...</p>
      </div>
    );
  }

  if (!profile || !profile.onboarding_completed) {
    return <OnboardingForm onComplete={(newProfile) => setProfile(newProfile)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 py-4 sm:p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-1 sm:mb-2 break-words">
              Welcome, {profile?.username || user?.email?.split('@')[0]}!
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-400">Let's study smarter and finish stronger.</p>
          </div>
          <div className="w-full max-w-full lg:max-w-sm">
            <StreakCard />
          </div>
        </div>

        <div className="mb-12">
          <DiscoverFeed />
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-6">Explore</h2>
          <ExploreRow
            title="Your Study Kits"
            items={studyKits}
            emptyMessage="Upload your PDF, link, or topic to generate AI quizzes, flashcards, notes, and mind maps."
            createLink="/tools/study-kit"
            createText="Generate Study Kit"
            isLoading={kitsLoading}
            onDelete={handleDelete}
          />
          <ExploreRow title="Tools" items={tools} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
