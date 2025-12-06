'use client';

interface Props {
  goal: string;
  totalSkills: number;
  masteredSkills: number;
  totalXP: number;
  level: number;
  streak: number;
  estimatedHours: string;
}

export default function ProgressHeader({
  goal,
  totalSkills,
  masteredSkills,
  totalXP,
  level,
  streak,
  estimatedHours,
}: Props) {
  const progressPercent = totalSkills > 0 ? (masteredSkills / totalSkills) * 100 : 0;
  
  // Calculate XP for next level
  const xpForNextLevel = level * 100;
  const xpProgress = (totalXP % 100) / 100 * 100;

  return (
    <div className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Goal Title */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {goal}
          </h1>
          <p className="text-gray-400">
            {masteredSkills} of {totalSkills} skills mastered • {estimatedHours}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Progress */}
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📊</span>
              <span className="text-gray-400 text-sm">Progress</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {Math.round(progressPercent)}%
            </div>
          </div>

          {/* Streak */}
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔥</span>
              <span className="text-gray-400 text-sm">Streak</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {streak} {streak === 1 ? 'day' : 'days'}
            </div>
          </div>

          {/* Level */}
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⭐</span>
              <span className="text-gray-400 text-sm">Level</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {level}
            </div>
          </div>

          {/* Total XP */}
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎯</span>
              <span className="text-gray-400 text-sm">Total XP</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {totalXP}
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Overall Progress</span>
            <span className="text-white font-semibold">
              {masteredSkills}/{totalSkills} skills
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* XP Progress to Next Level */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">XP to Level {level + 1}</span>
            <span className="text-white font-semibold">
              {totalXP % 100}/{xpForNextLevel}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}