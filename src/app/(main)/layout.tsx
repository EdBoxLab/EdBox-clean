'use client';
import React from 'react';
import Script from 'next/script';
import SideMenu from '../../components/SideMenu';
import { Header } from '../../components/Header';
import Footer from '../../components/Footer';
import KoalaGenie from '../../components/KoalaGenie';
import { Toaster } from '../../components/ui/toaster';
import { AppTour } from '../../components/AppTour';

declare global {
  interface Window {
    Supademo?: {
      open: (demoId: string) => void;
    };
  }
}

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script 
        src="https://script.supademo.com/supademo.js" 
        strategy="afterInteractive"
      />
      <div className="min-h-screen bg-background">
        <AppTour />
        <SideMenu />
      <main className="lg:pl-64 min-h-screen overflow-x-hidden overflow-y-auto bg-background pb-20 lg:pb-0">
        {children}
      </main>
      <KoalaGenie />
      <Toaster />
      </div>
    </>
  );
}
