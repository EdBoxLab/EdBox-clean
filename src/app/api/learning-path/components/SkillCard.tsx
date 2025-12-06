'use client';

interface MicroSkill {
  id: string;
  name: string;
  description: string;
  engine: string;
  estimatedMinutes: number;
  xpReward: number;
}

interface SkillMastery {
  confidence: number;
  challengesCompleted: number;
  isMastered: boolean;
}

interface Props {
  skill: MicroSkill;
  mastery: SkillMastery | undefined;
  status: 'locked' | 'ready' | 'in_progress' | 'mastered';
  onStart: (skillId: string) => void;
}

export default function SkillCard({ skill, mastery, status, onStart }: Props) {
  const getStatusIcon = () => {
    switch (status) {
      case 'mastered':
        return '✨';
      case 'in_progress':
        return '⚡';
      case 'ready':
        return '●';
      case 'locked':
        return '🔒';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'mastered':
        return 'border-green-500 bg-green-500/10';
      case 'in_progress':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'ready':
        return 'border-blue-500 bg-blue-500/10';
      case 'locked':
        return 'border-gray-700 bg-gray-800';
    }
  };

  const isClickable = status === 'ready' || status === 'in_progress';

  return (
    <button
      onClick={() => isClickable && onStart(skill.id)}
      disabled={!isClickable}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${getStatusColor()} ${
        isClickable ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl">{getStatusIcon()}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white text-sm md:text-base truncate">
            {skill.name}
          </h4>
          <p className="text-gray-400 text-xs md:text-sm line-clamp-2">
            {skill.description}
          </p>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 bg-gray-700 rounded-full text-gray-300">
          ⏱️ {skill.estimatedMinutes}min
        </span>
        <span className="px-2 py-1 bg-gray-700 rounded-full text-gray-300">
          🎯 +{skill.xpReward}XP
        </span>
        <span className="px-2 py-1 bg-gray-700 rounded-full text-gray-300">
          💻 {skill.engine}
        </span>
      </div>

      {/* Progress (if in progress) */}
      {mastery && mastery.challengesCompleted > 0 && !mastery.isMastered && (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Progress</span>
            <span>{Math.round(mastery.confidence * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="h-full bg-yellow-500 rounded-full transition-all"
              style={{ width: `${mastery.confidence * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Mastered Badge */}
      {status === 'mastered' && (
        <div className="mt-3 text-xs text-green-400 font-semibold flex items-center gap-1">
          <span>✓</span>
          <span>Mastered</span>
        </div>
      )}
    </button>
  );
}
