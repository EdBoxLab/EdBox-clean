
import React, { useState, useRef } from 'react';
import type { FeedItem, Feedback } from '../types';
import { GenieAvatar } from './GenieAvatar';
import { ThumbsUpIcon, ThumbsDownIcon, GenieMagicIcon } from '../MediaIcons';
import { useSounds } from '../useSounds';

interface CardWrapperProps {
  item: FeedItem;
  isActive: boolean;
  onSwipe: (id: string, action: 'skip' | 'got_it' | 'answered', xp?: number) => void;
  children: React.ReactNode;
  onFeedback: (id: string, feedback: Feedback) => void;
  onAskGenie: (item: FeedItem) => void;
  isGenieActive: boolean;
}

const themeClasses: { [key: string]: string } = {
  'purple-gradient': 'from-purple-800 to-indigo-900',
  'blue-gradient': 'from-blue-800 to-cyan-900',
  'green-gradient': 'from-emerald-800 to-teal-900',
  'orange-gradient': 'from-orange-800 to-amber-900',
  'red-gradient': 'from-red-800 to-rose-900',
};

export const CardWrapper: React.FC<CardWrapperProps> = ({ item, isActive, onSwipe, children, onFeedback, onAskGenie, isGenieActive }) => {
  const [translateX, setTranslateX] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeFeedback, setSwipeFeedback] = useState<'got_it' | 'skip' | null>(null);
  const startX = useRef(0);
  const { playSwipe } = useSounds();

  const handleSwipeStart = (clientX: number) => {
    setIsSwiping(true);
    startX.current = clientX;
  };

  const handleSwipeMove = (clientX: number) => {
    if (!isSwiping) return;
    const diff = clientX - startX.current;
    setTranslateX(diff);
  };

  const handleSwipeEnd = () => {
    if (!isSwiping || swipeFeedback) return;
    
    if (translateX > 100) { // Swipe right
      playSwipe();
      setSwipeFeedback('got_it');
      setTimeout(() => {
        setIsSwiping(false); // Enable transition
        setTranslateX(500);
        setOpacity(0);
        setTimeout(() => onSwipe(item.id, 'got_it', item.xp_reward), 300);
      }, 500);
    } else if (translateX < -100) { // Swipe left
      playSwipe();
      setSwipeFeedback('skip');
      setTimeout(() => {
        setIsSwiping(false); // Enable transition
        setTranslateX(-500);
        setOpacity(0);
        setTimeout(() => onSwipe(item.id, 'skip'), 300);
      }, 500);
    } else {
      setIsSwiping(false);
      setTranslateX(0);
      setOpacity(1);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => handleSwipeStart(e.clientX);
  const handleMouseMove = (e: React.MouseEvent) => handleSwipeMove(e.clientX);
  const handleMouseUp = () => handleSwipeEnd();
  const handleMouseLeave = () => handleSwipeEnd();
  
  const handleTouchStart = (e: React.TouchEvent) => handleSwipeStart(e.touches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => handleSwipeMove(e.touches[0].clientX);
  const handleTouchEnd = () => handleSwipeEnd();

  const themeClass = themeClasses[item.theme] || 'from-gray-800 to-gray-900';
  
  const getFeedbackButtonClass = (type: Feedback) => {
    if (item.feedback) {
        if (item.feedback === type) {
            return type === 'like' ? 'text-green-400' : 'text-red-400';
        }
        return 'text-gray-600 cursor-not-allowed';
    }
    return 'text-white hover:bg-white/10';
  };

  const scale = isActive ? 1.01 : 1;

  return (
    <div
      className={`relative h-full w-full flex flex-col justify-between p-3 sm:p-4 md:p-6 text-white bg-gradient-to-br ${themeClass} overflow-hidden rounded-2xl ${isActive ? 'active-card-indicator' : ''}`}
      style={{
        transform: `translateX(${translateX}px) scale(${scale})`,
        opacity: opacity,
        transition: isSwiping ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out, box-shadow 0.3s ease-out',
      }}
      onMouseDown={swipeFeedback ? undefined : handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={swipeFeedback ? undefined : handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
        {swipeFeedback && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 pointer-events-none">
                <div className={`
                    text-xl sm:text-2xl md:text-3xl font-bold border-4 rounded-xl px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 transform shadow-lg
                    ${swipeFeedback === 'got_it' ? 'text-green-300 border-green-300 -rotate-12' : ''}
                    ${swipeFeedback === 'skip' ? 'text-red-400 border-red-400 rotate-12' : ''}
                `}>
                    {swipeFeedback === 'got_it' ? `GOT IT! +${item.xp_reward}` : 'SKIPPED'}
                </div>
            </div>
        )}
        
        {/* Main Content Area */}
        <div className="flex-grow flex flex-col justify-center items-center z-10">
            {children}
        </div>

        {/* Bottom UI */}
        <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 md:bottom-6 md:left-6 md:right-6 flex justify-between items-end gap-2 z-20 pointer-events-none">
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="scale-75 sm:scale-100">
                    <GenieAvatar reaction={item.genie_reaction} isActive={isActive} />
                </div>
                <div className="hidden xs:block">
                    <p className="font-bold text-sm sm:text-base md:text-lg">EdBox FYP</p>
                    <p className="text-xs sm:text-sm text-gray-300">Personalized for you</p>
                </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto">
                <button
                    onClick={() => onFeedback(item.id, 'like')}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    disabled={!!item.feedback}
                    aria-label="Like this content"
                    className={`p-2 rounded-full transition-colors duration-200 ${getFeedbackButtonClass('like')}`}
                >
                    <ThumbsUpIcon filled={item.feedback === 'like'} className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <button
                    onClick={() => onFeedback(item.id, 'dislike')}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    disabled={!!item.feedback}
                    aria-label="Dislike this content"
                    className={`p-2 rounded-full transition-colors duration-200 ${getFeedbackButtonClass('dislike')}`}
                >
                    <ThumbsDownIcon filled={item.feedback === 'dislike'} className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <button
                    onClick={() => onAskGenie(item)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    disabled={!isActive || isGenieActive}
                    aria-label="Ask Genie for details"
                    className={`p-2 rounded-full transition-colors duration-200 ${
                        isActive && !isGenieActive ? 'text-purple-300 hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'
                    }`}
                >
                    <GenieMagicIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                 <div className="bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs md:text-sm rounded-full whitespace-nowrap">
                    +{item.xp_reward} XP
                 </div>
            </div>
        </div>
    </div>
  );
};
