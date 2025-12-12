'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Star, ArrowRight, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: "easeOut" }
  })
};

const FeatureCard = ({ 
  title, 
  description, 
  href, 
  icon: Icon,
  index,
  gradient
}: { 
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  index: number;
  gradient: string;
}) => {
  return (
    <Link href={href}>
      <motion.div
        className={`${gradient} border border-opacity-30 rounded-xl p-8 group hover:border-opacity-50 transition-all cursor-pointer h-full flex flex-col justify-between`}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={index}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div>
          <Icon className="w-12 h-12 text-white opacity-80 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
          <p className="text-gray-300 text-base leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-white opacity-80 group-hover:opacity-100 text-sm mt-6 group-hover:gap-3 transition-all">
          Explore <ArrowRight className="w-4 h-4" />
        </div>
      </motion.div>
    </Link>
  );
};

export default function SocialPage() {
  const features = [
    {
      title: 'Study Circles',
      description: 'Join small, invite-only learning squads. Collaborate with peers, share resources, and achieve your goals together.',
      href: '/socials/study-circles',
      icon: Users,
      gradient: 'bg-gradient-to-br from-blue-900/80 to-cyan-900/80 border-blue-500/30'
    },
    {
      title: 'Messages',
      description: 'Connect directly with circle members and friends. Send messages, share content, and collaborate in real-time.',
      href: '/socials/inbox',
      icon: MessageCircle,
      gradient: 'bg-gradient-to-br from-green-900/80 to-teal-900/80 border-green-500/30'
    },
   
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      <motion.div 
        className="mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          Connect & Learn Together
        </h1>
        <p className="text-lg text-gray-400 max-w-3xl">
          Join a vibrant community of learners. Collaborate in study circles, follow inspiring creators, and share your learning journey.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} {...feature} index={index} />
        ))}
      </div>

      <motion.div 
        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <h3 className="text-xl font-bold text-white mb-2">More Features Coming Soon</h3>
        <p className="text-gray-400">
          We're building an amazing social learning experience. Stay tuned for leaderboards, challenges, and more!
        </p>
      </motion.div>
    </div>
  );
}