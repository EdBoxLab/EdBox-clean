'use client';

import React from 'react';
import Link from 'next/link';
import { Users, ArrowRight, Trophy, Target, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const ComingSoonCard = ({ 
  title, 
  description, 
  icon: Icon,
  index
}: { 
  title: string;
  description: string;
  icon: React.ElementType;
  index: number;
}) => {
  return (
    <motion.div
      className="bg-[#2b2d31] border border-[#1e1f22] rounded-xl p-6 relative overflow-hidden h-full flex flex-col hover:bg-[#35373c] transition-all group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
    >
      <div className="absolute top-4 right-4 bg-[#1e1f22] px-3 py-1 rounded-full text-[10px] font-bold text-gray-400">
        UPCOMING
      </div>
      <div className="bg-[#1e1f22] w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
};

export default function SocialPage() {
  const comingSoonFeatures = [
    {
      title: 'Leaderboards',
      description: 'Compete with friends and climb the ranks. Track your progress and celebrate achievements.',
      icon: Trophy
    },
    {
      title: 'Study Challenges',
      description: 'Join daily and weekly challenges. Push your limits and stay motivated with goals.',
      icon: Target
    },
    {
      title: 'Community Feed',
      description: 'Share your wins, discover insights, and get inspired by fellow learners every day.',
      icon: TrendingUp
    }
  ];

  return (
    <div className="min-h-screen bg-[#313338] relative overflow-hidden p-4 sm:p-6 md:p-8 selection:bg-[#5865f2]/30">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-gradient-to-b from-[#5865f2]/5 to-transparent blur-[120px]" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          className="mb-12 pt-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1f22] border border-[#2b2d31] text-gray-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3 h-3 text-[#5865f2]" />
            Social Hub
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-gray-100 mb-6 tracking-tight">
            Connect & Learn <br className="hidden sm:block" />
            <span className="text-[#5865f2]">Together</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
            Experience collaborative education in a professional environment. Join study circles and grow with your community.
          </p>
        </motion.div>

        {/* Main Study Circles Card - Sleek Discord Style */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <Link href="/socials/study-circles">
            <div className="group relative overflow-hidden rounded-3xl bg-[#2b2d31] border border-[#1e1f22] hover:border-[#5865f2]/30 transition-all p-4 sm:p-8 md:p-12 shadow-xl">
              <div className="absolute top-8 right-8 flex items-center gap-2 bg-[#1e1f22] px-4 py-2 rounded-xl text-xs font-bold text-[#5865f2]">
                <div className="w-2 h-2 rounded-full bg-[#5865f2] animate-pulse" />
                LIVE
              </div>

              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                <div className="flex-grow space-y-8 w-full">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="bg-[#1e1f22] w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border border-[#313338] group-hover:bg-[#5865f2] transition-colors duration-300">
                      <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h2 className="text-3xl sm:text-5xl font-bold text-gray-100 mb-2 tracking-tight">
                        Study Circles
                      </h2>
                      <p className="text-[#5865f2] text-sm sm:text-lg font-medium">Professional collaborative learning</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-base sm:text-xl leading-relaxed max-w-2xl">
                    Join curated study groups designed for high-impact collaboration. Share resources, engage in deep discussions, and achieve goals as a unified team.
                  </p>

                  <div className="grid grid-cols-3 gap-3 sm:gap-6">
                    <div className="bg-[#1e1f22] p-4 rounded-2xl border border-[#313338]">
                      <div className="text-xl sm:text-3xl font-bold text-gray-100">12+</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Circles</div>
                    </div>
                    <div className="bg-[#1e1f22] p-4 rounded-2xl border border-[#313338]">
                      <div className="text-xl sm:text-3xl font-bold text-gray-100">150+</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Learners</div>
                    </div>
                    <div className="bg-[#1e1f22] p-4 rounded-2xl border border-[#313338]">
                      <div className="text-xl sm:text-3xl font-bold text-gray-100">500+</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Insights</div>
                    </div>
                  </div>

                  <div className="flex pt-4">
                    <button className="w-full sm:w-auto px-10 py-4 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-[#5865f2]/20">
                      Launch Hub
                      <ArrowRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="hidden lg:block relative w-80 h-80">
                  <div className="absolute inset-0 bg-[#5865f2]/10 blur-3xl rounded-full" />
                  <div className="relative w-full h-full flex items-center justify-center border-2 border-[#1e1f22] rounded-full">
                    <div className="absolute inset-8 border border-dashed border-[#5865f2]/20 rounded-full" />
                    <Sparkles className="w-24 h-24 text-[#5865f2]/40" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Future Roadmap */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-2xl font-bold text-gray-100">Future Roadmap</h2>
            <div className="flex-grow h-[1px] bg-[#2b2d31]" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {comingSoonFeatures.map((feature, index) => (
              <ComingSoonCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>

        {/* Footer Banner */}
        <motion.div 
          className="bg-[#1e1f22] border border-[#2b2d31] rounded-3xl p-10 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <h3 className="text-2xl font-bold text-gray-100 mb-4 tracking-tight">Evolving Social Learning</h3>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
            We're building a refined space for meaningful educational exchange. Your contribution helps shape the future of this platform.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
