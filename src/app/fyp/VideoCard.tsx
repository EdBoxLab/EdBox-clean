/*
import React, { useState, useRef, useEffect } from 'react';
import type { VideoFeedItem } from './types';
import { PlayIcon, SpinnerIcon, VideoErrorIcon } from './MediaIcons';
import { SkeletonLoader } from './hooks/SkeletonLoader';

interface VideoCardProps {
  item: VideoFeedItem;
  isActive: boolean;
  onSwipe: (id: string, action: 'skip') => void;
}

const generatingMessages = [
    "Scripting your video...",
    "Casting digital actors...",
    "Setting up the virtual scene...",
    "Action! Filming the main shots...",
    "Rendering frame 1 of 120...",
    "Applying special effects...",
    "Adding a soundtrack...",
    "Finalizing the director's cut...",
];

export const VideoCard: React.FC<VideoCardProps> = ({ item, isActive, onSwipe }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false); // Only true when video is loading, not during generation
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Cycle through generating messages
  useEffect(() => {
    if (item.generationState === 'generating') {
      const interval = setInterval(() => {
        setCurrentMessageIndex(prev => (prev + 1) % generatingMessages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [item.generationState]);


  const handlePlayPause = () => {
    if (item.generationState !== 'ready' || !videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(e => {
        console.error("Video play failed:", e);
        // This is a playback error, not a generation error
      });
    }
  };

  useEffect(() => {
    if (!isActive && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isActive]);

  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);
  const onWaiting = () => setIsBuffering(true);
  const onPlaying = () => setIsBuffering(false);
  const onCanPlay = () => setIsBuffering(false);

  const renderPlaceholder = () => {
    switch (item.placeholderGenerationState) {
        case 'ready':
            return <img src={item.placeholder_image_url} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />;
        case 'generating':
        case 'pending':
            return <SkeletonLoader className="absolute inset-0 w-full h-full" />;
        case 'error':
            return (
                <div className="absolute inset-0 bg-gray-700 flex flex-col items-center justify-center text-center p-2">
                    <VideoErrorIcon />
                    <p className="text-xs text-gray-300 mt-1">Image load error</p>
                </div>
            );
        default:
            return null;
    }
  };

  const renderContent = () => {
    switch (item.generationState) {
        case 'pending':
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 z-20 text-center">
                    <SpinnerIcon />
                    <p className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-white">Queued for Generation</p>
                    <p className="mt-1 text-xs sm:text-sm text-gray-300">Your video will be created shortly.</p>
                </div>
            );
        case 'generating':
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 z-20 text-center">
                    <SpinnerIcon />
                    <p className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-white">Genie is creating your video...</p>
                    <p className="mt-2 text-xs sm:text-sm text-gray-300 h-8 sm:h-10 transition-opacity duration-500 px-2">
                        {generatingMessages[currentMessageIndex]}
                    </p>
                </div>
            );
        case 'error':
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/60 backdrop-blur-sm p-4 z-20 text-center">
                    <VideoErrorIcon />
                    <p className="mt-2 text-sm text-white">Video generation failed.</p>
                     <p className="mt-1 text-xs text-gray-200">This might be an API key issue.</p>
                    <button 
                        onClick={() => onSwipe(item.id, 'skip')}
                        className="mt-4 bg-white/20 text-white font-semibold py-2 px-4 rounded-full text-xs hover:bg-white/30"
                    >
                        Skip Card
                    </button>
                </div>
            );
        case 'ready':
            return (
                <>
                    <video
                      ref={videoRef}
                      src={item.video_url}
                      key={item.video_url} // Force re-render when URL changes
                      loop
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 w-full h-full object-cover"
                      onPlay={onPlay}
                      onPause={onPause}
                      onWaiting={onWaiting}
                      onPlaying={onPlaying}
                      onCanPlay={onCanPlay}
                    />
                    {(isBuffering || (!isPlaying)) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                            {isBuffering ? (
                                <SpinnerIcon />
                            ) : (
                                <div className="text-white bg-black/40 rounded-full p-4 group-hover:scale-110 transition-transform duration-300">
                                    <PlayIcon />
                                </div>
                            )}
                        </div>
                    )}
                </>
            );
    }
  }


  return (
    <div className="w-full text-center flex flex-col items-center justify-center px-2">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 drop-shadow-lg">{item.title}</h2>
      <div 
        className="relative w-full max-w-[90%] sm:max-w-[320px] aspect-[9/16] bg-gray-900 rounded-2xl shadow-lg overflow-hidden flex items-center justify-center group cursor-pointer"
        onClick={handlePlayPause}
      >
        {item.generationState !== 'ready' && renderPlaceholder()}
        {renderContent()}
      </div>
       <p className="mt-6 sm:mt-8 text-gray-300 text-xs sm:text-sm h-5">
        {item.generationState === 'ready' && "Tap video to play/pause"}
       </p>
    </div>
  );
};
*/