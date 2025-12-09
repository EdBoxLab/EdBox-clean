import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { LearningContext, ContextOption } from '../types';

interface Step2ContextProps {
  context: LearningContext | null;
  setContext: (context: LearningContext) => void;
}

const contextOptions: ContextOption[] = [
  {
    id: LearningContext.HighSchool,
    icon: "🎓",
    title: "I'm in high school",
    subtitle: "Learning for school or future"
  },
  {
    id: LearningContext.College,
    icon: "🎓",
    title: "I'm in college",
    subtitle: "Need skills for internships"
  },
  {
    id: LearningContext.JobSeeking,
    icon: "💼",
    title: "Looking for my first tech job",
    subtitle: "Career ready, ASAP"
  },
  {
    id: LearningContext.BuildingProjects,
    icon: "🚀",
    title: "Want to build my own projects",
    subtitle: "Side hustles and startups"
  }
];

const Step2Context = memo(function Step2Context({ context, setContext }: Step2ContextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          What brings you here?
        </h1>
        <p className="text-gray-400 text-lg">
          This helps us personalize everything for you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contextOptions.map((option) => (
          <motion.button
            key={option.id}
            onClick={() => setContext(option.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-6 rounded-2xl border-2 text-left transition-all ${
              context === option.id
                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <div className="text-4xl mb-3">{option.icon}</div>
            <h3 className="text-xl font-bold mb-1">{option.title}</h3>
            <p className="text-gray-400 text-sm">{option.subtitle}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
});

export default Step2Context;