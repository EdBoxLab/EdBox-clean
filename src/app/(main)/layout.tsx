'use client';
import React, { useState, useEffect } from 'react';
import { useGenie } from '@/lib/contexts/GenieContext';
import Script from 'next/script';
import SideMenu from '../../components/SideMenu';
import { Header } from '../../components/Header';
import Footer from '../../components/Footer';
import { GlobalGenie } from '../../components/Genie/GlobalGenie';
import { Toaster } from '../../components/ui/toaster';
import { AppTour } from '../../components/AppTour';


declare global {
  interface Window {
    Supademo?: {
      open: (demoId: string) => void;
    };
  }
}

import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, isPinned } = useGenie();
  const [isMobile, setIsMobile] = useState(false);
  const showPadding = isOpen && isPinned;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showWorkspacePadding = showPadding && !isMobile;

  return (
    <>
      <Script 
        src="https://script.supademo.com/supademo.js" 
        strategy="afterInteractive"
      />
      <Script
        src="https://unpkg.com/@babel/standalone/babel.min.js"
        strategy="beforeInteractive"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
        integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
        crossOrigin="anonymous"
      />
      <div className="min-h-screen bg-background overflow-hidden relative">
        <AppTour />
        <SideMenu />
        
        <MotionDiv
          animate={{ 
            width: showWorkspacePadding ? 'calc(100% - 450px)' : '100%',
          }}
          transition={{ type: 'spring', damping: 30, stiffness: 200 }}
          className={`min-h-screen ${isPinned ? 'md:pl-0' : ''}`}
        >
          <main className="lg:pl-64 min-h-screen overflow-x-hidden overflow-y-auto bg-background pb-20 lg:pb-0">
            {children}
          </main>
        </MotionDiv>

        <GlobalGenie />
        <Toaster />
      </div>
    </>
  );
}


