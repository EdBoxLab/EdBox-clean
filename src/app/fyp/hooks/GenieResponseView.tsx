import React, { useState, useEffect } from 'react';
import type { FeedItem } from '../types';
import { CloseIcon, SpinnerIcon } from '../MediaIcons';
import { GenieAvatar } from './GenieAvatar';

interface GenieResponseViewProps {
  item: FeedItem;
  explanation: string;
  isLoading: boolean;
  onClose: () => void;
}

export const GenieResponseView: React.FC<GenieResponseViewProps> = ({ item, explanation, isLoading, onClose }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300); // Wait for animation
    }

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const animationClass = isClosing ? 'animate-slide-out-bottom' : 'animate-slide-in-bottom';

    return (
        <>
        <style>{`
            @keyframes slide-in-bottom {
                0% { transform: translateY(100%); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
            }
            .animate-slide-in-bottom {
                animation: slide-in-bottom 0.3s ease-out forwards;
            }
            @keyframes slide-out-bottom {
                0% { transform: translateY(0); opacity: 1; }
                100% { transform: translateY(100%); opacity: 0; }
            }
            .animate-slide-out-bottom {
                animation: slide-out-bottom 0.3s ease-in forwards;
            }
        `}</style>
        <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={handleClose}
        ></div>
        <div className={`absolute bottom-0 left-0 right-0 h-[60%] sm:h-[55%] bg-gray-900 border-t-2 border-purple-500/50 text-white rounded-t-3xl z-50 flex flex-col ${animationClass}`}>
            <div className="p-3 sm:p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="scale-75 sm:scale-100">
                        <GenieAvatar reaction="hint" isActive={true} />
                    </div>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold truncate pr-4 sm:pr-8">Genie's Explanation</h2>
                </div>
                <button onClick={handleClose} className="p-1.5 sm:p-2 rounded-full hover:bg-white/10">
                    <CloseIcon />
                </button>
            </div>
            <div className="p-3 sm:p-4 md:p-6 flex-grow overflow-y-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <SpinnerIcon />
                        <p className="mt-3 sm:mt-4 text-gray-400 text-sm sm:text-base">Genie is thinking...</p>
                    </div>
                ) : (
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                        {explanation}
                    </p>
                )}
            </div>
        </div>
        </>
    );
};
