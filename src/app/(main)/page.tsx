'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import OnboardingForm from '@/components/OnboardingForm';
import { motion, useAnimation, Variants } from 'framer-motion';
import { ArrowRight, Book, Briefcase, CheckCircle, ChevronLeft, ChevronRight, PlayCircle, Plus, Star, Zap } from 'lucide-react';

const Dashboard: React.FC = () => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<any>(null);

  // Dummy data for demonstration
  const courses = [
    { id: 1, title: 'Intro to Web Dev', progress: 50, icon: <Book className="w-8 h-8 text-indigo-300" /> },
    { id: 2, title: 'Advanced React', progress: 20, icon: <Zap className="w-8 h-8 text-green-300" /> },
    { id: 3, title: 'Supabase Mastery', progress: 75, icon: <Briefcase className="w-8 h-8 text-red-300" /> },
  ];

  const exploreItems = {
    notes: [
      { id: 'n1', title: 'React Hooks Cheatsheet', type: 'Note' },
      { id: 'n2', title: 'CSS Flexbox Guide', type: 'Note' },
      { id: 'n3', title: 'Next.js Routing Explained', type: 'Note' },
      { id: 'n4', title: 'JavaScript ES6 Features', type: 'Note' },
    ],
    quizzes: [
      { id: 'q1', title: 'JavaScript Fundamentals Quiz', type: 'Quiz' },
      { id: 'q2', title: 'React Component Lifecycle', type: 'Quiz' },
      { id: 'q3', title: 'Advanced SQL Queries', type: 'Quiz' },
      { id: 'q4', title: 'Web Accessibility Basics', type: 'Quiz' },
    ],
    tools: [
      { id: 't1', title: 'Code Playground', type: 'Tool' },
      { id: 't2', title: 'JSON Formatter', type: 'Tool' },
      { id: 't3', title: 'Color Palette Generator', type: 'Tool' },
      { id: 't4', title: 'Regex Tester', type: 'Tool' },
    ]
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      if (user) {
        // Fetch profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        } else if (!data) {
          // Create a profile if it doesn't exist
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: user.id, email: user.email }])
            .single();
          if (insertError) {
            console.error('Error creating profile:', insertError);
          } else {
            setProfile(newProfile);
          }
        } else {
          setProfile(data);
        }

        // Fetch last activity (dummy implementation)
        setLastActivity({ type: 'course', title: 'Intro to Web Dev', href: '/courses/intro-to-web-dev' });
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [supabase]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">Loading...</div>;
  }

  if (!profile || !profile.onboarding_completed) {
    return <OnboardingForm />;
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  const ExploreRow = ({ title, items }: { title: string, items: { id: string, title: string, type: string }[] }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
      if (scrollRef.current) {
        const { scrollLeft, clientWidth } = scrollRef.current;
        const scrollAmount = clientWidth * 0.8;
        scrollRef.current.scrollTo({
          left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
          behavior: 'smooth',
        });
      }
    };

    return (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <div className="flex gap-2">
            <button onClick={() => scroll('left')} className="p-1.5 border border-zinc-700 rounded-md hover:border-zinc-500 transition text-zinc-400 hover:text-zinc-200" aria-label="Scroll left"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => scroll('right')} className="p-1.5 border border-zinc-700 rounded-md hover:border-zinc-500 transition text-zinc-400 hover:text-zinc-200" aria-label="Scroll right"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scroll-smooth" style={{ scrollbarWidth: 'none', 'msOverflowStyle': 'none' }}>
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              className="flex-shrink-0 w-64 h-40 border border-zinc-800 hover:border-zinc-700 rounded-lg p-4 flex flex-col justify-between transition-colors"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={i}
            >
              <div>
                <p className="text-sm text-gray-400">{item.type}</p>
                <h3 className="font-bold text-lg text-white mt-1">{item.title}</h3>
              </div>
              <Link href="#" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300">
                Open <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };


  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-white mb-2">Welcome, {profile?.username || user?.email}!</h1>
        <p className="text-lg text-gray-400">Let's continue your learning journey.</p>
      </div>

      {/* Course Overview */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Your Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              className="bg-gray-800 rounded-lg p-6 flex items-center gap-6"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={i}
            >
              {course.icon}
              <div className="flex-grow">
                <h3 className="font-bold text-xl text-white">{course.title}</h3>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                  <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                </div>
                <p className="text-sm text-gray-400 mt-1">{course.progress}% complete</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Continue Where You Left Off */}
      {lastActivity && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Continue Where You Left Off</h2>
          <Link href={lastActivity.href} className="block">
            <motion.div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 flex justify-between items-center"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div>
                <p className="text-sm uppercase tracking-wider text-indigo-200">{lastActivity.type}</p>
                <h3 className="text-3xl font-bold text-white mt-1">{lastActivity.title}</h3>
              </div>
              <PlayCircle className="w-16 h-16 text-white opacity-80" />
            </motion.div>
          </Link>
        </div>
      )}

      {/* Explore Section */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Explore</h2>
        <ExploreRow title="Your Notes" items={exploreItems.notes} />
        <ExploreRow title="Quizzes" items={exploreItems.quizzes} />
        <ExploreRow title="Tools" items={exploreItems.tools} />
      </div>
    </div>
  );
};

export default Dashboard;
