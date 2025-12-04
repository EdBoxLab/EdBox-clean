'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import type { Lesson, UserPreferences } from '@/types/feed';
import { generateLessonBatch, generateLessonImage, generateLessonAudio } from '@/services/feedService';
import LessonCard from './LessonCard';

interface FeedProps {
  preferences: UserPreferences;
}

const Feed: React.FC<FeedProps> = ({ preferences }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedTopics, setLikedTopics] = useState<string[]>([]); // Algorithm memory
  const feedRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processingRef = useRef(false);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const handleLikeToggle = (lessonId: string, topic: string, isLiked: boolean) => {
    setLessons(prev => prev.map(l => {
      if (l.id === lessonId) {
        return {
          ...l,
          likedByUser: isLiked,
          likes: isLiked ? l.likes + 1 : l.likes - 1
        };
      }
      return l;
    }));

    if (isLiked) {
      setLikedTopics(prev => [...prev, topic]);
    }
  };

  const loadMoreLessons = useCallback(async (initial = false) => {
    if (processingRef.current) return;
    
    processingRef.current = true;
    if (initial) setLoading(true);

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const lessonBatchRaw = await generateLessonBatch(preferences.interests, likedTopics);
      
      const newLessons: Lesson[] = lessonBatchRaw.map(l => ({
        id: crypto.randomUUID(),
        ...l,
        comments: l.comments || [],
        imageUrl: undefined,
        audioBuffer: undefined
      }));

      const mediaPromises = newLessons.map(async (lesson) => {
        const imagePromise = generateLessonImage(lesson.visualPrompt);
        
        // Only generate audio for video type to save resources/time
        const audioPromise = lesson.type === 'video' && lesson.script
          ? generateLessonAudio(lesson.script, audioContextRef.current!)
          : Promise.resolve(undefined);

        const [imageUrl, audioBuffer] = await Promise.all([imagePromise, audioPromise]);
        
        return { ...lesson, imageUrl, audioBuffer };
      });

      const processedLessons = await Promise.all(mediaPromises);
      
      setLessons(prev => [...prev, ...processedLessons]);
    } catch (err) {
      console.error("Failed to load lessons", err);
    } finally {
      processingRef.current = false;
      setLoading(false);
    }
  }, [preferences.interests, likedTopics]);

  useEffect(() => {
    loadMoreLessons(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lessons.length > 0 && activeIndex >= lessons.length - 2 && !loading && !processingRef.current) {
      loadMoreLessons();
    }
  }, [activeIndex, lessons.length, loading, loadMoreLessons]);

  const handleScroll = () => {
    if (feedRef.current) {
      const index = Math.round(feedRef.current.scrollTop / window.innerHeight);
      if (index !== activeIndex) {
        setActiveIndex(index);
      }
    }
  };

  if (loading && lessons.length === 0) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-light tracking-widest uppercase text-muted-foreground">Curating your feed...</h2>
      </div>
    );
  }

  return (
    <div
      ref={feedRef}
      onScroll={handleScroll}
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-background"
    >
      {lessons.map((lesson, index) => (
        <div key={lesson.id} className="h-screen w-full snap-center relative">
          <LessonCard
            lesson={lesson}
            isActive={index === activeIndex}
            onInteract={initAudio}
            audioContext={audioContextRef.current}
            onLikeToggle={(isLiked) => handleLikeToggle(lesson.id, lesson.topic, isLiked)}
          />
        </div>
      ))}
      <div className="h-24 w-full flex items-center justify-center snap-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
};

export default Feed;