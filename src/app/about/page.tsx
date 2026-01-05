'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Zap, Users, Target, MessageCircle, Clock,
  ArrowRight, Check, Star, Trophy, Flame, Video, X,
  PlayCircle, PauseCircle, Repeat, BookOpen, Brain,
  Gamepad2, Award, GraduationCap, Globe, TrendingUp
} from 'lucide-react';

export default function AboutPageRedesigned() {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  // Hero stats with animation
  const stats = [
    { value: '100K+', label: 'Active Learners', icon: <Users className="w-5 h-5" /> },
    { value: '500K+', label: 'Practice Sets Created', icon: <Target className="w-5 h-5" /> },
    { value: '2M+', label: 'Questions Answered', icon: <Brain className="w-5 h-5" /> },
    { value: '10hrs', label: 'Saved Per Week', icon: <Clock className="w-5 h-5" /> }
  ];

  // The Big Problem Section
  const oldWay = [
    { icon: <Video className="w-5 h-5" />, text: 'Watch 3-hour video lectures', bad: true },
    { icon: <PauseCircle className="w-5 h-5" />, text: 'Forget 90% by next day', bad: true },
    { icon: <Repeat className="w-5 h-5" />, text: 'Rewatch when exam comes', bad: true },
    { icon: <Clock className="w-5 h-5" />, text: 'Waste hours making study materials', bad: true }
  ];

  const newWay = [
    { icon: <Zap className="w-5 h-5" />, text: 'Learn by doing, not watching', good: true },
    { icon: <Brain className="w-5 h-5" />, text: 'AI adapts to how YOU learn', good: true },
    { icon: <Target className="w-5 h-5" />, text: 'Instant practice materials', good: true },
    { icon: <Trophy className="w-5 h-5" />, text: 'Study with friends, stay accountable', good: true }
  ];

  // Core Features - The Real Value Props
  const coreFeatures = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI Courses: Learn by Doing',
      tagline: 'Not another video library',
      description: 'Generate interactive courses on ANY topic. Practice problems, real challenges, instant feedback. Master skills by building, not watching.',
      examples: ['Build a website while learning HTML', 'Solve real calculus problems', 'Write actual Python code'],
      color: 'from-indigo-500 to-purple-500',
      stat: '10x faster retention'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Study Kits: Time Back in Your Day',
      tagline: 'Auto-generate what takes hours',
      description: 'Upload notes, paste a topic—get flashcards, quizzes, mind maps, and summaries in seconds. Stop wasting time formatting.',
      examples: ['Flashcards from lecture notes', 'Quiz from textbook chapter', 'Mind map from article'],
      color: 'from-purple-500 to-pink-500',
      stat: '10 hours saved/week'
    },
    {
      icon: <Flame className="w-8 h-8" />,
      title: 'Smart Feed: TikTok for Learning',
      tagline: 'Scroll smarter, not dumber',
      description: 'Swipe through bite-sized questions personalized to your subjects. Every scroll makes you sharper. Build daily streaks that stick.',
      examples: ['5-min daily learning habit', 'Streak accountability', 'Adaptive difficulty'],
      color: 'from-pink-500 to-red-500',
      stat: '92% daily retention'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Study Circles: Accountability Squads',
      tagline: 'Study alone, fail together',
      description: 'Invite-only groups where you learn together. Share materials, compete on challenges, and keep each other accountable.',
      examples: ['Group study challenges', 'Shared resources', 'Peer motivation'],
      color: 'from-red-500 to-orange-500',
      stat: '3x completion rate'
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'Genie AI: Your 24/7 Tutor',
      tagline: 'Never stuck again',
      description: 'Context-aware AI that knows what you\'re studying. Ask questions, get explanations, review concepts—anytime, anywhere.',
      examples: ['Explain this concept simply', 'Why is my answer wrong?', 'Show me another example'],
      color: 'from-orange-500 to-yellow-500',
      stat: 'Instant help 24/7'
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: 'Gamification: Make It Fun',
      tagline: 'Learning shouldn\'t feel like work',
      description: 'XP points, daily streaks, levels, achievements, and certificates. Track progress and celebrate wins.',
      examples: ['Daily streak rewards', 'Level up achievements', 'Completion certificates'],
      color: 'from-yellow-500 to-green-500',
      stat: '4x engagement'
    }
  ];

  // Comparison - Show the difference
  const comparison = [
    { feature: 'Learn by Doing (Not Videos)', edbox: true, others: false },
    { feature: 'AI Course Generation', edbox: true, others: false },
    { feature: 'Auto Study Materials', edbox: true, others: false },
    { feature: 'Smart Learning Feed', edbox: true, others: false },
    { feature: 'Study Accountability Groups', edbox: true, others: false },
    { feature: 'Gamification & Streaks', edbox: true, others: 'Limited' },
    { feature: 'Context-Aware AI Tutor', edbox: true, others: 'Basic' },
    { feature: 'Free Core Features', edbox: true, others: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-indigo-950 to-zinc-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                EdBox
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition">
                Log In
              </button>
              <button className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg text-sm font-semibold transition shadow-lg shadow-indigo-500/30">
                Start Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - The Big Promise */}
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
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-indigo-300 font-medium">The Learning OS for Gen Z</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">Stop Watching.</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Start Doing.
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-zinc-400 max-w-3xl mx-auto mb-8">
              EdBox turns any topic into <span className="text-white font-semibold">interactive practice</span>, 
              generates <span className="text-white font-semibold">study materials instantly</span>, and keeps you 
              <span className="text-white font-semibold"> accountable with friends</span>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-lg font-semibold transition shadow-2xl shadow-indigo-500/50">
                Start Learning Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </button>
              <button className="px-8 py-4 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-lg font-semibold transition">
                See How It Works
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>Free forever • No credit card • Save 10+ hours/week</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
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

      {/* The Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="text-white">Online Learning is </span>
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Broken
              </span>
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              You've tried it. Hours of videos you forget, notes you never review, and zero accountability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Old Way */}
            <div className="bg-zinc-900/50 border-2 border-red-500/20 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <X className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">The Old Way</h3>
                  <p className="text-red-400 text-sm">Passive, boring, ineffective</p>
                </div>
              </div>
              <div className="space-y-4">
                {oldWay.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0 text-red-400">
                      {item.icon}
                    </div>
                    <p className="text-zinc-400 pt-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* New Way */}
            <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-2 border-indigo-500/30 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">The EdBox Way</h3>
                  <p className="text-indigo-400 text-sm">Active, fun, proven</p>
                </div>
              </div>
              <div className="space-y-4">
                {newWay.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0 text-indigo-400">
                      {item.icon}
                    </div>
                    <p className="text-white font-medium pt-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features - Detailed */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-950/30 to-purple-950/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Everything You Need to Learn Better
              </span>
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Six powerful tools that work together to make learning actually stick
            </p>
          </div>

          <div className="space-y-12">
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className="relative group"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity blur-2xl`} />
                <div className="relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-8 hover:border-indigo-500/50 transition-all">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4 text-white`}>
                        {feature.icon}
                      </div>
                      <div className="mb-2">
                        <h3 className="text-2xl font-bold text-white mb-1">{feature.title}</h3>
                        <p className={`text-sm font-medium bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                          {feature.tagline}
                        </p>
                      </div>
                      <p className="text-zinc-400 text-lg mb-6">{feature.description}</p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full">
                        <TrendingUp className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-indigo-300 font-semibold">{feature.stat}</span>
                      </div>
                    </div>
                    <div>
                      <div className="bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700/50">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Use Cases</p>
                        <div className="space-y-3">
                          {feature.examples.map((example, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <div className={`w-6 h-6 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <Check className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-zinc-300 text-sm">{example}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                EdBox vs Everything Else
              </span>
            </h2>
            <p className="text-xl text-zinc-400">
              We're not just better—we're different
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-6 px-6 text-zinc-400 font-medium">Feature</th>
                  <th className="py-6 px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-lg">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold text-white">EdBox</span>
                    </div>
                  </th>
                  <th className="py-6 px-6 text-center text-zinc-400 font-medium">Others</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, idx) => (
                  <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition">
                    <td className="py-5 px-6 text-white font-medium">{row.feature}</td>
                    <td className="py-5 px-6 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 bg-green-500/20 rounded-full">
                        <Check className="w-5 h-5 text-green-400" />
                      </div>
                    </td>
                    <td className="py-5 px-6 text-center">
                      {row.others === false ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-500/20 rounded-full">
                          <X className="w-5 h-5 text-red-400" />
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-sm">{row.others}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-2xl shadow-indigo-500/50">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Stop Wasting Time. Start Learning.</h2>
              <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
                Join 100,000+ students already learning smarter with EdBox
              </p>
              <button className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-lg font-semibold transition shadow-2xl shadow-indigo-500/50 mx-auto">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </button>
              <div className="flex items-center justify-center gap-2 mt-6 text-sm text-zinc-400">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span>No credit card • Save 10+ hours per week</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 bg-zinc-900/30 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-zinc-500 text-sm">
          <p>© 2025 EdBox. Making learning fun again.</p>
        </div>
      </footer>
    </div>
  );
}
        