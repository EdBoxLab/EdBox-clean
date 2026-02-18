'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import OnboardingForm from '@/components/OnboardingForm';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, Book, FileText, Zap, PlayCircle, Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { StreakCard } from '@/components/StreakXP';
import { DiscoverFeed } from '@/components/feed/DiscoverFeed';

const Dashboard: React.FC = () => {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [studyKits, setStudyKits] = useState<any[]>([]);
  const [recentCourse, setRecentCourse] = useState<any>(null);

  const [coursesLoading, setCoursesLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);
  const [kitsLoading, setKitsLoading] = useState(true);

  const tools = [
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

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        } else if (!profileError || profileError.code === 'PGRST116') {
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert([{ id: user.id, email: user.email }])
            .select()
            .single();
          if (newProfile) setProfile(newProfile);
        }

        setLoading(false);

        const fetchCourses = async () => {
          try {
            const coursesRes = await fetch('/api/skill-graph/list');
            const coursesJson = await coursesRes.json();

            if (coursesJson.success && coursesJson.courses) {
              const mappedCourses = coursesJson.courses.map((c: any) => ({
                id: c.id,
                title: c.goal || c.topic || 'Untitled Course',
                type: 'Course',
                progress: Math.round((coursesJson.progress?.[c.id] || 0) * 100),
                icon: <Book className="w-8 h-8 text-indigo-300" />,
                href: `/pulse?type=COURSE&id=${c.id}`
              }));
              setCourses(mappedCourses);

              if (mappedCourses.length > 0) {
                setRecentCourse({
                  type: 'Course',
                  title: mappedCourses[0].title,
                  href: mappedCourses[0].href,
                  progress: mappedCourses[0].progress
                });
              }
            }
          } catch (error) {
            console.error("Error fetching courses:", error);
          } finally {
            setCoursesLoading(false);
          }
        };

        const fetchNotes = async () => {
          try {
            const notesRes = await fetch('/api/notes');
            const notesJson = await notesRes.json();
            if (Array.isArray(notesJson)) {
              setNotes(notesJson.map((n: any) => ({
                id: n.id,
                title: n.title || 'Untitled Note',
                type: 'Note',
                href: `/pulse?type=NOTE&id=${n.id}`,
                icon: <FileText className="w-8 h-8 text-green-300" />
              })));
            }
          } catch (error) {
            console.error("Error fetching notes:", error);
          } finally {
            setNotesLoading(false);
          }
        };

        const fetchStudyKits = async () => {
          try {
            const kitsRes = await fetch('/api/study-kit/list');
            const kitsJson = await kitsRes.json();
            if (kitsJson.studyKits) {
              setStudyKits(kitsJson.studyKits.map((kit: any) => ({
                id: kit.id,
                title: kit.title || 'Untitled Study Kit',
                type: 'Study Kit',
                href: `/tools/study-kit?id=${kit.id}`,
                icon: <Zap className="w-8 h-8 text-yellow-300" />
              })));
            }
          } catch (error) {
            console.error("Error fetching study kits:", error);
          } finally {
            setKitsLoading(false);
          }
        };

        fetchCourses();
        fetchNotes();
        fetchStudyKits();

      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, router]);

  const handleDelete = async (id: string, type: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    let endpoint = '';
    if (type === 'Course') endpoint = `/api/skill-graph/${id}`;
    else if (type === 'Note') endpoint = `/api/notes/${id}`;
    else if (type === 'Study Kit') endpoint = `/api/study-kit/${id}`;

    if (!endpoint) return;

    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        if (type === 'Course') {
          setCourses(prev => prev.filter(c => c.id !== id));
          if (recentCourse?.href.includes(id)) setRecentCourse(null);
        } else if (type === 'Note') {
          setNotes(prev => prev.filter(n => n.id !== id));
        } else if (type === 'Study Kit') {
          setStudyKits(prev => prev.filter(k => k.id !== id));
        }
      } else {
        alert(`Failed to delete ${type}`);
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Error deleting ${type}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-zinc-950 text-white gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400">Loading your dashboard...</p>
      </div>
    );
  }

  if (!profile || !profile.onboarding_completed) {
    return <OnboardingForm onComplete={(newProfile) => setProfile(newProfile)} />;
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
    })
  };

  const SkeletonCard = () => (
    <div className="flex-shrink-0 w-64 h-40 border border-zinc-800 rounded-lg p-4 bg-zinc-900/50 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-grow">
          <div className="h-3 bg-zinc-700 rounded w-16 mb-2"></div>
          <div className="h-4 bg-zinc-700 rounded w-40"></div>
        </div>
        <div className="w-8 h-8 bg-zinc-700 rounded"></div>
      </div>
      <div className="h-3 bg-zinc-700 rounded w-24 mt-6"></div>
    </div>
  );

  const ExploreRow = ({
    title,
    items,
    emptyMessage,
    showProgress = false,
    createLink,
    createText,
    isLoading = false,
    onDelete
  }: {
    title: string;
    items: any[];
    emptyMessage?: string;
    showProgress?: boolean;
    createLink?: string;
    createText?: string;
    isLoading?: boolean;
    onDelete?: (id: string, type: string) => void;
  }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    useEffect(() => {
      checkScroll();
      const scrollElement = scrollRef.current;
      if (scrollElement) {
        scrollElement.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        return () => {
          scrollElement.removeEventListener('scroll', checkScroll);
          window.removeEventListener('resize', checkScroll);
        };
      }
    }, [items]);

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

    if (isLoading) {
      return (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
          <div className="flex gap-4 overflow-hidden pb-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      );
    }

    if (!items || items.length === 0) {
      return (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-4">{emptyMessage || "No items found."}</p>
            {createLink && createText && (
              <Link href={createLink} className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
                <Plus className="w-4 h-4" /> {createText}
              </Link>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {items.length > 3 && (
            <div className="flex gap-2">
              <button
                onClick={() => scroll('left')}
                className={`p-1.5 border rounded-md transition ${showLeftArrow
                  ? 'border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200'
                  : 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                  }`}
                disabled={!showLeftArrow}
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className={`p-1.5 border rounded-md transition ${showRightArrow
                  ? 'border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200'
                  : 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                  }`}
                disabled={!showRightArrow}
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item, i) => (
            <div key={item.id} className="relative group/card">
              <Link href={item.href || '#'} className="block">
                <motion.div
                  className="flex-shrink-0 w-64 border border-zinc-800 hover:border-zinc-600 rounded-lg p-4 flex flex-col justify-between transition-colors bg-zinc-900/50 group"
                  style={{ minHeight: showProgress ? '180px' : '160px' }}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-grow min-w-0 pr-2">
                      <p className="text-sm text-gray-400 uppercase tracking-wide font-medium">{item.type}</p>
                      <h3 className="font-bold text-lg text-white mt-1 line-clamp-2 break-words">{item.title}</h3>
                    </div>
                    {item.icon && <div className="flex-shrink-0 ml-2">{item.icon}</div>}
                  </div>

                  {showProgress && typeof item.progress === 'number' && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">{item.progress}% complete</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-indigo-400 group-hover:text-indigo-300 text-sm mt-3 transition-colors">
                    Open <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </Link>

              {onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(item.id, item.type);
                  }}
                  className="absolute bottom-2 right-2 p-2.5 bg-zinc-900/90 hover:bg-red-500 text-zinc-400 hover:text-white rounded-full border border-zinc-800 hover:border-red-500 transition-all z-20 shadow-xl"
                  title={`Delete ${item.type}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 py-4 sm:p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-1 sm:mb-2 break-words">
              Welcome, {profile?.username || user?.email?.split('@')[0]}!
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-400">Let's continue your learning journey.</p>
          </div>
          <div className="w-full max-w-full lg:max-w-sm">
            <StreakCard />
          </div>
        </div>

        <div className="mb-12">
          <DiscoverFeed />
        </div>

        {recentCourse && (
          <div className="mb-12">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Focus Session</h2>
            <Link href={recentCourse.href}>
              <motion.div
                className="relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-10 flex justify-between items-center group hover:border-zinc-700 transition-all cursor-pointer shadow-2xl"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex-grow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-bold">
                      {recentCourse.type} Active
                    </p>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">
                    {recentCourse.title}
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Progress</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 sm:w-48 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${recentCourse.progress}%` }}
                            className="bg-indigo-500 h-full transition-all duration-1000"
                          />
                        </div>
                        <span className="text-xs text-zinc-200 font-bold tabular-nums">
                          {recentCourse.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <PlayCircle className="w-14 h-14 sm:w-20 sm:h-20 text-white group-hover:scale-110 transition-transform flex-shrink-0" />
                </div>
              </motion.div>
            </Link>
          </div>
        )}

        <div>
          <h2 className="text-3xl font-bold text-white mb-6">Explore</h2>
          <ExploreRow
            title="Your Courses"
            items={courses}
            emptyMessage="You haven't enrolled in any courses yet."
            showProgress={true}
            createLink="/creator"
            createText="Create Your First Course"
            isLoading={coursesLoading}
            onDelete={handleDelete}
          />
          <ExploreRow
            title="Your Notes"
            items={notes}
            emptyMessage="No notes created yet. Use the Note Taker to get started!"
            isLoading={notesLoading}
            onDelete={handleDelete}
          />
          <ExploreRow
            title="Your Study Kits"
            items={studyKits}
            emptyMessage="No study kits generated yet. Use Study Kit to create one!"
            isLoading={kitsLoading}
            onDelete={handleDelete}
          />
          <ExploreRow title="Tools" items={tools} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
