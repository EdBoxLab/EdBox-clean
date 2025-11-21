
import React, { useState, useEffect, useRef } from 'react';
import type { ArticleFeedItem, AudioGenerationState } from '../types';
import { CloseIcon, SpinnerIcon, ListenIcon, PauseIcon, VideoErrorIcon } from '../MediaIcons';
import { InteractiveArticleContent } from './InteractiveArticleContent';
import { GoogleGenAI, Modality } from '@google/genai';

interface ArticleViewProps {
  item: ArticleFeedItem;
  onClose: () => void;
  onApiKeyError: () => void;
}

const isApiKeyError = (error: any): boolean => {
  if (!error) return false;
  if (error.message === 'API_KEY_NOT_FOUND') return true;

  let errorMessage;
  if (error.message) {
    errorMessage = error.message;
  } else {
    try {
      errorMessage = JSON.stringify(error);
    } catch {
      errorMessage = String(error);
    }
  }
  
  return errorMessage.includes('Requested entity was not found.');
};


// Audio decoding helpers from @google/genai documentation
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


export const ArticleView: React.FC<ArticleViewProps> = ({ item, onClose, onApiKeyError }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [progress, setProgress] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);

    const [audioState, setAudioState] = useState<AudioGenerationState>('idle');
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const handleScroll = () => {
        if (contentRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            const totalScrollableHeight = scrollHeight - clientHeight;
            if (totalScrollableHeight > 0) {
                const scrollProgress = (scrollTop / totalScrollableHeight) * 100;
                setProgress(scrollProgress);
            } else {
                setProgress(100); // If content is not scrollable, it's 100% read
            }
        }
    };

    const cleanContentForTTS = (content: string) => {
        if (!content) return ''; // Gracefully handle missing content to prevent crashes
        return content
          .replace(/{([^|]+?)\|[^}]+?}/g, '$1') // Keep the term, remove definition
          .replace(/\[QUIZ:[^\]]+?\]/g, '');    // Remove quiz blocks
    };
    
    const playAudio = (buffer: AudioBuffer) => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setIsPlaying(false);
            audioSourceRef.current = null;
        };
        source.start();
        audioSourceRef.current = source;
        setIsPlaying(true);
    };
    
    const stopAudio = () => {
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            audioSourceRef.current = null;
            setIsPlaying(false);
        }
    };
    
    const generateAudio = async () => {
        setAudioState('generating');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const textToSpeak = cleanContentForTTS(item.full_article_content);
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: textToSpeak }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) {
                throw new Error("No audio data received from API");
            }
            
            const decodingContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const decodedBytes = decode(base64Audio);
            const newAudioBuffer = await decodeAudioData(decodedBytes, decodingContext, 24000, 1);
            decodingContext.close();
            
            setAudioBuffer(newAudioBuffer);
            setAudioState('ready');
            playAudio(newAudioBuffer);

        } catch (error) {
            console.error("Failed to generate full article audio:", error);
            if (isApiKeyError(error)) {
                onApiKeyError();
                onClose();
            } else {
                setAudioState('error');
            }
        }
    };

    const handleListenClick = () => {
        if (isPlaying) {
            stopAudio();
            return;
        }
        if (audioBuffer) {
            playAudio(audioBuffer);
        } else if (audioState === 'idle' || audioState === 'error') {
            generateAudio();
        }
    };

    const handleClose = () => {
        setIsClosing(true);
        stopAudio();
        setTimeout(onClose, 300); // Wait for animation
    }

    // Handle escape key and cleanup
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            // Cleanup audio on unmount
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        }
    }, []);

    const renderListenButtonIcon = () => {
        if (audioState === 'generating') {
            return <SpinnerIcon />;
        }
        if (audioState === 'error') {
            return <VideoErrorIcon />;
        }
        if (isPlaying) {
            return <PauseIcon className="h-6 w-6" />;
        }
        return <ListenIcon className="h-6 w-6" />;
    };

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
        <div className={`absolute bottom-0 left-0 right-0 h-[90%] sm:h-[85%] bg-gray-800 text-white rounded-t-3xl z-50 flex flex-col ${animationClass}`}>
            <div className="p-3 sm:p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 flex-grow min-w-0">
                    <button
                        onClick={handleListenClick}
                        disabled={audioState === 'generating'}
                        className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 disabled:opacity-50 disabled:cursor-wait"
                        aria-label="Listen to article"
                        >
                        <span className="scale-75 sm:scale-100 inline-block">{renderListenButtonIcon()}</span>
                    </button>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold truncate">{item.title}</h2>
                </div>
                <button onClick={handleClose} className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 flex-shrink-0 ml-2">
                    <CloseIcon />
                </button>
            </div>
            <div className="relative h-1 bg-gray-700 flex-shrink-0">
                <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-indigo-400"
                    style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
                />
            </div>
            <div ref={contentRef} onScroll={handleScroll} className="p-3 sm:p-4 md:p-6 flex-grow overflow-y-auto">
                <InteractiveArticleContent content={item.full_article_content} />
            </div>
        </div>
        </>
    );
};
