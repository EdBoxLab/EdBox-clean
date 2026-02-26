import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';
import { DashboardItem } from '@/hooks/useDashboardData';

interface FocusSessionProps {
    recentCourse: DashboardItem;
}

export const FocusSession: React.FC<FocusSessionProps> = ({ recentCourse }) => {
    if (!recentCourse) return null;

    return (
        <div className="mb-12">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Focus Session</h2>
            <Link href={recentCourse.href || '#'}>
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
    );
};
