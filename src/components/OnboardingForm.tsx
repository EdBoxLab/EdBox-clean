'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, GraduationCap, MapPin, Calendar, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function OnboardingForm() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    country: '',
    education: '',
    age: '',
    interests: [] as string[],
    goal: ''
  });

  const educationLevels = [
    'High School',
    'Undergraduate',
    'Graduate',
    'Professional',
    'Self-Learner'
  ];

  const interestOptions = [
    'Mathematics',
    'Science',
    'Technology',
    'Languages',
    'Arts',
    'Business',
    'History',
    'Literature'
  ];

  const goalOptions = [
    'Prepare for exams',
    'Learn new skills',
    'Career advancement',
    'Personal growth',
    'Academic research'
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleEducationSelect = (level: string) => {
    setFormData({ ...formData, education: level });
    // Auto-advance after a brief delay for visual feedback
    setTimeout(() => {
      setStep(3);
    }, 300);
  };

  const handleGoalSelect = (goal: string) => {
    setFormData({ ...formData, goal });
    // Auto-submit after selection
    setTimeout(() => {
      handleSubmit();
    }, 300);
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // 🔥 THIS IS WHERE DATA GETS SENT TO SUPABASE DATABASE 🔥
  const handleSubmit = async () => {
    if (!user || isSubmitting) return;

    // Validate before submitting
    if (!formData.goal) return;

    setIsSubmitting(true);

    try {
      // THIS UPDATES THE 'profiles' TABLE IN SUPABASE
      const { error } = await supabase
        .from('profiles')              // Table name in your Supabase database
        .update({                      // SQL UPDATE operation
          country: formData.country,   // Column: country
          education: formData.education, // Column: education
          age: parseInt(formData.age, 10), // Column: age (converted to integer)
          interests: formData.interests,   // Column: interests (array)
          goal: formData.goal,            // Column: goal
          onboarding_completed: true,     // Column: onboarding_completed (boolean flag)
        })
        .eq('id', user.id);           // WHERE id = user.id (only update this user's row)

      if (error) {
        console.error('Error updating profile:', error);
        alert('Failed to save profile. Please try again.');
        setIsSubmitting(false);
      } else {
        // Successfully saved - redirect to home page
        router.push('/');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.country.trim() !== '' && formData.age !== '' && parseInt(formData.age) >= 10 && parseInt(formData.age) <= 100;
      case 2:
        return formData.education !== '';
      case 3:
        return formData.interests.length > 0;
      case 4:
        return formData.goal !== '';
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-indigo-950 to-zinc-950 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* 🔥 FIXED: Added max-h and overflow-y-auto for scrollability */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-zinc-800/50 overflow-hidden flex flex-col"
      >
        {/* Progress bar */}
        <div className="h-1.5 bg-zinc-800 flex-shrink-0">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: '25%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* 🔥 FIXED: Made content area scrollable */}
        <div className="p-8 sm:p-12 overflow-y-auto flex-1">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/50"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Welcome to EdBox
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              Let's personalize your learning experience
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step ? 'w-8 bg-indigo-500' :
                  s < step ? 'w-2 bg-indigo-500/50' :
                  'w-2 bg-zinc-700'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-3">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                      Where are you from?
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="e.g., United States, Nigeria, India"
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && isStepValid()) {
                          handleNext();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-3">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      How old are you?
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="Your age"
                      min="10"
                      max="100"
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && isStepValid()) {
                          handleNext();
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-4">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    What's your education level?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {educationLevels.map((level) => (
                      <motion.button
                        key={level}
                        onClick={() => handleEducationSelect(level)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          formData.education === level
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-zinc-700 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{level}</span>
                          {formData.education === level && (
                            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-4">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    What interests you? (Select at least one)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {interestOptions.map((interest) => (
                      <motion.button
                        key={interest}
                        onClick={() => handleInterestToggle(interest)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          formData.interests.includes(interest)
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-zinc-700 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <span className="text-sm font-medium">{interest}</span>
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-zinc-500 text-xs mt-3 text-center">
                    Selected: {formData.interests.length} {formData.interests.length === 1 ? 'interest' : 'interests'}
                  </p>
                </div>
              )}

              {step === 4 && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    What's your primary goal?
                  </label>
                  <div className="space-y-3">
                    {goalOptions.map((goal) => (
                      <motion.button
                        key={goal}
                        onClick={() => handleGoalSelect(goal)}
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          formData.goal === goal
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-zinc-700 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600'
                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{goal}</span>
                          {formData.goal === goal && (
                            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  {isSubmitting && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-indigo-400 text-sm mt-4 text-center flex items-center justify-center gap-2"
                    >
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.span>
                      Setting up your experience...
                    </motion.p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && step < 4 && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition"
              >
                Back
              </button>
            )}
            {step === 1 && (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition shadow-lg shadow-indigo-500/30"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition shadow-lg shadow-indigo-500/30"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}