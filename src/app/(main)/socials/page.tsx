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
      className={`${gradient} border border-opacity-30 rounded-xl p-6 relative overflow-hidden h-full flex flex-col backdrop-blur-md hover:shadow-2xl hover:shadow-purple-500/10 transition-shadow`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
    >
      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-200">
        SOON
      </div>
      <div className="bg-white/10 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-slate-200 opacity-80" />
      </div>
      <h3 className="text-lg font-bold text-slate-200 mb-2">{title}</h3>
      <p className="text-slate-300 text-sm leading-relaxed opacity-90">{description}</p>
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
    <div className="min-h-screen bg-[#020105] relative overflow-hidden p-4 sm:p-6 md:p-8 selection:bg-purple-500/30">
      {/* Stunning Background Layers */}
      <div className="absolute inset-0 z-0">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-[#020105]" />
        
        {/* Aurora / Nebula Effects */}
        <div className="absolute inset-0 opacity-30">
          <motion.div 
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_#4f46e5_0%,_transparent_50%)] blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              rotate: [360, 0],
              scale: [1.2, 1, 1.2],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-20%] right-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_#7c3aed_0%,_transparent_50%)] blur-[120px]" 
          />
        </div>

        {/* Dynamic Starfield */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute bg-white rounded-full"
              style={{
                width: Math.random() * 2 + 1 + 'px',
                height: Math.random() * 2 + 1 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
              animate={{
                opacity: [0.1, 0.6, 0.1],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>

        {/* Shooting Stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`shooting-star-${i}`}
              className="absolute h-[1px] w-[100px] bg-gradient-to-r from-transparent via-blue-400 to-transparent"
              initial={{ x: "-100%", y: Math.random() * 100 + "%", rotate: -35 }}
              animate={{ x: "200%", y: (Math.random() * 100 + 50) + "%" }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: Math.random() * 10 + 5,
                ease: "easeIn"
              }}
            />
          ))}
        </div>

        {/* Cyber Grid with Scanner Line */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)]">
          <motion.div 
            animate={{ y: ["0%", "100%", "0%"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          />
        </div>
        
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          className="mb-10 pt-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-4 backdrop-blur-sm">
            <Sparkles className="w-3 h-3" />
            Social Hub
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-100 to-slate-400 mb-6 tracking-tight">
            Connect & Learn Together
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
            Join study circles, collaborate with peers, and achieve your learning goals as a community.
          </p>
        </motion.div>

        {/* Main Study Circles Card - Prominent */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12"
        >
            <Link href="/socials/study-circles">
              <div className="group relative overflow-hidden rounded-[2.5rem] p-[2px] transition-all hover:scale-[1.01] active:scale-100">
                {/* Gradient Border Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 opacity-30 group-hover:opacity-60 blur-xl transition-opacity" />
                
                <div className="relative bg-[#0a0a0f]/90 border border-white/10 rounded-[2.4rem] p-8 sm:p-12 backdrop-blur-xl h-full shadow-2xl">
                  {/* Internal Highlights */}
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
                  
                  {/* Badge */}
                  <div className="absolute top-8 right-8 flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-2xl text-xs font-bold text-blue-300 backdrop-blur-md">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    NEW EXPERIENCE
                  </div>

                  <div className="flex flex-col lg:flex-row items-center gap-12">
                    <div className="flex-grow space-y-8">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500/40 blur-2xl rounded-3xl" />
                          <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg border border-white/20">
                            <Users className="w-10 h-10 text-white" />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-4xl sm:text-5xl font-black text-slate-100 mb-1 tracking-tight">
                            Study Circles
                          </h2>
                          <p className="text-blue-400 text-lg font-medium">Power up your collective learning</p>
                        </div>
                      </div>
                      
                      <p className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-2xl opacity-80">
                        Join small, invite-only learning squads. Collaborate with peers, share resources, track progress together, and achieve your goals as a team.
                      </p>

                      {/* Interactive Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                          <div className="text-3xl font-black text-slate-100">12+</div>
                          <div className="text-[10px] text-blue-400 uppercase font-black tracking-widest mt-1">Active Circles</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                          <div className="text-3xl font-black text-slate-100">150+</div>
                          <div className="text-[10px] text-blue-400 uppercase font-black tracking-widest mt-1">Learners</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors col-span-2 sm:col-span-1">
                          <div className="text-3xl font-black text-slate-100">500+</div>
                          <div className="text-[10px] text-blue-400 uppercase font-black tracking-widest mt-1">Shared Insights</div>
                        </div>
                      </div>

                      {/* Premium Button */}
                      <div className="flex pt-4">
                        <div className="relative group/btn">
                          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover/btn:opacity-100 transition duration-1000 group-hover/btn:duration-200"></div>
                          <button className="relative px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-2xl font-black text-xl flex items-center gap-3 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] active:scale-95 border border-white/20">
                            Enter Study Hub
                            <ArrowRight className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Visual Element */}
                    <div className="hidden lg:block relative w-72 h-72">
                      <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                      <motion.div
                        animate={{ 
                          rotate: 360,
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="relative w-full h-full flex items-center justify-center border-2 border-dashed border-blue-500/20 rounded-full"
                      >
                        <div className="absolute inset-4 border-2 border-dashed border-cyan-500/30 rounded-full" />
                        <Sparkles className="w-24 h-24 text-blue-400/60" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
        </motion.div>

        {/* Coming Soon Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-slate-100 flex items-center gap-4">
              <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
              Future Explorations
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {comingSoonFeatures.map((feature, index) => (
              <ComingSoonCard key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>

        {/* Interactive Bottom Banner */}
        <motion.div 
          className="relative group overflow-hidden bg-[#0a0a0f]/60 border border-white/5 rounded-[2rem] p-10 text-center backdrop-blur-xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <h3 className="text-2xl font-black text-slate-100 mb-4 tracking-tight">Building the Future of Social Learning</h3>
          <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed opacity-80">
            We're constantly evolving. Join us in shaping the next generation of collaborative education. Your feedback fuels our innovation.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
