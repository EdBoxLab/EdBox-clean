'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, TrendingUp, Award } from 'lucide-react';

interface XPStreakDisplayProps {
    userId?: string;
    skillGraphId?: string;
    showCompact?: boolean;
}

interface XPData {
    xp: number;
    level: number;
    streak: number;
    badges: any[];
    lastActive: string | null;
}

export function XPStreakDisplay({ userId, skillGraphId = 'default', showCompact = false }: XPStreakDisplayProps) {
    const [xpData, setXpData] = useState<XPData>({
        xp: 0,
        level: 1,
        streak: 0,
        badges: [],
        lastActive: null
    });
    const [loading, setLoading] = useState(true);
    const [showLevelUp, setShowLevelUp] = useState(false);

    useEffect(() => {
        fetchXPData();
    }, [userId, skillGraphId]);

    const fetchXPData = async () => {
        try {
            const response = await fetch(`/api/xp/update?skillGraphId=${skillGraphId}`);
            if (response.ok) {
                const data = await response.json();
                setXpData(data);
            }
        } catch (error) {
            console.error('Failed to fetch XP data:', error);
        } finally {
            setLoading(false);
        }
    };

    const xpForNextLevel = xpData.level * 100;
    const xpInCurrentLevel = xpData.xp % 100;
    const progressPercent = (xpInCurrentLevel / 100) * 100;

    if (loading) {
        return (
            <div className="flex items-center gap-3 text-gray-400 animate-pulse">
                <div className="h-8 w-20 bg-gray-700 rounded"></div>
                <div className="h-8 w-20 bg-gray-700 rounded"></div>
            </div>
        );
    }

    if (showCompact) {
        return (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-3 py-1.5 rounded-full border border-purple-500/30">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-bold text-purple-300">{xpData.xp} XP</span>
                    <span className="text-xs text-gray-400">Lv.{xpData.level}</span>
                </div>
                
                <div className="flex items-center gap-2 bg-gradient-to-r from-orange-600/20 to-red-600/20 px-3 py-1.5 rounded-full border border-orange-500/30">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-bold text-orange-300">{xpData.streak}</span>
                    <span className="text-xs text-gray-400">day streak</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-6 rounded-2xl border border-purple-500/30 shadow-2xl"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600/30 p-3 rounded-xl border border-purple-500/50">
                            <TrendingUp className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">Level {xpData.level}</h3>
                            <p className="text-sm text-gray-400">{xpData.xp} Total XP</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-gradient-to-r from-orange-600/20 to-red-600/20 px-4 py-2 rounded-xl border border-orange-500/30">
                        <Flame className="w-5 h-5 text-orange-400" />
                        <div className="text-right">
                            <div className="text-2xl font-bold text-orange-300">{xpData.streak}</div>
                            <div className="text-xs text-gray-400">day streak</div>
                        </div>
                    </div>
                </div>

                <div className="mb-2">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Progress to Level {xpData.level + 1}</span>
                        <span className="text-purple-400 font-bold">{xpInCurrentLevel}/100 XP</span>
                    </div>
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-full"
                        />
                    </div>
                </div>

                {xpData.badges && xpData.badges.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                            <Award className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-gray-400">Recent Badges</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {xpData.badges.slice(0, 5).map((badge, idx) => (
                                <div 
                                    key={idx}
                                    className="bg-yellow-600/20 px-3 py-1 rounded-full border border-yellow-500/30 text-xs text-yellow-300"
                                >
                                    {badge.name || badge}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

            <AnimatePresence>
                {showLevelUp && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ y: 50 }}
                            animate={{ y: 0 }}
                            className="bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 p-12 rounded-3xl border-4 border-purple-500 text-center max-w-md"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="inline-block mb-6"
                            >
                                <Zap className="w-24 h-24 text-yellow-400" />
                            </motion.div>
                            <h2 className="text-5xl font-bold text-white mb-4">Level Up!</h2>
                            <p className="text-2xl text-purple-300 mb-6">You reached Level {xpData.level}!</p>
                            <button
                                onClick={() => setShowLevelUp(false)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold transition-colors"
                            >
                                Continue
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
