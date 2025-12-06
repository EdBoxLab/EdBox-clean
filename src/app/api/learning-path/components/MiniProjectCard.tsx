'use client';

interface MiniProject {
  id: string;
  name: string;
  description: string;
  engine: string;
  estimatedMinutes: number;
  xpReward: number;
  shareTemplate: string;
}

interface Props {
  project: MiniProject;
  onStart: (projectId: string) => void;
}

export default function MiniProjectCard({ project, onStart }: Props) {
  return (
    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500 rounded-2xl p-6 hover:scale-105 transition-transform">
      <div className="flex items-start gap-3 mb-4">
        <span className="text-4xl">🚀</span>
        <div className="flex-1">
          <p className="text-purple-300 text-xs font-semibold mb-1">
            MINI PROJECT
          </p>
          <h3 className="text-xl font-bold text-white mb-2">
            {project.name}
          </h3>
          <p className="text-gray-300 text-sm line-clamp-2">
            {project.description}
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex gap-2 mb-4 text-xs">
        <span className="px-3 py-1 bg-purple-500/20 rounded-full text-purple-200">
          ⏱️ {project.estimatedMinutes} min
        </span>
        <span className="px-3 py-1 bg-purple-500/20 rounded-full text-purple-200">
          🎯 +{project.xpReward} XP
        </span>
      </div>

      <button
        onClick={() => onStart(project.id)}
        className="w-full px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-colors"
      >
        Start Project →
      </button>
    </div>
  );
}
