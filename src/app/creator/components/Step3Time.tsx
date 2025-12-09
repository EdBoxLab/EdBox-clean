import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { TimeOption } from '../types';

interface Step3TimeProps {
  timeAvailable: string | null;
  setTimeAvailable: (time: string) => void;
}

const timeOptions: TimeOption[] = [
  {
    value: "5min",
    label: "5 minutes",
    icon: "⚡",
    description: "Quick bursts between classes"
  },
  {
    value: "15min",
    label: "15 minutes",
    icon: "🔥",
    description: "Daily practice sessions"
  },
  {
    value: "1hour",
    label: "1 hour+",
    icon: "💪",
    description: "Deep focus time"
  }
];

const Step3Time = memo(function Step3Time({ timeAvailable, setTimeAvailable }: Step3TimeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          How much time do you have right now?
        </h1>
        <p className="text-gray-400 text-lg">
          We'll match your learning to your schedule
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {timeOptions.map((option) => (
          <motion.button
            key={option.value}
            onClick={() => setTimeAvailable(option.value)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-8 rounded-2xl border-2 text-center transition-all ${
              timeAvailable === option.value
                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <div className="text-5xl mb-4">{option.icon}</div>
            <h3 className="text-2xl font-bold mb-2">{option.label}</h3>
            <p className="text-gray-400 text-sm">{option.description}</p>
          </motion.button>
        ))}
      </div>

      {/* Weekly commitment hint */}
      <div className="text-center mt-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <p className="text-sm text-gray-400">
          💡 You can always adjust this later in settings
        </p>
      </div>
    </motion.div>
  );
});

export default Step3Time;