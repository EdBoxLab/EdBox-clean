'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStreakXP } from '@/lib/hooks/useStreakXP';
import { Flame, Zap, Trophy, Star, X } from 'lucide-react';

export function StreakXPDisplay() {
  const { streak, xp, loading, checkIn } = useStreakXP();

  useEffect(() => {
    checkIn();
  }, [checkIn]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    );
  }

  const progressPercentage = xp.xpForNextLevel > 0
    ? Math.min(100, (xp.progress / (xp.xpForNextLevel - xp.xpForCurrentLevel)) * 100)
    : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full">
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
          {streak.current}
        </span>
      </div>
      
      <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
            Lv.{xp.level}
          </span>
        </div>
        <div className="w-12 h-1.5 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-xs text-purple-500 dark:text-purple-400">
          {xp.total}
        </span>
      </div>
    </div>
  );
}

export function StreakCelebrationModal() {
  const { showCelebration, celebrationData, dismissCelebration, streak } = useStreakXP();

  if (!showCelebration || !celebrationData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={dismissCelebration}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={dismissCelebration}
            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            {celebrationData.leveledUp ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>
            ) : celebrationData.streakMilestone ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center"
              >
                <Flame className="w-10 h-10 text-white" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center"
              >
                <Zap className="w-10 h-10 text-white" />
              </motion.div>
            )}

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
            >
              {celebrationData.leveledUp
                ? `Level ${celebrationData.newLevel}!`
                : celebrationData.streakMilestone
                ? 'Streak Milestone!'
                : 'Daily Reward!'}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {streak.current} Day Streak
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-4"
            >
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                +{celebrationData.xpGained} XP
              </div>
              <div className="space-y-1">
                {celebrationData.breakdown.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm text-gray-600 dark:text-gray-300"
                  >
                    <span>{item.type}</span>
                    <span className="text-green-600 dark:text-green-400">+{item.amount}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={dismissCelebration}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all"
            >
              Continue
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function StreakCard() {
  const { streak, xp, loading } = useStreakXP();

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm animate-pulse">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  const progressPercentage = xp.xpForNextLevel > 0
    ? Math.min(100, (xp.progress / (xp.xpForNextLevel - xp.xpForCurrentLevel)) * 100)
    : 0;

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Progress</h3>
        <div className="flex items-center gap-1 text-orange-500">
          <Flame className="w-5 h-5" />
          <span className="font-bold">{streak.current}</span>
        </div>
      </div>

      <div className="flex justify-between mb-4">
        {weekDays.map((day, index) => {
          const isToday = index === today;
          const isPast = index < today;
          const isActive = isPast || isToday;
          
          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">{day}</span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                } ${isToday ? 'ring-2 ring-orange-300 ring-offset-2 dark:ring-offset-gray-800' : ''}`}
              >
                {isActive && <Flame className="w-4 h-4" />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Level {xp.level}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {xp.total} / {xp.xpForNextLevel} XP
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="mt-3 flex justify-between text-sm">
        <div className="text-center">
          <div className="font-semibold text-gray-900 dark:text-white">{streak.longest}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Best Streak</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900 dark:text-white">{xp.total}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total XP</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900 dark:text-white">{xp.level}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Level</div>
        </div>
      </div>
    </div>
  );
}
