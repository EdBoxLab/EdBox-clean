'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Download, Brain, Rocket } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode || isIOSStandalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      if (!dismissed || daysSinceDismissal > 7) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (isStandalone || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Animated backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50"
            onClick={handleDismiss}
          />

          {/* Install card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ 
              type: "spring", 
              damping: 25,
              stiffness: 300
            }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
          >
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border-2 border-transparent bg-clip-padding">
              {/* Animated gradient border */}
              <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-br from-[#3B82F6] via-[#8B5CF6] to-[#3B82F6] animate-gradient-xy -z-10" />
              
              {/* Floating particles background */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-full opacity-20"
                    animate={{
                      x: [0, Math.random() * 100 - 50],
                      y: [0, Math.random() * 100 - 50],
                      scale: [1, 1.5, 1],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: Math.random() * 2,
                    }}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                  />
                ))}
              </div>

              {/* EdBox gradient header with animation */}
              <div className="relative h-36 bg-gradient-to-br from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] overflow-hidden">
                {/* Animated gradient overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                  }} />
                </div>

                {/* Close button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                {/* Animated app icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring",
                    delay: 0.2,
                    damping: 15
                  }}
                  className="absolute -bottom-8 left-6"
                >
                  <div className="relative w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-3 border-4 border-white dark:border-slate-900">
                    <img src="/EdBoxLogo.png" alt="EdBox" className="w-full h-full object-contain" />
                    {/* Pulsing ring */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-[#3B82F6]"
                      animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Content */}
              <div className="relative bg-white dark:bg-slate-900 pt-12 px-6 pb-6">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">
                      Install EdBox
                    </h3>
                    <motion.div
                      animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                    >
                      <Rocket className="w-5 h-5 text-[#8B5CF6]" />
                    </motion.div>
                  </div>
                  
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 font-medium">
                    Actually learn. Actually understand. Actually on your home screen.
                  </p>
                </motion.div>

                {/* Animated features */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { icon: Zap, label: 'Lightning Fast', delay: 0.4, gradient: 'from-yellow-400 to-orange-500' },
                    { icon: Brain, label: 'Works Offline', delay: 0.5, gradient: 'from-purple-400 to-pink-500' },
                    { icon: Download, label: 'No App Store', delay: 0.6, gradient: 'from-blue-400 to-cyan-500' }
                  ].map(({ icon: Icon, label, delay, gradient }) => (
                    <motion.div
                      key={label}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay }}
                      whileHover={{ y: -4 }}
                      className="text-center"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-2 shadow-lg`}
                      >
                        <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                      </motion.div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Animated install button */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={handleInstall}
                  onHoverStart={() => setIsHovering(true)}
                  onHoverEnd={() => setIsHovering(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white font-bold py-4 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow"
                >
                  {/* Button shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: isHovering ? ['-100%', '200%'] : '-100%',
                    }}
                    transition={{
                      duration: 0.8,
                    }}
                  />
                  
                  <span className="relative flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    Install Now
                  </span>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  onClick={handleDismiss}
                  className="w-full mt-3 text-slate-500 dark:text-slate-400 font-medium py-2 hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
                >
                  Maybe later
                </motion.button>

                {/* Trust badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800"
                >
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                    Join <span className="font-bold text-[#3B82F6]">847 students</span> learning smarter
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}