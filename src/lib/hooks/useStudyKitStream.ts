'use client';

import { useState, useCallback, useRef } from 'react';

interface StreamEvent {
  event: string;
  data: any;
}

interface StreamState {
  isStreaming: boolean;
  progress: {
    current: number;
    total: number;
    currentItem: string;
    estimatedSeconds?: number;
    types?: string[];
  };
  partialContent: any;
  error: string | null;
}

interface UseStudyKitStreamOptions {
  onContent?: (type: string, content: any) => void;
  onChapterComplete?: (chapterIndex: number, chapterTitle: string) => void;
  onComplete?: (id: string, title: string) => void;
  onError?: (error: string) => void;
}

export function useStudyKitStream(options: UseStudyKitStreamOptions = {}) {
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    progress: { current: 0, total: 0, currentItem: '' },
    partialContent: {},
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const parseSSE = (text: string): StreamEvent[] => {
    const events: StreamEvent[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const jsonStr = line.slice(6);
          const parsed = JSON.parse(jsonStr);
          events.push(parsed);
        } catch (e) {
          console.warn('Failed to parse SSE event:', line);
        }
      }
    }

    return events;
  };

  const streamGenerate = useCallback(async (requestData: {
    prompt?: string;
    contentTypes?: string[];
    itemCount?: number;
    notesDepth?: string;
    fileName?: string;
    fileContent?: string;
    fileType?: string;
    chapters?: any[];
    useChapters?: boolean;
  }) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState({
      isStreaming: true,
      progress: { current: 0, total: 0, currentItem: 'Starting...' },
      partialContent: {},
      error: null,
    });

    try {
      const response = await fetch('/api/study-kit/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Stream request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      const accumulatedContent: any = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = parseSSE(buffer);
        buffer = '';

        for (const event of events) {
          switch (event.event) {
            case 'plan':
              setState(prev => ({
                ...prev,
                progress: {
                  current: 0,
                  total: event.data.types?.length || 0,
                  currentItem: event.data.message || 'Preparing...',
                  estimatedSeconds: event.data.estimatedSeconds,
                  types: event.data.types,
                }
              }));
              break;

            case 'start':
              setState(prev => ({
                ...prev,
                progress: { ...prev.progress, currentItem: event.data.message }
              }));
              break;

            case 'chapters_detected':
              setState(prev => ({
                ...prev,
                progress: { ...prev.progress, total: event.data.count }
              }));
              break;

            case 'content':
            case 'chapter_content':
              const { type, content, chapterIndex, chapterTitle } = event.data;

              if (type.startsWith('notes/')) {
                const noteType = type.split('/')[1];
                if (!accumulatedContent.notes) accumulatedContent.notes = {};
                accumulatedContent.notes[noteType] = content;
              } else {
                accumulatedContent[type] = content;
              }

              setState(prev => ({
                ...prev,
                partialContent: { ...accumulatedContent },
                progress: {
                  ...prev.progress,
                  current: (prev.progress.current || 0) + 1,
                  currentItem: chapterTitle
                    ? `${chapterTitle}: ${type}`
                    : type
                }
              }));

              options.onContent?.(type, content);
              break;

            case 'chapter_complete':
              options.onChapterComplete?.(event.data.chapterIndex, event.data.chapterTitle);
              break;

            case 'complete':
              setState(prev => ({
                ...prev,
                isStreaming: false,
                progress: { ...prev.progress, currentItem: 'Complete!' }
              }));
              options.onComplete?.(event.data.id, event.data.title);
              break;

            case 'error':
              setState(prev => ({
                ...prev,
                isStreaming: false,
                error: event.data.message
              }));
              options.onError?.(event.data.message);
              break;
          }
        }
      }

      return accumulatedContent;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted');
        return;
      }

      const errorMessage = error.message || 'Stream failed';
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: errorMessage
      }));
      options.onError?.(errorMessage);
      throw error;
    }
  }, [options]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isStreaming: false,
      error: 'Stream aborted'
    }));
  }, []);

  return {
    ...state,
    streamGenerate,
    abort,
  };
}
