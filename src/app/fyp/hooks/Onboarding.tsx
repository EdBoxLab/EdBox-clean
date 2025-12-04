'use client';

import React, { useState } from 'react';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';

interface UserPreferences {
  interests: string[];
  learningStyle: 'visual' | 'auditory' | 'theoretical';
  onboarded: boolean;
}

interface OnboardingProps {
  onComplete: (prefs: UserPreferences) => void;
}

const TOPICS = [
  "Astrophysics", "Startups", "Psychology", "Philosophy",
  "AI Revolution", "Biology", "Art History", "Crypto",
  "Productivity", "Neuroscience", "Cinema", "Design",
  "Science", "History", "Technology", "Mathematics",
  "Literature", "Music", "Business", "Health",
  "Environment", "Space", "Culture", "Sports"
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleTopic = (topic: string) => {
    if (selected.includes(topic)) {
      setSelected(selected.filter(t => t !== topic));
    } else {
      setSelected([...selected, topic]);
    }
  };

  const handleFinish = async () => {
    if (selected.length >= 5 && !saving) {
      setSaving(true);
      try {
        await onComplete({
          interests: selected,
          learningStyle: 'visual',
          onboarded: true
        });
      } catch (error) {
        console.error('Error completing onboarding:', error);
        setSaving(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted via-background to-background">
      <div className="w-full max-w-md">
        <div className="mb-6 sm:mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-primary to-primary/80 mb-4 sm:mb-6 shadow-lg">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 sm:mb-3 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground">
            Welcome to EdBox
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">What sparks your curiosity today?</p>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2">Select at least 5 topics</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-10 max-h-[50vh] overflow-y-auto px-1">
          {TOPICS.map(topic => (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 border ${
                selected.includes(topic)
                  ? 'bg-primary text-primary-foreground border-primary/50 scale-105 shadow-lg'
                  : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground active:scale-95'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        <button
          onClick={handleFinish}
          disabled={selected.length < 5 || saving}
          className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center space-x-2 transition-all duration-300 ${
            selected.length >= 5 && !saving
              ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg transform hover:scale-[1.02] active:scale-95'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              <span className="text-sm sm:text-base">Saving...</span>
            </>
          ) : (
            <>
              <span className="text-sm sm:text-base">Start Learning</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </>
          )}
        </button>

        <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground px-2">
          {selected.length < 5 
            ? `Select ${5 - selected.length} more topic${5 - selected.length !== 1 ? 's' : ''} to continue`
            : 'EdBox uses AI to generate mind-blowing content just for you.'}
        </p>
      </div>
    </div>
  );
};

export default Onboarding;