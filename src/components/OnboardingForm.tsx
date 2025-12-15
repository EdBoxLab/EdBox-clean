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
  }, []); // Fixed: removed supabase.auth dependency

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          country: formData.country,
          education: formData.education,
          age: parseInt(formData.age, 10),
          interests: formData.interests,
          goal: formData.goal,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        alert('Failed to save profile. Please try again.');
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-zinc-800/50 overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1.5 bg-zinc-800">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: '25%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-8 sm:p-12">
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
                      <button
                        key={level}
                        onClick={() => setFormData({ ...formData, education: level })}
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
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-4">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    What interests you? (Select multiple)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {interestOptions.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => handleInterestToggle(interest)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          formData.interests.includes(interest)
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-zinc-700 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <span className="text-sm font-medium">{interest}</span>
                      </button>
                    ))}
                  </div>
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
                      <button
                        key={goal}
                        onClick={() => setFormData({ ...formData, goal })}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          formData.goal === goal
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-zinc-700 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{goal}</span>
                          {formData.goal === goal && (
                            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition"
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition shadow-lg shadow-indigo-500/30"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStepValid() || isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition shadow-lg shadow-indigo-500/30"
              >
                {isSubmitting ? 'Saving...' : 'Get Started'}
                <Sparkles className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}