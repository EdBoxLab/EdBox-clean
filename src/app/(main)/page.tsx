'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import OnboardingForm from '@/components/OnboardingForm';
import { motion, useAnimation, Variants } from 'framer-motion';
import { ArrowRight, Book, Briefcase, CheckCircle, ChevronLeft, ChevronRight, PlayCircle, Plus, Star, Zap, FileText, Layout, PenTool } from 'lucide-react';

const Dashboard: React.FC = () => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [recentCourse, setRecentCourse] = useState<any>(null);

  // Static tools for the explore section
  const tools = [
    { id: 't1', title: 'Research Assistant', type: 'Tool', href: '/research-assistant', icon: <Layout className="w-8 h-8 text-blue-300" /> },
    { id: 't2', title: 'Note Taker', type: 'Tool', href: '/tools/notes', icon: <FileText className="w-8 h-8 text-green-300" /> },
    { id: 't3', title: 'Study Kit', type: 'Tool', href: '/tools/study-kit', icon: <Zap className="w-8 h-8 text-yellow-300" /> },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        } else if (!profileError || profileError.code === 'PGRST116') {
          // Create a profile if it doesn't exist (handling race conditions or first login)
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert([{ id: user.id, email: user.email }])
            .select()
            .single();
          if (newProfile) setProfile(newProfile);
        }

        // Fetch Courses (Skill Graphs)
        const coursesRes = await fetch('/api/skill-graph/list');
        const coursesJson = await coursesRes.json();

        if (coursesJson.success && coursesJson.courses) {
          const mappedCourses = coursesJson.courses.map((c: any) => ({
            id: c.id,
            title: c.topic || 'Untitled Course', // Assuming 'topic' is the name field, fallback if not
            progress: Math.round((coursesJson.progress?.[c.id] || 0) * 100),
            icon: <Book className="w-8 h-8 text-indigo-300" />,
            href: `/learning-path/${c.id}` // Assuming this is the link
          }));
          setCourses(mappedCourses);

          // Set the most recent course as "Continue Where You Left Off"
          if (mappedCourses.length > 0) {
            // Sorting by simple assumption or just taking the first one if the API ordered them by date (which it does: order('created_at', { ascending: false }))
            // Ideally we'd have a 'last_accessed_at' field, but newest created is a decent proxy for now or the one with highest progress not 100%
            setRecentCourse({
              type: 'course',
              title: mappedCourses[0].title,
              href: mappedCourses[0].href,
              progress: mappedCourses[0].progress
            });
          }
        }

        // Fetch Notes
        const notesRes = await fetch('/api/notes');
        const notesJson = await notesRes.json();
        if (notesJson.notes) {
          setNotes(notesJson.notes.map((n: any) => ({
            id: n.id,
            title: n.title || 'Untitled Note',
            type: 'Note',
            href: `/tools/notes?id=${n.id}` // Link to open the specific note
          })));
        }

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, router]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-[#09090b] text-white">Loading...</div>;
  }

  if (!profile || !profile.onboarding_completed) {
    // If we confirm profile exists but onboarding isn't done
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

  const ExploreRow = ({ title, items, emptyMessage }: { title: string, items: { id: string, title?: string, type?: string, href?: string, icon?: React.ReactNode }[], emptyMessage?: string }) => {
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

    if (!items || items.length === 0) {
      return (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
          <p className="text-gray-500 italic">{emptyMessage || "No items found."}</p>
        </div>
      )
    }

    return (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {items.length > 3 && (
            <div className="flex gap-2">
              <button onClick={() => scroll('left')} className="p-1.5 border border-zinc-700 rounded-md hover:border-zinc-500 transition text-zinc-400 hover:text-zinc-200" aria-label="Scroll left"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => scroll('right')} className="p-1.5 border border-zinc-700 rounded-md hover:border-zinc-500 transition text-zinc-400 hover:text-zinc-200" aria-label="Scroll right"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scroll-smooth" style={{ scrollbarWidth: 'none', 'msOverflowStyle': 'none' }}>
          {items.map((item, i) => (
            <Link href={item.href || '#'} key={item.id} className="block">
              <motion.div
                className="flex-shrink-0 w-64 h-40 border border-zinc-800 hover:border-zinc-700 rounded-lg p-4 flex flex-col justify-between transition-colors bg-zinc-900/50"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={i}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{item.type}</p>
                    <h3 className="font-bold text-lg text-white mt-1 line-clamp-2">{item.title}</h3>
                  </div>
                  {item.icon && <div className="ml-2">{item.icon}</div>}
                </div>
                <div className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm mt-2">
                  Open <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    );
  };


  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-white mb-2">Welcome, {profile?.username || user?.email?.split('@')[0]}!</h1>
        <p className="text-lg text-gray-400">Let's continue your learning journey.</p>
      </div>

      {/* Continue Where You Left Off */}
      {recentCourse && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Continue Learning</h2>
          <Link href={recentCourse.href} className="block">
            <motion.div
              className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 border border-indigo-500/30 rounded-xl p-6 sm:p-8 flex justify-between items-center group hover:border-indigo-500/50 transition-all"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div>
                <p className="text-sm uppercase tracking-wider text-indigo-200 font-semibold mb-1">{recentCourse.type}</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{recentCourse.title}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-indigo-200">{recentCourse.progress}% Complete</span>
                  <div className="w-24 sm:w-32 bg-indigo-950 rounded-full h-1.5">
                    <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${recentCourse.progress}%` }}></div>
                  </div>
                </div>
              </div>
              <PlayCircle className="w-12 h-12 sm:w-16 sm:h-16 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            </motion.div>
          </Link>
        </div>
      )}

      {/* Course Overview */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">Your Courses</h2>
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, i) => (
              <Link href={course.href} key={course.id}>
                <motion.div
                  className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 rounded-lg p-6 flex items-center gap-6 cursor-pointer transition-colors"
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                >
                  {course.icon}
                  <div className="flex-grow">
                    <h3 className="font-bold text-xl text-white line-clamp-1">{course.title}</h3>
                    <div className="w-full bg-zinc-700 rounded-full h-2.5 mt-2">
                      <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{course.progress}% complete</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-4">You haven't enrolled in any courses yet.</p>
            <Link href="/learning-path/create" className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
              <Plus className="w-4 h-4" /> Create Your First Course
            </Link>
          </div>
        )}
      </div>

      {/* Explore Section */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-6">Explore</h2>
        <ExploreRow title="Your Notes" items={notes} emptyMessage="No notes created yet. Use the Note Taker to get started!" />
        <ExploreRow title="Tools" items={tools} />
      </div>
    </div>
  );
};

export default Dashboard;
