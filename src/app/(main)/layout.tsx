'use client';
import React from 'react';
import SideMenu from '../../components/SideMenu';
import { Header } from '../../components/Header';
import Footer from '../../components/Footer';
import KoalaGenie from '../../components/KoalaGenie';
import { Toaster } from '../../components/ui/toaster';
import { AppTour } from '../../components/AppTour';
import { StreakCelebrationModal } from '../../components/StreakXP';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppTour />
      <SideMenu />
      <main className="lg:pl-64 min-h-screen overflow-x-hidden overflow-y-auto bg-background pb-20 lg:pb-0">
        {children}
      </main>
      <div className="fixed bottom-4 right-4 z-50">
        <KoalaGenie />
      </div>
      <StreakCelebrationModal />
      <Toaster />
    </div>
  );
}
