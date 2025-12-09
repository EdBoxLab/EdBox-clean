'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Trophy, Plus, Loader2, TrendingUp } from 'lucide-react';

interface SkillGraph {
  id: string;
  goal: string;
  nodes: any[];
  created_at: string;
}

interface UserProgress {
  skill_graph_id: string;
  mastery_level: number;
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<SkillGraph[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/skill-graph/list');
      const data = await response.json();

      if (data.success) {
        setCourses(data.courses || []);
        setProgress(data.progress || {});
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (courseId: string) => {
    return Math.round((progress[courseId] || 0) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-indigo-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Learning Paths</h1>
          <p className="text-gray-400">Continue your journey or start a new one</p>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="inline-flex p-6 bg-indigo-500/10 rounded-full mb-6">
              <BookOpen className="w-16 h-16 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">No courses yet</h2>
            <p className="text-gray-400 mb-8">Start your first learning path to begin your journey</p>
            <button
              onClick={() => router.push('/onboarding')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Course
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => {
              const progressPct = getProgressPercentage(course.id);
              const totalMinutes = course.nodes.reduce((sum: number, n: any) => sum + (n.estimatedMinutes || 0), 0);
              const totalXP = course.nodes.reduce((sum: number, n: any) => sum + (n.xpReward || 0), 0);

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => router.push(`/courses/${course.id}`)}
                  className="group cursor-pointer"
                >
                  <div className="relative bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-indigo-500 transition-all hover:shadow-xl hover:shadow-indigo-500/20">
                    {/* Progress Badge */}
                    {progressPct > 0 && (
                      <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-indigo-500/20 rounded-full text-xs font-bold text-indigo-400">
                        <TrendingUp className="w-3 h-3" />
                        {progressPct}%
                      </div>
                    )}

                    {/* Icon */}
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold mb-2 line-clamp-2">{course.goal}</h3>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.nodes.length} skills</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{totalMinutes}m</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        <span>{totalXP} XP</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                      />
                    </div>

                    {/* Date */}
                    <p className="text-xs text-gray-500 mt-4">
                      Started {new Date(course.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}

            {/* Add New Course Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: courses.length * 0.1 }}
              onClick={() => router.push('/onboarding')}
              className="cursor-pointer"
            >
              <div className="bg-gray-800/50 border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-2xl p-6 h-full flex flex-col items-center justify-center text-center transition-all hover:bg-gray-800">
                <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">New Learning Path</h3>
                <p className="text-sm text-gray-400">Start a new journey</p>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
