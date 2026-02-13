'use client';

import { useState, useCallback } from 'react';
import type { 
  DetectedChapter, 
  ChapterDetectionResult, 
  ChapterContent,
  DocumentAnalysis,
  ChapterRecommendations
} from '@/types/chapters';

interface UseChapterDetectionOptions {
  onDetectionComplete?: (result: ChapterDetectionResult) => void;
  onGenerationComplete?: (chapters: ChapterContent[]) => void;
  onError?: (error: string) => void;
}

interface ChapterDetectionState {
  isDetecting: boolean;
  isGenerating: boolean;
  detectionResult: ChapterDetectionResult | null;
  editedChapters: DetectedChapter[] | null;
  generatedChapters: ChapterContent[] | null;
  error: string | null;
  currentStep: 'idle' | 'detecting' | 'reviewing' | 'generating' | 'complete';
  generationProgress: Record<string, number>;
}

export function useChapterDetection(options: UseChapterDetectionOptions = {}) {
  const [state, setState] = useState<ChapterDetectionState>({
    isDetecting: false,
    isGenerating: false,
    detectionResult: null,
    editedChapters: null,
    generatedChapters: null,
    error: null,
    currentStep: 'idle',
    generationProgress: {}
  });

  const detectChapters = useCallback(async (
    text: string,
    detectionOptions?: {
      minChapters?: number;
      maxChapters?: number;
      minChapterLength?: number;
    }
  ) => {
    setState(prev => ({
      ...prev,
      isDetecting: true,
      error: null,
      currentStep: 'detecting'
    }));

    try {
      const response = await fetch('/api/study-kit/detect-chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          options: detectionOptions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chapter detection failed');
      }

      const result: ChapterDetectionResult = await response.json();

      setState(prev => ({
        ...prev,
        isDetecting: false,
        detectionResult: result,
        editedChapters: result.chapters,
        currentStep: 'reviewing'
      }));

      options.onDetectionComplete?.(result);
      return result;

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isDetecting: false,
        error: error.message,
        currentStep: 'idle'
      }));
      options.onError?.(error.message);
      return null;
    }
  }, [options]);

  const detectChaptersFromFile = useCallback(async (
    fileContent: string,
    fileName: string,
    fileType: string,
    detectionOptions?: {
      minChapters?: number;
      maxChapters?: number;
      minChapterLength?: number;
    }
  ) => {
    setState(prev => ({
      ...prev,
      isDetecting: true,
      error: null,
      currentStep: 'detecting'
    }));

    try {
      const response = await fetch('/api/study-kit/detect-chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileContent,
          fileName,
          fileType,
          options: detectionOptions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Chapter detection failed');
      }

      const result: ChapterDetectionResult = await response.json();

      setState(prev => ({
        ...prev,
        isDetecting: false,
        detectionResult: result,
        editedChapters: result.chapters,
        currentStep: 'reviewing'
      }));

      options.onDetectionComplete?.(result);
      return result;

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isDetecting: false,
        error: error.message,
        currentStep: 'idle'
      }));
      options.onError?.(error.message);
      return null;
    }
  }, [options]);

  const updateChapters = useCallback((chapters: DetectedChapter[]) => {
    setState(prev => ({
      ...prev,
      editedChapters: chapters
    }));
  }, []);

  const generateChapterContent = useCallback(async (
    contentTypes: string[],
    itemCount?: number,
    title?: string,
    sourceContent?: string
  ) => {
    const { editedChapters, detectionResult } = state;

    if (!editedChapters || editedChapters.length === 0) {
      const error = 'No chapters to generate content for';
      setState(prev => ({ ...prev, error }));
      options.onError?.(error);
      return null;
    }

    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
      currentStep: 'generating',
      generationProgress: {}
    }));

    try {
      const response = await fetch('/api/study-kit/generate-chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapters: editedChapters,
          documentAnalysis: detectionResult?.documentAnalysis,
          contentTypes,
          itemCount,
          title,
          sourceContent
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Content generation failed');
      }

      const result = await response.json();

      setState(prev => ({
        ...prev,
        isGenerating: false,
        generatedChapters: result.content.chapters,
        currentStep: 'complete'
      }));

      options.onGenerationComplete?.(result.content.chapters);
      return result;

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error.message,
        currentStep: 'reviewing'
      }));
      options.onError?.(error.message);
      return null;
    }
  }, [state, options]);

  const reset = useCallback(() => {
    setState({
      isDetecting: false,
      isGenerating: false,
      detectionResult: null,
      editedChapters: null,
      generatedChapters: null,
      error: null,
      currentStep: 'idle',
      generationProgress: {}
    });
  }, []);

  const backToReview = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'reviewing',
      error: null
    }));
  }, []);

  return {
    ...state,
    detectChapters,
    detectChaptersFromFile,
    updateChapters,
    generateChapterContent,
    reset,
    backToReview
  };
}
