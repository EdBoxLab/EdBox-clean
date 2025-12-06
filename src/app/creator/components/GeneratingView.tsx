import React, { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';

interface GeneratingViewProps {
  isGenerating: boolean;
}

const generationSteps = [
  { icon: "🧠", text: "Analyzing your goal" },
  { icon: "🗺️", text: "Building your skill map" },
  { icon: "🎯", text: "Creating challenges" },
  { icon: "🎨", text: "Personalizing experience" },
  { icon: "✨", text: "Almost ready..." }
];

const GeneratingView = memo(function GeneratingView({ isGenerating }: GeneratingViewProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isGenerating) return;
    
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => 
        prev < generationSteps.length - 1 ? prev + 1 : prev
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center"
    >
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Animated Icon */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-8xl"
        >
          {generationSteps[currentStepIndex].icon}
        </motion.div>

        {/* Current Step */}
        <div>
          <h2 className="text-3xl font-bold mb-2">
            Creating your path...
          </h2>
          <p className="text-xl text-gray-400">
            {generationSteps[currentStepIndex].text}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-3 pt-8">
          {generationSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: index <= currentStepIndex ? 1 : 0.3,
                x: 0
              }}
              className="flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                index < currentStepIndex
                  ? 'bg-green-500'
                  : index === currentStepIndex
                  ? 'bg-blue-500 animate-pulse'
                  : 'bg-gray-700'
              }`}>
                {index < currentStepIndex ? '✓' : step.icon}
              </div>
              <span className={`text-sm ${
                index <= currentStepIndex ? 'text-white' : 'text-gray-600'
              }`}>
                {step.text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Fun fact */}
        <div className="pt-8 text-sm text-gray-500">
          💡 Did you know? Our AI creates a unique path for every learner
        </div>
      </div>
    </motion.div>
  );
});

export default GeneratingView;