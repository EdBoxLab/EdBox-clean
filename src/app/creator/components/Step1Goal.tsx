import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface Step1GoalProps {
  goal: string;
  setGoal: (goal: string) => void;
  level: 'beginner' | 'intermediate' | 'advanced' | null;
  setLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void;
  uploadedFile: File | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isExtracting?: boolean;
}

const Step1Goal = memo(function Step1Goal({ 
  goal, 
  setGoal, 
  level,
  setLevel,
  uploadedFile, 
  handleFileUpload,
  isExtracting = false
}: Step1GoalProps) {
  const quickExamples = [
    "Build websites",
    "Learn Python",
    "Create mobile apps",
    "Make AI projects",
    "Learn Cold Email marketing"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          What do you want to learn?
        </h1>
        <p className="text-gray-400 text-lg">
          Be specific - the better you describe it, the better we can help
        </p>
      </div>

        {/* Text Input */}
        <div className="relative">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="I want to build AI chatbots 
I want to learn Spanish for my trip 
I want to make digital art "
            className="w-full bg-gray-800 border-2 border-gray-700 focus:border-blue-500 rounded-2xl p-6 text-white placeholder-gray-500 focus:outline-none min-h-[150px] text-lg resize-none transition-colors"
            maxLength={500}
          />
          <div className="absolute bottom-4 right-4 text-sm text-gray-500">
            {goal.length}/500
          </div>
        </div>

        {/* Level Selection */}
        <div className="space-y-3">
          <p className="text-sm text-gray-400 font-medium">Select your current level:</p>
          <div className="grid grid-cols-3 gap-3">
            {(['beginner', 'intermediate', 'advanced'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`py-3 px-4 rounded-xl border-2 transition-all capitalize font-medium ${
                  level === l
                    ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/20'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Examples */}
      <div className="space-y-2">
        <p className="text-sm text-gray-400">Quick picks:</p>
        <div className="flex flex-wrap gap-2">
          {quickExamples.map((example) => (
            <button
              key={example}
              onClick={() => setGoal(example)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-sm transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* OR Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-gray-700"></div>
        <span className="text-gray-500 text-sm">OR</span>
        <div className="flex-1 h-px bg-gray-700"></div>
      </div>

        {/* File Upload */}
        <div className="relative">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileUpload}
            disabled={isExtracting}
            accept=".txt,.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.md"
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className={`block w-full bg-gray-800 border-2 border-dashed rounded-2xl p-8 text-center transition-colors group ${
              isExtracting 
                ? 'border-blue-500 cursor-wait' 
                : 'border-gray-700 hover:border-blue-500 cursor-pointer'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                isExtracting ? 'bg-blue-500/20' : 'bg-gray-700 group-hover:bg-gray-600'
              }`}>
                {isExtracting ? (
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-white font-semibold">
                  {isExtracting ? 'Extracting meaningful context...' : (uploadedFile ? uploadedFile.name : 'Upload a file instead')}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {isExtracting ? 'Our AI is reading your document to build a custom course' : 'Job description, project brief, or learning plan'}
                </p>
                {!isExtracting && (
                  <p className="text-xs text-gray-600 mt-2">
                    PDF, Word, PowerPoint, images, text files • Max 10MB
                  </p>
                )}
              </div>
            </div>
          </label>
        </div>

    </motion.div>
  );
});

export default Step1Goal;