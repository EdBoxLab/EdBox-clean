'use client';
import React from 'react';
import SideMenu from '../../components/SideMenu';
import { Header } from '../../components/Header';
import Footer from '../../components/Footer';
import KoalaGenie from '../../components/KoalaGenie';
import { Toaster } from '../../components/ui/toaster';

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <SideMenu />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 dark:bg-gray-800 p-2 sm:p-4 md:p-6">
          {children}
        </main>
        <Footer />
      </div>
      <div className="fixed bottom-4 right-4 z-50">
        <KoalaGenie />
      </div>
      <Toaster />
    </div>
  );
}
