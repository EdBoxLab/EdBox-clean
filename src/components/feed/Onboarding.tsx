import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { UserPreferences } from '@/types/feed';

interface OnboardingProps {
    onComplete: (prefs: UserPreferences) => void;
}

const INTERESTS = [
    'Science', 'History', 'Technology', 'Art', 'Music',
    'Literature', 'Space', 'Nature', 'Psychology', 'Philosophy',
    'Coding', 'Business', 'Math', 'Languages', 'Geography'
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleInterest = (interest: string) => {
        setSelectedInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const handleSubmit = async () => {
        if (selectedInterests.length < 3) return;

        setIsSubmitting(true);
        // Simulate delay or processing if needed
        setTimeout(() => {
            onComplete({
                interests: selectedInterests,
                onboarded: true
            });
            setIsSubmitting(false);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        Welcome to EdBox
                    </h1>
                    <p className="mt-2 text-gray-400">
                        Pick at least 3 topics to personalize your feed.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {INTERESTS.map(interest => (
                        <button
                            key={interest}
                            onClick={() => toggleInterest(interest)}
                            className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${selectedInterests.includes(interest)
                                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                        >
                            {interest}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={selectedInterests.length < 3 || isSubmitting}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${selectedInterests.length >= 3 && !isSubmitting
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-purple-500/25 shadow-lg transform hover:-translate-y-1'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Get Started'}
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
