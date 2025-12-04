'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateCourse, recommendTopFormats } from '@/app/api/coursecreation/courseCreationService';
import { CourseFormat, LearningMode, AgentState, RecommendedFormat } from '@/app/api/coursecreation/types';

const THEME = {
  primary: 'blue',
  primaryFill: 'bg-blue-500',
  primaryHover: 'hover:bg-blue-600',
  buttonFill: 'bg-blue-500',
  buttonHover: 'hover:bg-blue-600',
};

export default function CourseCreator() {
  const router = useRouter();
  
  // Form state
  const [prompt, setPrompt] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<CourseFormat>(CourseFormat.MasteryLadder);
  const [selectedMode, setSelectedMode] = useState<LearningMode>(LearningMode.Fun);
  const [file, setFile] = useState<File | null>(null);
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [error, setError] = useState<string>('');
  const [recommendations, setRecommendations] = useState<RecommendedFormat[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Load format recommendations when prompt changes (debounced)
  useEffect(() => {
    if (prompt.trim().length < 10) {
      setRecommendations([]);
      setShowRecommendations(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoadingRecommendations(true);
      try {
        const recs = await recommendTopFormats(prompt, file ? await file.text() : undefined);
        setRecommendations(recs);
        setShowRecommendations(true);
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setIsLoadingRecommendations(false);
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [prompt, file]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      // Validate file size (max 10MB)
      if (uploadedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(uploadedFile);
      setError('');
    }
  };

  const handleContinue = async () => {
    if (!prompt.trim()) {
      setError('Please enter a course description');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      let fileData: { name: string; type: string; content: string } | undefined;

      // If file is uploaded, read its content
      if (file) {
        const content = await file.text();
        fileData = {
          name: file.name,
          type: file.type,
          content: content,
        };
      }

      // Call the course generation service
      const course = await generateCourse(
        prompt,
        selectedFormat,
        selectedMode,
        (updatedAgents) => {
          setAgents(updatedAgents);
        },
        fileData
      );

      if (course) {
        // Success! Redirect to the new course
        router.push(`/courses/${course.id}`);
      } else {
        setError('Failed to generate course. Please try again.');
      }
    } catch (err) {
      console.error('Course generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating the course.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition"
            disabled={isGenerating}
          >
            ← Back
          </button>
          <h1 className="text-3xl md:text-4xl font-bold">Create Your Course</h1>
          <p className="text-gray-400 mt-2">
            Describe what you want to learn, and we'll create a personalized course for you.
          </p>
        </div>

        {/* Course Description */}
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-2">
            What would you like to learn? <span className="text-red-500">*</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., I want to learn Python programming for data analysis, or teach me about Renaissance art history"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none min-h-[120px] resize-none"
            disabled={isGenerating}
          />
          <p className="text-xs text-gray-500 mt-1">
            Be as specific as possible for better results
          </p>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-2">
            Upload Reference Material <span className="text-gray-500 text-sm font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              onChange={handleFileUpload}
              accept=".txt,.pdf,.doc,.docx,.md"
              className="hidden"
              disabled={isGenerating}
            />
            <label
              htmlFor="file-upload"
              className={`w-full bg-gray-800 border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-lg p-6 text-center cursor-pointer transition flex flex-col items-center gap-2 ${
                isGenerating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-gray-400">
                {file ? file.name : 'Click to upload or drag and drop'}
              </span>
              <span className="text-xs text-gray-600">
                TXT, PDF, DOC, DOCX, MD (Max 10MB)
              </span>
            </label>
          </div>
        </div>

        {/* Format Recommendations */}
        {showRecommendations && recommendations.length > 0 && (
          <div className="mb-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              ✨ Recommended Formats
              {isLoadingRecommendations && (
                <span className="text-xs text-gray-400">(Loading...)</span>
              )}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendations.map((rec) => (
                <button
                  key={rec.format}
                  onClick={() => setSelectedFormat(rec.format)}
                  className={`text-left p-3 rounded-lg border-2 transition ${
                    selectedFormat === rec.format
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  disabled={isGenerating}
                >
                  <div className="font-semibold text-sm mb-1">{rec.format}</div>
                  <div className="text-xs text-gray-400">{rec.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Course Format */}
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-2">Course Format</label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as CourseFormat)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-white focus:border-blue-500 focus:outline-none appearance-none cursor-pointer"
            disabled={isGenerating}
          >
            {Object.values(CourseFormat).map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </div>

        {/* Learning Mode */}
        <div className="mb-6">
          <label className="block text-lg font-semibold mb-2">Learning Mode</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.values(LearningMode).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`p-3 rounded-lg border-2 transition text-center ${
                  selectedMode === mode
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                disabled={isGenerating}
              >
                <div className="font-semibold text-sm">{mode}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-200 flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Agent Progress */}
        {isGenerating && agents.length > 0 && (
          <div className="mb-6 space-y-3 bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Creating Your Course...</h3>
            {agents.map((agent) => (
              <div key={agent.name} className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {agent.status === 'complete' && (
                      <span className="text-green-500">✓</span>
                    )}
                    {agent.status === 'running' && (
                      <span className="animate-spin">⚙️</span>
                    )}
                    {agent.status === 'error' && (
                      <span className="text-red-500">✗</span>
                    )}
                    {agent.status === 'pending' && (
                      <span className="text-gray-500">○</span>
                    )}
                    <span className="font-semibold">{agent.name}</span>
                  </div>
                  <span className="text-sm text-gray-400">{agent.percentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      agent.status === 'complete'
                        ? 'bg-green-500'
                        : agent.status === 'error'
                        ? 'bg-red-500'
                        : agent.status === 'running'
                        ? 'bg-blue-500'
                        : 'bg-gray-600'
                    }`}
                    style={{ width: `${agent.percentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400">{agent.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
            disabled={isGenerating}
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            className={`flex-1 px-6 py-3 ${THEME.buttonFill} ${THEME.buttonHover} rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2`}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <>
                <span className="animate-spin">⚙️</span>
                Generating Course...
              </>
            ) : (
              'Continue & Generate Course'
            )}
          </button>
        </div>

        {/* Info Footer */}
        {!isGenerating && (
          <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400">
              💡 <strong>Tip:</strong> The more specific your description, the better your personalized course will be. 
              Include your skill level, goals, and any specific topics you want to cover.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}