'use client';

import React from 'react';
import OnboardingForm from '@/components/OnboardingForm';
import { FileText, Zap } from 'lucide-react';
import { StreakCard } from '@/components/StreakXP';
import { DiscoverFeed } from '@/components/feed/DiscoverFeed';
import { useDashboardData } from '@/hooks/useDashboardData';
import { ExploreRow } from '@/components/dashboard/ExploreRow';
import { FocusSession } from '@/components/dashboard/FocusSession';

const Dashboard: React.FC = () => {
  const {
    user,
    profile,
    setProfile,
    loading,
    courses,
    notes,
    studyKits,
    recentCourse,
    coursesLoading,
    notesLoading,
    kitsLoading,
    handleDelete
  } = useDashboardData();

  const tools = [
    { id: 't2', title: 'Note Taker', type: 'Tool', href: '/tools/notes', icon: <FileText className="w-8 h-8 text-green-300" /> },
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
            <p className="text-sm sm:text-base md:text-lg text-gray-400">Let's continue your learning journey.</p>
          </div>
          <div className="w-full max-w-full lg:max-w-sm">
            <StreakCard />
          </div>
        </div>

        <div className="mb-12">
          <DiscoverFeed />
        </div>

        <FocusSession recentCourse={recentCourse} />

        <div>
          <h2 className="text-3xl font-bold text-white mb-6">Explore</h2>
          <ExploreRow
            title="Your Courses"
            items={courses}
            emptyMessage="You haven't enrolled in any courses yet."
            showProgress={true}
            createLink="/creator"
            createText="Create Your First Course"
            isLoading={coursesLoading}
            onDelete={handleDelete}
          />
          <ExploreRow
            title="Your Notes"
            items={notes}
            emptyMessage="No notes created yet. Use the Note Taker to get started!"
            isLoading={notesLoading}
            onDelete={handleDelete}
          />
          <ExploreRow
            title="Your Study Kits"
            items={studyKits}
            emptyMessage="No study kits generated yet. Use Study Kit to create one!"
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
