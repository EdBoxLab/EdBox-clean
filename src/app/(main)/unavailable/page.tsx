'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft, Loader2 } from 'lucide-react';

export default function UnavailablePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[oklch(0.14_0.02_240)] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-lg w-full"
      >
        <div className="bg-white rounded-[24px] p-8 sm:p-12 border border-[rgba(148,163,184,0.1)] shadow-[0_12px_24px_rgba(0,0,0,0.1)] text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4, type: 'spring' }}
            className="inline-flex items-center justify-center w-20 h-20 bg-[#3B82F6]/10 rounded-full mb-8"
          >
            <Construction className="w-10 h-10 text-[#3B82F6]" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-4"
          >
            We'll Be Right Back
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[#64748B] text-base sm:text-lg mb-8 leading-relaxed"
          >
            We're currently working on some improvements to make this feature even better for you.
            Things are a bit bumpy right now, but we'll be back online shortly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
              Return to Dashboard
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 pt-6 border-t border-[rgba(148,163,184,0.1)]"
          >
            <div className="flex items-center justify-center gap-2 text-[#94A3B8] text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Estimated time: Soon</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
