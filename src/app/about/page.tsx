'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles, Brain, Zap, Users, Target, BookOpen,
  GraduationCap, Globe, Award, MessageCircle,
  ArrowRight, Check, Star, AlertCircle
} from 'lucide-react';

export default function AboutPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [betaStatus, setBetaStatus] = useState<{
    currentCount: number;
    isFull: boolean;
    remainingSpots: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/beta-status')
      .then(res => res.json())
      .then(data => setBetaStatus(data))
      .catch(console.error);
  }, []);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered Learning',
      description: 'Personalized content generation adapts to your unique learning style and pace',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Study Kits',
      description: 'Make life easier with quizzes, notes, mind maps, and flashcards',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Study Circles',
      description: 'Collaborate with peers, share resources, and learn together in communities',
      color: 'from-pink-500 to-red-500'
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Adaptive Learning Paths',
      description: 'Smart algorithms create personalized study paths based on your goals and progress',
      color: 'from-red-500 to-orange-500'
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'AI Study Assistant',
      description: 'Chat with Genie, your 24/7 AI tutor that answers questions and explains concepts',
      color: 'from-orange-500 to-yellow-500'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Track Your Progress',
      description: 'Comprehensive analytics and achievements keep you motivated and on track',
      color: 'from-yellow-500 to-green-500'
    }
  ];

  const stats = [
    { value: '100K+', label: 'Active Learners', icon: <Users className="w-5 h-5" /> },
    { value: '500K+', label: 'Study Sets Created', icon: <BookOpen className="w-5 h-5" /> },
    { value: '2M+', label: 'AI Conversations', icon: <MessageCircle className="w-5 h-5" /> },
    { value: '95%', label: 'Success Rate', icon: <Award className="w-5 h-5" /> }
  ];

  const benefits = [
    'Learn at your own pace with AI-generated content',
    'Save hours on study material preparation',
    'Join a community of passionate learners',
    'Track progress with detailed analytics',
    'Access powerful learning tools for free',
    'Available 24/7 across all devices'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-indigo-950 to-zinc-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                EdBox
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg text-sm font-semibold transition shadow-lg shadow-indigo-500/30"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Beta Access Alert */}
      {betaStatus && !betaStatus.isFull && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">🎉 Beta Access Open!</h3>
                <p className="text-sm text-zinc-300">
                  Only <span className="font-bold text-amber-400">{betaStatus.remainingSpots}</span> spots remaining out of 100
                </p>
              </div>
              <Link
                href="/signup"
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-lg text-sm font-bold transition shadow-lg whitespace-nowrap"
              >
                Claim Spot
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full mb-6">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-indigo-300 font-medium">Beta Access Now Open - Limited to First 100</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Learn Smarter,
              </span>
              <br />
              <span className="text-white">Not Harder</span>
            </h1>

            <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
              Ditch passive watching for active learning. EdBox helps you land that dream job
              and ace your grades with less effort—getting you smarter with every scroll.
            </p>

            {betaStatus && (
              <div className="mb-6">
                {!betaStatus.isFull ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-green-300 font-medium">
                      {betaStatus.remainingSpots} / 100 Beta Spots Available
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-300 font-medium">
                      Beta Full - Join Waitlist for Full Launch
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-lg font-semibold transition shadow-2xl shadow-indigo-500/50"
              >
                {betaStatus?.isFull ? 'Join Waitlist' : 'Get Beta Access'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
              <Link
                href="/demo-course"
                className="px-8 py-4 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-lg font-semibold transition"
              >
                Try Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="text-indigo-400">{stat.icon}</div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                </div>
                <div className="text-zinc-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Everything you need to supercharge your learning journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className="relative group"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity blur-xl`} />
                <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 hover:border-indigo-500/50 transition-all">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 text-white`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-950/30 to-purple-950/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Why Choose EdBox?
              </span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-4 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl hover:border-indigo-500/50 transition"
              >
                <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-zinc-300">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="relative bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-12 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

            <div className="relative">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-2xl shadow-indigo-500/50">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-4xl font-bold mb-4">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
                {betaStatus?.isFull
                  ? "Join our waitlist to get early access when we launch fully!"
                  : "Join the first 100 students to get exclusive beta access"}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-lg font-semibold transition shadow-2xl shadow-indigo-500/50"
                >
                  {betaStatus?.isFull ? 'Join Waitlist Now' : 'Start Learning Now'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-lg font-semibold transition"
                >
                  Sign In
                </Link>
              </div>

              <div className="flex items-center justify-center gap-2 mt-8 text-sm text-zinc-400">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>No credit card required · {betaStatus?.isFull ? 'Get notified at launch' : 'Limited beta spots available'}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 bg-zinc-900/30 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-zinc-500 text-sm">
          <p>© 2025 EdBox. Empowering learners worldwide with AI.</p>
        </div>
      </footer>
    </div>
  );
}
