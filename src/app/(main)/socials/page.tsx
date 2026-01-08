'use client';

import React from 'react';
import Link from 'next/link';
import { Users, ArrowRight, Trophy, Target, Sparkles, TrendingUp, Zap } from 'lucide-react';
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
      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 relative overflow-hidden h-full flex flex-col hover:border-purple-500/30 transition-all group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
    >
      <div className="absolute top-4 right-4 bg-zinc-800/50 px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 backdrop-blur-sm">
        COMING SOON
      </div>
      <div className="bg-zinc-800/50 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/10 transition-all">
        <Icon className="w-6 h-6 text-gray-400 group-hover:text-purple-400 transition-colors" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
};

export default function SocialPage() {
  const comingSoonFeatures = [
    {
      title: 'Leaderboards',
      description: 'Compete with learners worldwide. Track your progress and celebrate achievements together.',
      icon: Trophy
    },
    {
      title: 'Study Challenges',
      description: 'Join daily challenges. Push your limits and stay motivated with community goals.',
      icon: Target
    },
    {
      title: 'Community Feed',
      description: 'Share wins, discover insights, and get inspired by fellow learners every day.',
      icon: TrendingUp
    }
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden p-4 sm:p-6 md:p-8 selection:bg-purple-500/30">
      {/* Background Gradients - EdBox Style */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div 
          className="mb-12 pt-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-gray-300 text-xs font-semibold mb-6 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-purple-400" />
            Social Learning
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            Learn together. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Grow faster.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
            Join study circles where learning happens through collaboration, not competition. Share knowledge, stay accountable, and achieve more together.
          </p>
        </motion.div>

        {/* Main Study Circles Card - EdBox Brand */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <Link href="/socials/study-circles">
            <div className="group relative overflow-hidden rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/50 transition-all p-4 sm:p-8 md:p-12 backdrop-blur-sm">
              {/* Live Badge */}
              <div className="absolute top-6 right-6 flex items-center gap-2 bg-zinc-800/80 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-bold text-purple-400 border border-purple-500/20">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                LIVE NOW
              </div>

              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
                <div className="flex-grow space-y-8 w-full">
                  {/* Icon + Title */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border border-purple-500/30 group-hover:scale-110 transition-transform">
                      <Users className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-3xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
                        Study Circles
                      </h2>
                      <p className="text-purple-400 text-sm sm:text-lg font-medium">Learning together, not alone</p>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-400 text-base sm:text-xl leading-relaxed max-w-2xl">
                    Join focused study groups. Share resources, discuss concepts, keep each other accountable. Learning is better when you're not doing it solo.
                  </p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-6">
                    <div className="bg-zinc-900/80 backdrop-blur-sm p-4 rounded-xl border border-zinc-800">
                      <div className="text-xl sm:text-3xl font-bold text-white">12+</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Active Circles</div>
                    </div>
                    <div className="bg-zinc-900/80 backdrop-blur-sm p-4 rounded-xl border border-zinc-800">
                      <div className="text-xl sm:text-3xl font-bold text-white">150+</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Members</div>
                    </div>
                    <div className="bg-zinc-900/80 backdrop-blur-sm p-4 rounded-xl border border-zinc-800">
                      <div className="text-xl sm:text-3xl font-bold text-white">500+</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Resources Shared</div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="flex pt-4">
                    <button className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-purple-500/30">
                      Join Study Circles
                      <ArrowRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Visual Element */}
                <div className="hidden lg:block relative w-80 h-80">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 blur-3xl rounded-full" />
                  <div className="relative w-full h-full flex items-center justify-center border border-zinc-800 rounded-full backdrop-blur-sm">
                    <div className="absolute inset-8 border border-dashed border-purple-500/20 rounded-full" />
                    <Zap className="w-24 h-24 text-purple-400/40" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Future Roadmap */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-3xl font-bold text-white">Coming Soon</h2>
            <div className="flex-grow h-[1px] bg-gradient-to-r from-zinc-800 to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {comingSoonFeatures.map((feature, index) => (
              <ComingSoonCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>

        {/* Footer Banner */}
        <motion.div 
          className="bg-gradient-to-r from-zinc-900/80 to-zinc-900/50 border border-zinc-800 rounded-3xl p-10 text-center backdrop-blur-sm relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5" />
          <div className="relative">
            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Building Social Learning</h3>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
              We're creating a space where learning happens together. Your feedback shapes how we grow this community.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}