'use client';

import React from 'react';
import Link from 'next/link';
import { Users, ArrowRight, Trophy, Target, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const ComingSoonCard = ({ 
  title, 
  description, 
  icon: Icon,
  index,
  gradient
}: { 
  title: string;
  description: string;
  icon: React.ElementType;
  index: number;
  gradient: string;
}) => {
  return (
    <motion.div
      className={`${gradient} border border-opacity-30 rounded-xl p-6 relative overflow-hidden h-full flex flex-col`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
    >
      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white">
        SOON
      </div>
      <div className="bg-white/10 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-white opacity-80" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-200 text-sm leading-relaxed opacity-90">{description}</p>
    </motion.div>
  );
};

export default function SocialPage() {
  const comingSoonFeatures = [
    {
      title: 'Leaderboards',
      description: 'Compete with friends and climb the ranks. Track your progress and celebrate achievements.',
      icon: Trophy,
      gradient: 'bg-gradient-to-br from-yellow-900/60 to-orange-900/60 border-yellow-500/20'
    },
    {
      title: 'Study Challenges',
      description: 'Join daily and weekly challenges. Push your limits and stay motivated with goals.',
      icon: Target,
      gradient: 'bg-gradient-to-br from-purple-900/60 to-pink-900/60 border-purple-500/20'
    },
    {
      title: 'Community Feed',
      description: 'Share your wins, discover insights, and get inspired by fellow learners every day.',
      icon: TrendingUp,
      gradient: 'bg-gradient-to-br from-green-900/60 to-emerald-900/60 border-green-500/20'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          Connect & Learn Together
        </h1>
        <p className="text-lg text-gray-400 max-w-3xl">
          Join study circles, collaborate with peers, and achieve your learning goals as a community.
        </p>
      </motion.div>

      {/* Main Study Circles Card - Prominent */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-10"
      >
        <Link href="/socials/study-circles">
          <div className="bg-gradient-to-br from-blue-900/90 to-cyan-900/90 border-2 border-blue-500/40 rounded-2xl p-8 sm:p-10 group hover:border-blue-400/60 transition-all cursor-pointer relative overflow-hidden">
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-500/10 to-blue-500/0 group-hover:via-cyan-500/20 transition-all duration-700"></div>
            
            {/* Badge */}
            <div className="absolute top-6 right-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-400/30 px-4 py-1.5 rounded-full text-xs font-bold text-blue-100 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              FEATURED
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex-grow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-white/15 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-white/25 transition-colors">
                    <Users className="w-9 h-9 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-1">
                      Study Circles
                    </h2>
                    <p className="text-blue-200 text-sm font-medium">Your collaborative learning space</p>
                  </div>
                </div>
                
                <p className="text-gray-100 text-base sm:text-lg leading-relaxed mb-6 max-w-2xl">
                  Join small, invite-only learning squads. Collaborate with peers, share resources, track progress together, and achieve your goals as a team.
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 mb-6">
                  <div>
                    <div className="text-2xl font-bold text-white">12+</div>
                    <div className="text-xs text-blue-200 uppercase tracking-wide">Active Circles</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">150+</div>
                    <div className="text-xs text-blue-200 uppercase tracking-wide">Members</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">500+</div>
                    <div className="text-xs text-blue-200 uppercase tracking-wide">Study Sessions</div>
                  </div>
                </div>

                {/* CTA Button */}
                <motion.button
                  className="bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl group-hover:scale-105"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Open Study Circles
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Decorative icon */}
              <div className="hidden lg:block">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, 0, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-24 h-24 text-cyan-300/40" />
                </motion.div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Coming Soon Features */}
      <div className="mb-8">
        <motion.h2 
          className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Sparkles className="w-7 h-7 text-indigo-400" />
          Coming Soon
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {comingSoonFeatures.map((feature, index) => (
            <ComingSoonCard key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <motion.div 
        className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <h3 className="text-xl font-bold text-white mb-2">Building the Future of Social Learning</h3>
        <p className="text-gray-300 text-sm">
          We're constantly improving your experience. Have feedback or feature requests? Let us know! Contact us through support. Thanks!
        </p>
      </motion.div>
    </div>
  );
}