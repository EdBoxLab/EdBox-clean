'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles, Brain, Zap, Users, Target, BookOpen,
  GraduationCap, Globe, Award, MessageCircle,
  ArrowRight, Check, Star, AlertCircle, X,
  Flame, Trophy, FileText, BrainCircuit, Lightbulb, 
  Clock, Shield
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

  const founders = [
    {
      name: 'Inioluwa Ayodeji',
      role: 'Chief Executive Officer',
      description: 'Visionary leader driving EdBox\'s mission to democratize quality education through AI-powered personalization.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      name: 'Ajani AbdulMalik',
      role: 'Co-Founder',
      description: 'Technical innovator contributing to EdBox\'s robust architecture and cutting-edge feature development.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Oyeleru Praise',
      role: 'Co-Founder',
      description: 'Strategic partner shaping EdBox\'s educational philosophy and exceptional user experience.',
      gradient: 'from-pink-500 to-orange-500'
    }
  ];

  const coreFeatures = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered Learning',
      description: 'Personalized content generation adapts to your unique learning style and pace',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Study Kits',
      description: 'Auto-generate quizzes, notes, mind maps, and flashcards from any topic',
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
      description: 'Smart algorithms create personalized study paths based on your goals',
      color: 'from-red-500 to-orange-500'
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'Genie AI Tutor',
      description: '24/7 AI assistant that answers questions, explains concepts, and guides you',
      color: 'from-orange-500 to-yellow-500'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Progress & Gamification',
      description: 'XP points, streaks, levels, and certificates keep you motivated',
      color: 'from-yellow-500 to-green-500'
    }
  ];

  const comparisonFeatures = [
    { 
      feature: 'AI Course Generation', 
      edbox: true, 
      chatgpt: false, 
      coursera: false, 
      turbo: false,
      description: 'Generate complete courses on any topic instantly'
    },
    { 
      feature: 'Adaptive Learning Paths', 
      edbox: true, 
      chatgpt: false, 
      coursera: true, 
      turbo: false,
      description: 'Personalized paths that adapt to your progress'
    },
      { 
        feature: 'Interactive Subject Labs', 
        edbox: true, 
        chatgpt: false, 
        coursera: false, 
        turbo: false,
        description: 'Advanced specialized learning tools for hands-on subject mastery'
      },
    { 
      feature: 'Auto Study Materials', 
      edbox: true, 
      chatgpt: false, 
      coursera: false, 
      turbo: true,
      description: 'Auto-generate flashcards, quizzes, notes from any content'
    },
    { 
      feature: 'Study Circles', 
      edbox: true, 
      chatgpt: false, 
      coursera: true, 
      turbo: false,
      description: 'Collaborative learning groups with real-time chat'
    },
    { 
      feature: 'Progress Gamification', 
      edbox: true, 
      chatgpt: false, 
      coursera: true, 
      turbo: false,
      description: 'XP, levels, streaks, and achievements'
    },
    { 
      feature: 'Certificates', 
      edbox: true, 
      chatgpt: false, 
      coursera: true, 
      turbo: false,
      description: 'Earn verifiable completion certificates'
    },
    { 
      feature: 'Context-Aware AI Tutor', 
      edbox: true, 
      chatgpt: true, 
      coursera: false, 
      turbo: true,
      description: 'AI that understands your current lesson context'
    },
    { 
      feature: 'Personalized Feed', 
      edbox: true, 
      chatgpt: false, 
      coursera: false, 
      turbo: false,
      description: 'Curated learning content based on your interests'
    },
    { 
      feature: 'Free Core Features', 
      edbox: true, 
      chatgpt: false, 
      coursera: false, 
      turbo: false,
      description: 'Access powerful learning tools at no cost'
    },
  ];

  const whyBetter = [
    {
      icon: <BrainCircuit className="w-6 h-6" />,
      title: 'Not Just Chat, Complete Learning System',
      description: 'Unlike ChatGPT, EdBox isn\'t just a chatbot. It\'s a full learning management system with courses, progress tracking, certificates, and collaborative features.'
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: 'Structured Learning, Not Random Answers',
      description: 'We generate structured courses with modules, lessons, and assessments—not just one-off answers that you forget tomorrow.'
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Adaptive, Not One-Size-Fits-All',
      description: 'Unlike Coursera\'s pre-made courses, EdBox adapts to YOUR level, pace, and goals in real-time.'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Learn Anything, Anytime',
      description: 'No waiting for course releases. Generate a course on ANY topic instantly and start learning immediately.'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Free Forever Core Features',
      description: 'No paywall for essential features. Learn with AI, create courses, track progress—all free.'
    },
    {
      icon: <Flame className="w-6 h-6" />,
      title: 'Gamified & Engaging',
      description: 'Streaks, XP, levels, and achievements make learning addictive in a good way.'
    },
  ];

  const stats = [
    { value: '100K+', label: 'Active Learners', icon: <Users className="w-5 h-5" /> },
    { value: '500K+', label: 'Study Sets Created', icon: <BookOpen className="w-5 h-5" /> },
    { value: '2M+', label: 'AI Conversations', icon: <MessageCircle className="w-5 h-5" /> },
    { value: '95%', label: 'Success Rate', icon: <Award className="w-5 h-5" /> }
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
                <h3 className="font-bold text-white">Beta Access Open!</h3>
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
              <span className="text-sm text-indigo-300 font-medium">The Future of Learning is Here</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-white">AI That Actually </span>
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Teaches You
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
              EdBox isn't just another AI chatbot. It's a complete learning ecosystem that generates 
              personalized courses, tracks your progress, and adapts to how YOU learn best.
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
                {betaStatus?.isFull ? 'Join Waitlist' : 'Start Learning Free'}
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
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                </div>
                <div className="text-zinc-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What EdBox Offers Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                What EdBox Offers
              </span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              A complete learning ecosystem designed to help you master any subject
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feature, index) => (
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
                <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 hover:border-indigo-500/50 transition-all h-full">
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 text-white`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                EdBox vs The Competition
              </span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              See how EdBox stacks up against other learning tools
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left py-4 px-4 text-zinc-400 font-medium">Feature</th>
                  <th className="py-4 px-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-lg">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-white">EdBox</span>
                    </div>
                  </th>
                  <th className="py-4 px-4 text-center text-zinc-400 font-medium">ChatGPT</th>
                  <th className="py-4 px-4 text-center text-zinc-400 font-medium">Coursera</th>
                  <th className="py-4 px-4 text-center text-zinc-400 font-medium">Turbo AI</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, index) => (
                  <tr key={index} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition">
                    <td className="py-4 px-4">
                      <div className="font-medium text-white text-sm">{row.feature}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{row.description}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.edbox ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-500/20 rounded-full">
                          <Check className="w-5 h-5 text-green-400" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-500/20 rounded-full">
                          <X className="w-5 h-5 text-red-400" />
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.chatgpt ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-500/20 rounded-full">
                          <Check className="w-5 h-5 text-green-400" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-500/20 rounded-full">
                          <X className="w-5 h-5 text-red-400" />
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.coursera ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-500/20 rounded-full">
                          <Check className="w-5 h-5 text-green-400" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-500/20 rounded-full">
                          <X className="w-5 h-5 text-red-400" />
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.turbo ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-500/20 rounded-full">
                          <Check className="w-5 h-5 text-green-400" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-500/20 rounded-full">
                          <X className="w-5 h-5 text-red-400" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-zinc-300">EdBox: <span className="font-bold text-white">10/10</span> features vs competitors averaging <span className="text-zinc-500">2-3/10</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Why EdBox is Better Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-950/30 to-purple-950/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Why EdBox Beats the Rest
              </span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              We're not just another AI tool—we're your complete learning partner
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyBetter.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 hover:border-indigo-500/50 transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 text-white">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Meet Our Founders
              </span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              The visionaries building the future of education
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {founders.map((founder, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${founder.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity blur-xl`} />
                <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 hover:border-indigo-500/50 transition-all text-center h-full">
                  <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${founder.gradient} rounded-full flex items-center justify-center mb-4 text-white text-2xl font-bold`}>
                    {founder.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{founder.name}</h3>
                  <p className={`text-sm font-medium bg-gradient-to-r ${founder.gradient} bg-clip-text text-transparent mb-3`}>
                    {founder.role}
                  </p>
                  <p className="text-zinc-400 text-sm">{founder.description}</p>
                </div>
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
            className="relative bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-8 sm:p-12 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-2xl shadow-indigo-500/50">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Learn Smarter?
              </h2>
              <p className="text-lg text-zinc-300 mb-8 max-w-2xl mx-auto">
                Join thousands of learners already using EdBox to master new skills faster than ever.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-lg font-semibold transition shadow-2xl shadow-indigo-500/50"
                >
                  {betaStatus?.isFull ? 'Join Waitlist Now' : 'Start Learning Free'}
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
                <span>No credit card required • Free forever core features</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 bg-zinc-900/30 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-zinc-500 text-sm">
          <p>© 2025 EdBox. Empowering learners worldwide with AI.</p>
          <p className="mt-2">Founded by Inioluwa Ayodeji, Ajani AbdulMalik & Oyeleru Praise</p>
        </div>
      </footer>
    </div>
  );
}
