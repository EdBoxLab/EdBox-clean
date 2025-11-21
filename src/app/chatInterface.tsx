import React, { useState } from 'react';
import type { CitationStyle } from '../types';
import { SparklesIcon } from './icons';

interface ControlPanelProps {
  onGenerate: (goal: string, audience: string, citationStyle: CitationStyle) => void;
  isLoading: boolean;
  disabled: boolean;
}

const citationStyles: CitationStyle[] = ['APA', 'MLA', 'Chicago'];

export const ControlPanel: React.FC<ControlPanelProps> = ({ onGenerate, isLoading, disabled }) => {
  const [goal, setGoal] = useState<string>('');
  const [audience, setAudience] = useState<string>('University Student');
  const [selectedCitation, setSelectedCitation] = useState<CitationStyle>('APA');

  const handleSubmit = () => {
    if (goal.trim() && !isLoading && !disabled) {
      onGenerate(goal, audience, selectedCitation);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md space-y-4 animate-slide-in">
      <h2 className="text-lg font-semibold text-brand-text flex items-center">
        <SparklesIcon className="h-5 w-5 mr-2 text-brand-blue" />
        Create Research Package
      </h2>

      <div className="space-y-1">
        <label htmlFor="goal" className="block text-sm font-medium text-brand-subtext">Goal / Question</label>
        <textarea
          id="goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g., 'Explain the causes and effects of the 2008 financial crisis.'"
          className="w-full h-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-lightblue focus:border-transparent transition"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="audience" className="block text-sm font-medium text-brand-subtext">Audience</label>
          <select
            id="audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-lightblue focus:border-transparent transition bg-white"
            disabled={disabled}
          >
            <option>University Student</option>
            <option>High School Student</option>
            <option>Industry Professional</option>
            <option>Curious Layperson</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="citation" className="block text-sm font-medium text-brand-subtext">Citation Style</label>
          <select
            id="citation"
            value={selectedCitation}
            onChange={(e) => setSelectedCitation(e.target.value as CitationStyle)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-lightblue focus:border-transparent transition bg-white"
            disabled={disabled}
          >
            {citationStyles.map(style => <option key={style}>{style}</option>)}
          </select>
        </div>
      </div>
      
      <button
        onClick={handleSubmit}
        disabled={isLoading || disabled || !goal.trim()}
        className="w-full flex items-center justify-center px-4 py-3 text-base font-semibold text-white bg-brand-blue rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : 'Generate Package'}
      </button>
    </div>
  );
};
