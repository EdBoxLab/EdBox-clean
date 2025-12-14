'use client';
import { motion } from 'framer-motion';
import { Clock, Trophy, CheckCircle, Target, Lock, AlertCircle } from 'lucide-react';
import { SkillNode } from '@/lib/courseCreation/types';
import type { SkillState } from '@/types/skill-progression';

interface SkillProgress {
  challengesCompleted: number;
  challengesRequired: number;
  progressPercentage: number;
  xpEarned: number;
  successRate: number;
  totalAttempts: number;
  masteryAchieved: boolean;
  recentPerformance?: {
    trend: 'improving' | 'declining' | 'stable';
    streakLength: number;
  };
}

interface SkillCardProps {
  skill: SkillNode;
  index: number;
  skillState: SkillState;
  progress: SkillProgress | null;
  unmetPrereqs: SkillNode[];
  onSkillClick: (skillId: string) => void;
}

export default function SkillCard({
  skill,
  index,
  skillState,
  progress,
  unmetPrereqs,
  onSkillClick
}: SkillCardProps) {
  // Determine colors and styles based on state
  const getStateStyles = () => {
    switch (skillState) {
      case 'mastered':
        return {
          borderColor: 'border-green-500',
          bgGradient: 'from-green-500/20 to-emerald-500/20',
          textColor: 'text-green-400',
          icon: CheckCircle,
          iconColor: 'text-green-400'
        };
      case 'unlocked':
        return {
          borderColor: 'border-indigo-500',
          bgGradient: 'from-indigo-500/20 to-purple-500/20',
          textColor: 'text-indigo-400',
          icon: Target,
          iconColor: 'text-indigo-400'
        };
      case 'locked':
      default:
        return {
          borderColor: 'border-gray-600',
          bgGradient: 'from-gray-600/10 to-gray-700/10',
          textColor: 'text-gray-500',
          icon: Lock,
          iconColor: 'text-gray-500'
        };
    }
  };

  const styles = getStateStyles();
  const StateIcon = styles.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.1 }}
      className={`relative group ${skillState === 'locked' ? 'cursor-help' : 'cursor-pointer'}`}
      onClick={() => onSkillClick(skill.id)}
      whileHover={{
        scale: skillState !== 'locked' ? 1.02 : 1,
        transition: { duration: 0.2 }
      }}
      whileTap={{
        scale: skillState !== 'locked' ? 0.98 : 1,
        transition: { duration: 0.1 }
      }}
    >
      {/* Hover glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${styles.bgGradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      {/* Subtle glow for unlocked skills */}
      {skillState === 'unlocked' && progress && progress.challengesCompleted === 0 && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Progress glow for skills in progress */}
      {skillState === 'unlocked' && progress && progress.challengesCompleted > 0 && !progress.masteryAchieved && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Success glow for mastered skills */}
      {skillState === 'mastered' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Unlock animation overlay */}
      {skillState === 'unlocked' && progress && progress.challengesCompleted === 0 && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-2xl"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.1, 1],
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 8,
            ease: "easeOut"
          }}
        />
      )}

      <div className={`relative bg-gray-800 rounded-2xl p-4 md:p-6 border ${styles.borderColor} transition-all duration-300 ${skillState === 'locked' ? 'opacity-60' : ''} overflow-hidden`}>

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl overflow-hidden bg-gray-700">
          <motion.div
            className={`h-full ${skillState === 'mastered' ? 'bg-green-500' : skillState === 'unlocked' ? 'bg-indigo-500' : 'bg-gray-600'}`}
            initial={{ width: '0%' }}
            animate={{
              width: skillState === 'mastered' ? '100%' :
                progress ? `${progress.progressPercentage}%` : '0%'
            }}
            transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
          />
        </div>

        {/* State Icon */}
        <div className="absolute top-3 right-3">
          <motion.div
            animate={skillState === 'mastered' ? {
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            } : {}}
            transition={{
              duration: 2,
              repeat: skillState === 'mastered' ? Infinity : 0,
              repeatDelay: 3
            }}
          >
            <StateIcon className={`w-5 h-5 ${styles.iconColor}`} />
          </motion.div>
        </div>

        {/* Content */}
        <div className="mt-2">
          <div className="flex items-start justify-between mb-3 pr-8">
            <h3 className={`text-lg md:text-xl font-bold ${skillState === 'locked' ? 'text-gray-400' : 'text-white'} group-hover:${styles.textColor} transition-colors`}>
              {skill.title || (skill as any).name || 'Untitled Skill'}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-lg">
              <Clock className="w-3 h-3" />
              <span>{skill.estimatedMinutes}m</span>
            </div>
          </div>

          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {skill.description}
          </p>

          {/* Progress Information */}
          {progress && skillState !== 'locked' && (
            <div className="mb-3 p-2 bg-gray-700/30 rounded-lg">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-300">
                  Progress: {progress.challengesCompleted}/{progress.challengesRequired}
                </span>
                <span className={`font-bold ${styles.textColor}`}>
                  {Math.round(progress.progressPercentage)}%
                </span>
              </div>

              {/* Mini progress bar */}
              <div className="w-full bg-gray-600 rounded-full h-1.5 mb-2">
                <motion.div
                  className={`h-1.5 rounded-full ${skillState === 'mastered' ? 'bg-green-500' : 'bg-indigo-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progressPercentage}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                {progress.successRate > 0 && (
                  <span className="text-yellow-400">
                    {Math.round(progress.successRate * 100)}% success
                  </span>
                )}
                {progress.totalAttempts > 0 && (
                  <span className="text-gray-400">
                    {progress.totalAttempts} attempt{progress.totalAttempts !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Performance trend indicator */}
              {progress.recentPerformance && (
                <div className="flex items-center gap-1 mt-1">
                  <div className={`w-2 h-2 rounded-full ${progress.recentPerformance.trend === 'improving' ? 'bg-green-400' :
                    progress.recentPerformance.trend === 'declining' ? 'bg-red-400' : 'bg-yellow-400'
                    }`} />
                  <span className="text-xs text-gray-400">
                    {progress.recentPerformance.trend === 'improving' ? 'Improving' :
                      progress.recentPerformance.trend === 'declining' ? 'Needs focus' : 'Stable'}
                  </span>
                  {progress.recentPerformance.streakLength > 1 && (
                    <span className="text-xs text-gray-500">
                      • {progress.recentPerformance.streakLength} streak
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Prerequisites warning for locked skills */}
          {skillState === 'locked' && unmetPrereqs.length > 0 && (
            <div className="mb-3 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-orange-400">
                <AlertCircle className="w-3 h-3" />
                <span>Complete {unmetPrereqs.length} prerequisite{unmetPrereqs.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase font-bold">
              {skill.level || 'Beginner'}
            </span>
            <div className="flex items-center gap-1 text-yellow-400">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-bold">
                {progress?.xpEarned || 0}/{skill.xpReward} XP
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}