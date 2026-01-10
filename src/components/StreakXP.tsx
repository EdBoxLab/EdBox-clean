'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStreakXP } from '@/lib/hooks/useStreakXP';
import { Flame, Zap, Trophy, Star, X, CloudFog } from 'lucide-react';

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
  const { streak, xp, loading, checkIn } = useStreakXP();

  useEffect(() => {
    checkIn();
  }, [checkIn]);

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-4 shadow-sm animate-pulse">
        <div className="h-5 w-24 bg-zinc-700 rounded mb-3" />
        <div className="h-16 bg-zinc-700 rounded" />
      </div>
    );
  }

  const progressPercentage = xp.xpForNextLevel > 0
    ? Math.min(100, (xp.progress / (xp.xpForNextLevel - xp.xpForCurrentLevel)) * 100)
    : 0;

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 sm:p-4 shadow-sm w-full box-border overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm sm:text-base font-semibold text-white">Your Progress</h3>
        <div className="flex items-center gap-1 text-orange-500">
          <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-bold text-sm sm:text-base">{streak.current}</span>
        </div>
      </div>

      <div className="flex justify-between mb-3">
        {weekDays.map((day, index) => {
          const isToday = index === today;
          const isPast = index < today;
          // Check history if available
          const isCheckedIn = streak.history ? streak.history[index] : false;

          return (
            <div key={index} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
              <span className="text-[9px] sm:text-[10px] text-gray-400">{day}</span>
              <div
                className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${isCheckedIn
                    ? 'bg-orange-500 text-white'
                    : isPast || isToday // Missed day (checked but no history = missed)
                      ? 'bg-zinc-800 text-gray-600'
                      : 'bg-zinc-800/50 text-gray-700' // Future
                  } ${isToday ? 'ring-2 ring-indigo-500/50 ring-offset-1 ring-offset-zinc-900' : ''}`}
              >
                {isCheckedIn ? (
                  <Flame className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                ) : (isPast || isToday) ? (
                  /* Smoke/Cloud icon for missed/unmarked days */
                  <CloudFog className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 opacity-60" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-zinc-800/50 rounded-lg p-2 sm:p-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
            <span className="text-[10px] sm:text-xs font-medium text-gray-300">
              Level {xp.level}
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-gray-500">
            {xp.total} / {xp.xpForNextLevel} XP
          </span>
        </div>
        <div className="w-full h-1.5 sm:h-2 bg-zinc-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="mt-2 sm:mt-3 flex justify-between text-[10px] sm:text-xs">
        <div className="text-center flex-1 min-w-0">
          <div className="font-semibold text-white">{streak.longest}</div>
          <div className="text-[9px] sm:text-[10px] text-gray-500">Best Streak</div>
        </div>
        <div className="text-center flex-1 min-w-0">
          <div className="font-semibold text-white">{xp.total}</div>
          <div className="text-[9px] sm:text-[10px] text-gray-500">Total XP</div>
        </div>
        <div className="text-center flex-1 min-w-0">
          <div className="font-semibold text-white">{xp.level}</div>
          <div className="text-[9px] sm:text-[10px] text-gray-500">Level</div>
        </div>
      </div>
    </div>
  );
}
