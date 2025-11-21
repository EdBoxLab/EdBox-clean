import React from 'react';
import type { GenieReaction } from '../types';

interface GenieAvatarProps {
  reaction: GenieReaction;
  isActive: boolean;
}

const reactionEmojis: Record<GenieReaction, string> = {
  default: '🤖',
  cheer: '🎉',
  wink: '😉',
  hint: '💡',
  hype: '🔥',
  sad: '😥',
};

// Component to inject custom animation keyframes and classes
const CustomAnimations = () => (
    <style>{`
        @keyframes shake {
            0%, 100% { transform: rotate(-3deg); }
            50% { transform: rotate(3deg); }
        }
        .animate-shake {
            animation: shake 0.8s ease-in-out infinite alternate;
        }

        @keyframes wink {
            0%, 80%, 100% { transform: scale(1); }
            90% { transform: scale(1.15); }
        }
        .animate-wink {
            animation: wink 1.5s ease-in-out infinite;
        }
        
        @keyframes droop {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(5px); }
        }
        .animate-droop {
            animation: droop 2.5s ease-in-out infinite;
        }
    `}</style>
);


export const GenieAvatar: React.FC<GenieAvatarProps> = ({ reaction, isActive }) => {
  const emoji = reactionEmojis[reaction] || '🤖';

  const getAnimationClass = (reaction: GenieReaction): string => {
    if (!isActive) return '';
    switch (reaction) {
      case 'cheer':
        return 'animate-bounce';
      case 'hint':
        return 'animate-shake';
      case 'wink':
        return 'animate-wink';
      case 'hype':
        // Use a faster pulse than the Tailwind default
        return 'animate-pulse [animation-duration:1s]';
      case 'sad':
        return 'animate-droop';
      default:
        return '';
    }
  };

  const animationClass = getAnimationClass(reaction);

  return (
    <>
      <CustomAnimations />
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-purple-600 flex items-center justify-center text-2xl sm:text-3xl shadow-lg transition-transform duration-500 ${animationClass}`}>
        <span className="transform transition-transform duration-300" style={{transform: isActive ? 'scale(1.2)' : 'scale(1)'}}>{emoji}</span>
      </div>
    </>
  );
};