import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useStreakXP } from '@/lib/hooks/useStreakXP';

interface XPStreakDisplayProps {
    userId?: string;
    skillGraphId?: string;
    showCompact?: boolean;
}

export function XPStreakDisplay({ showCompact = false }: XPStreakDisplayProps) {
    const { streak, loading } = useStreakXP();

    if (loading) {
        return (
            <div className="flex items-center gap-3 text-gray-400 animate-pulse">
                <div className="h-8 w-20 bg-gray-700 rounded"></div>
            </div>
        );
    }

    if (showCompact) {
        return (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gradient-to-r from-orange-600/20 to-red-600/20 px-3 py-1.5 rounded-full border border-orange-500/30">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-bold text-orange-300">{streak.current}</span>
                    <span className="text-xs text-gray-400">Flow State</span>
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6 rounded-2xl border border-purple-500/30 shadow-2xl"
        >
            <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 bg-gradient-to-r from-orange-600/20 to-red-600/20 px-4 py-2 rounded-xl border border-orange-500/30">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <div className="text-right">
                        <div className="text-2xl font-bold text-orange-300">{streak.current}</div>
                        <div className="text-xs text-gray-400">Flow State</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
