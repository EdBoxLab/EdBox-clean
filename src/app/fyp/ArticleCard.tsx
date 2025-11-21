
import React, { useState, useEffect, useRef } from 'react';
import type { ArticleFeedItem, AudioGenerationState } from './types';
import { BookOpenIcon, BookmarkIcon, ListenIcon, PauseIcon, SpinnerIcon, VideoErrorIcon } from './MediaIcons';
import { CardImage } from './CardImage';

interface ArticleCardProps {
  item: ArticleFeedItem;
  onViewArticle: (item: ArticleFeedItem) => void;
  audioState?: { state: AudioGenerationState; buffer?: AudioBuffer };
  onGenerateAudio: () => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ item, onViewArticle, audioState, onGenerateAudio }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try {
      const savedArticles = JSON.parse(localStorage.getItem('savedArticles') || '[]');
      setIsSaved(savedArticles.includes(item.id));
    } catch (e) {
      console.error("Failed to parse saved articles from localStorage", e);
      setIsSaved(false);
    }
  }, [item.id]);

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    };
  }, []);

  const handleSaveToggle = () => {
    try {
      const savedArticles = JSON.parse(localStorage.getItem('savedArticles') || '[]');
      const isCurrentlySaved = savedArticles.includes(item.id);
      
      let newSavedArticles;
      if (isCurrentlySaved) {
        newSavedArticles = savedArticles.filter((id: string) => id !== item.id);
      } else {
        newSavedArticles = [...savedArticles, item.id];
      }
      
      localStorage.setItem('savedArticles', JSON.stringify(newSavedArticles));
      setIsSaved(!isCurrentlySaved);
    } catch (e) {
      console.error("Failed to update saved articles in localStorage", e);
    }
  };

  const handleListenClick = () => {
    // Stop playing
    if (isPlaying) {
      audioSourceRef.current?.stop();
      audioSourceRef.current = null;
      setIsPlaying(false);
      return;
    }

    // Generate audio if not available
    if (!audioState || audioState.state === 'idle' || audioState.state === 'error') {
        onGenerateAudio();
        return;
    }
    
    // Play audio if ready
    if (audioState.state === 'ready' && audioState.buffer) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            // FIX: Cast window to `any` to support `webkitAudioContext` for older browsers without TypeScript errors.
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioState.buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setIsPlaying(false);
            audioSourceRef.current = null;
        };
        source.start();
        audioSourceRef.current = source;
        setIsPlaying(true);
    }
  };

  const renderListenButtonIcon = () => {
      const state = audioState?.state;
      if (state === 'generating') {
        return <SpinnerIcon />;
      }
      if (state === 'error') {
        return <VideoErrorIcon />;
      }
      if (isPlaying) {
        return <PauseIcon />;
      }
      return <ListenIcon />;
  };

  return (
    <div className="w-full text-center flex flex-col justify-center items-center h-full">
       {item.imageGenerationState && (
        <div className="w-full max-w-[90%] sm:max-w-sm mb-4 sm:mb-6 rounded-xl overflow-hidden shadow-lg">
          <CardImage 
            generationState={item.imageGenerationState}
            imageUrl={item.image_url}
            altText={item.title}
          />
        </div>
      )}

      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 drop-shadow-lg px-2">{item.title}</h2>
      <p className="text-gray-200 max-w-md leading-relaxed text-sm sm:text-base md:text-lg bg-black/20 p-3 sm:p-4 md:p-6 rounded-xl mx-2">
        {item.summary}
      </p>
      <div className="mt-8 flex flex-col items-center space-y-4">
        <button 
            onClick={() => onViewArticle(item)} 
            className="inline-flex items-center space-x-2 text-purple-300 font-semibold py-2 px-4 rounded-full hover:bg-white/10 transition"
        >
          <BookOpenIcon />
          <span>Tap to Read More</span>
        </button>

        <div className="flex items-center space-x-2">
            <button
            onClick={handleListenClick}
            disabled={audioState?.state === 'generating'}
            className={`inline-flex items-center justify-center space-x-2 font-semibold py-2 px-4 rounded-full transition-colors duration-200 text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-wait`}
            >
                {renderListenButtonIcon()}
                <span>{isPlaying ? 'Stop' : 'Listen'}</span>
            </button>
            <button
            onClick={handleSaveToggle}
            className={`inline-flex items-center space-x-2 font-semibold py-2 px-4 rounded-full transition-colors duration-200 ${
                isSaved 
                ? 'bg-green-500/20 text-green-300' 
                : 'text-gray-300 hover:bg-white/10'
            }`}
            >
            <BookmarkIcon filled={isSaved} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
        </div>
      </div>
    </div>
  );
};
