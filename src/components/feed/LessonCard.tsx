'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Lesson } from '@/types/feed';
import { cn } from '@/lib/utils';

interface LessonCardProps {
  lesson: Lesson;
  isActive: boolean;
  onInteract: () => void;
  audioContext: AudioContext | null;
  onLikeToggle: (isLiked: boolean) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  isActive,
  onInteract,
  audioContext,
  onLikeToggle,
}) => {
  const [isLiked, setIsLiked] = useState(lesson.likedByUser);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Auto-play audio for video lessons when active
  useEffect(() => {
    if (isActive && lesson.type === 'video' && lesson.audioBuffer && audioContext) {
      playAudio();
    } else {
      stopAudio();
    }
    return () => stopAudio();
  }, [isActive, (lesson as any).audioBuffer]);

  // Auto-advance slides for story type
  useEffect(() => {
    if (isActive && lesson.type === 'story' && (lesson as any).slides) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % (lesson as any).slides!.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isActive, lesson.type, (lesson as any).slides]);

  const playAudio = () => {
    if (!audioContext || !(lesson as any).audioBuffer) return;
    
    onInteract(); // Resume audio context
    
    stopAudio(); // Stop any existing playback
    
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = (lesson as any).audioBuffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = isMuted ? 0 : 1;
    
    source.start(0);
    source.onended = () => setIsPlaying(false);
    
    audioSourceRef.current = source;
    gainNodeRef.current = gainNode;
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const toggleMute = () => {
    if (gainNodeRef.current) {
      const newMuted = !isMuted;
      gainNodeRef.current.gain.value = newMuted ? 0 : 1;
      setIsMuted(newMuted);
    }
  };

  const handleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    onLikeToggle(newLiked);
  };

  const handleQuizAnswer = (index: number) => {
    setSelectedAnswer(index);
    setShowResult(true);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isActive) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = touchY - touchStartY.current;
    
    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
      setSwipeOffset(deltaX);
      
      if (deltaX > 50) {
        setSwipeDirection('right');
      } else if (deltaX < -50) {
        setSwipeDirection('left');
      } else {
        setSwipeDirection(null);
      }
    }
  };

  const handleTouchEnd = () => {
    if (Math.abs(swipeOffset) > 100) {
      if (swipeDirection === 'right' && !isLiked) {
        // Swipe right to like
        handleLike();
      } else if (swipeDirection === 'left') {
        // Swipe left to skip (could trigger next lesson)
        console.log('Skipped lesson');
      }
    }
    
    // Reset swipe state
    setSwipeOffset(0);
    setSwipeDirection(null);
  };

  return (
    <div 
      className="relative w-full h-full bg-background"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${swipeOffset}px)`,
        transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none'
      }}
    >
      {/* Swipe indicators */}
      {swipeDirection === 'right' && (
        <div className="absolute top-1/2 left-8 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-red-500/80 backdrop-blur-sm rounded-full p-4 animate-pulse">
            <Heart className="w-12 h-12 text-white fill-current" />
          </div>
        </div>
      )}
      {swipeDirection === 'left' && (
        <div className="absolute top-1/2 right-8 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-muted/80 backdrop-blur-sm rounded-full p-4 animate-pulse">
            <span className="text-2xl">👎</span>
          </div>
        </div>
      )}
      {/* Background Image */}
      <div className="absolute inset-0">
        {(lesson as any).imageUrl ? (
          <img
            src={(lesson as any).imageUrl}
            alt={lesson.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="relative h-full flex flex-col justify-between p-3 sm:p-4 md:p-6">
        {/* Top Section - Type Badge */}
        <div className="flex justify-between items-start">
          <div className="px-2 sm:px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium backdrop-blur-sm">
            {lesson.type.toUpperCase()}
          </div>
          
          {lesson.type === 'video' && lesson.audioBuffer && (
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMute}
              className="bg-background/50 backdrop-blur-sm hover:bg-background/70"
            >
              {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </Button>
          )}
        </div>

        {/* Middle Section - Lesson Content */}
        <div className="flex-1 flex items-center justify-center px-2 sm:px-4">
          {lesson.type === 'story' && lesson.slides && (
            <div className="text-center space-y-3 sm:space-y-4 max-w-2xl">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                {lesson.slides[currentSlide].text}
              </h3>
              {lesson.slides[currentSlide].visualDetail && (
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                  {lesson.slides[currentSlide].visualDetail}
                </p>
              )}
              <div className="flex gap-1.5 sm:gap-2 justify-center mt-3 sm:mt-4">
                {lesson.slides.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1 rounded-full transition-all",
                      idx === currentSlide ? "w-8 bg-primary" : "w-4 bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {lesson.type === 'infographic' && lesson.points && (
            <div className="space-y-2 sm:space-y-3 max-w-xl w-full">
              {lesson.points.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-card/80 backdrop-blur-sm border border-border"
                >
                  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs sm:text-base">
                    {idx + 1}
                  </div>
                  <p className="text-xs sm:text-sm md:text-base text-card-foreground">{point}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Section - Info & Actions */}
        <div className="space-y-3 sm:space-y-4">
          {/* Lesson Info */}
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
              {lesson.title}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              {(lesson as any).keyTakeaway}
            </p>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-accent/50 text-xs">
                {lesson.topic}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2 sm:gap-4">
              <button
                onClick={handleLike}
                className="flex flex-col items-center gap-0.5 sm:gap-1 group"
              >
                <div className={cn(
                  "p-2 sm:p-3 rounded-full transition-all",
                  isLiked 
                    ? "bg-red-500 text-white" 
                    : "bg-background/50 backdrop-blur-sm hover:bg-background/70"
                )}>
                  <Heart 
                    className={cn("w-5 h-5 sm:w-6 sm:h-6", isLiked && "fill-current")} 
                  />
                </div>
                <span className="text-xs sm:text-sm text-foreground font-medium">
                  {formatNumber(lesson.likes)}
                </span>
              </button>

              <button className="flex flex-col items-center gap-0.5 sm:gap-1 group">
                <div className="p-2 sm:p-3 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-all">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-xs sm:text-sm text-foreground font-medium">
                  {lesson.comments.length}
                </span>
              </button>

              <button className="flex flex-col items-center gap-0.5 sm:gap-1 group">
                <div className="p-2 sm:p-3 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-all">
                  <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <span className="text-xs sm:text-sm text-foreground font-medium">
                  {formatNumber(lesson.shares)}
                </span>
              </button>
            </div>

            <Button
              onClick={() => setShowQuiz(true)}
              variant="default"
              size="sm"
              className="font-semibold text-xs sm:text-sm"
            >
              Take Quiz
            </Button>
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Test Your Knowledge</DialogTitle>
          </DialogHeader>
          
          {(lesson as any).quiz && (
            <div className="space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-base font-medium">{(lesson as any).quiz.question}</p>
              
              <div className="space-y-1.5 sm:space-y-2">
                {(lesson as any).quiz.options.map((option: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleQuizAnswer(idx)}
                    disabled={showResult}
                    className={cn(
                      "w-full p-2 sm:p-3 rounded-lg text-left transition-all border-2",
                      selectedAnswer === idx
                        ? showResult
                          ? idx === (lesson as any).quiz!.correctIndex
                            ? "border-green-500 bg-green-500/10"
                            : "border-red-500 bg-red-500/10"
                          : "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 bg-card"
                    )}
                  >
                    <span className="text-xs sm:text-sm">{option}</span>
                  </button>
                ))}
              </div>

              {showResult && (
                <div className={cn(
                  "p-3 sm:p-4 rounded-lg",
                  selectedAnswer === (lesson as any).quiz.correctIndex
                    ? "bg-green-500/10 text-green-700 dark:text-green-300"
                    : "bg-red-500/10 text-red-700 dark:text-red-300"
                )}>
                  <p className="font-medium text-xs sm:text-sm">
                    {selectedAnswer === (lesson as any).quiz.correctIndex
                      ? "🎉 Correct! Great job!"
                      : `❌ Not quite. The correct answer is: ${(lesson as any).quiz.options[(lesson as any).quiz.correctIndex]}`}
                  </p>
                </div>
              )}

              {showResult && (
                <Button
                  onClick={() => {
                    setShowQuiz(false);
                    setShowResult(false);
                    setSelectedAnswer(null);
                  }}
                  className="w-full"
                >
                  Continue Learning
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonCard;