import React, { useState, useEffect, useRef } from 'react';
import type { ResearchPackage, TieredSummary, GeneratedAudio, GeneratedImage, Flashcard, QuizItem, Citation, Source } from './types';
import { SummaryIcon, AudioIcon, ImageIcon, FlashcardIcon, QuizIcon, ChevronDownIcon, FileIcon, TextIcon, BookOpenIcon, PlayIcon, PauseIcon, RotateCwIcon, Volume2Icon, SquareIcon } from './icons';

// --- AUDIO DECODING HELPERS (as per Gemini API spec) ---
function decodeBase64(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodePcmAudio(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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


// --- ATOMIC COMPONENTS ---

export const CitationView: React.FC<{ citation: Citation }> = ({ citation }) => (
    <div className="group relative inline-block">
        <span className="text-brand-lightblue font-semibold cursor-pointer text-xs align-super">[{citation.source_id}]</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-72 mb-2 p-3 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20 shadow-lg">
            <p className="border-b border-gray-600 pb-2 mb-2 font-semibold">{citation.source_id}</p>
            <p className="italic">"{citation.quote}"</p>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-800"></div>
        </div>
    </div>
);


// --- OUTPUT RENDERERS ---

export const SummaryRenderer: React.FC<{ data: TieredSummary }> = ({ data }) => (
    <div className="space-y-4">
        <div>
            <h4 className="font-semibold text-lg mb-1">One-Sentence Summary</h4>
            <p className="text-brand-subtext">{data.one_sentence}</p>
        </div>
        <div className="pt-4 border-t">
            <h4 className="font-semibold text-lg mb-1">One-Paragraph Summary</h4>
            <p className="text-brand-subtext leading-relaxed">{data.one_paragraph}</p>
        </div>
        <div className="pt-4 border-t">
            <h4 className="font-semibold text-lg mb-1">Full-Page Summary</h4>
            <div className="prose max-w-none text-brand-subtext leading-relaxed whitespace-pre-wrap">{data.one_page}</div>
        </div>
    </div>
);

export const AudioRenderer: React.FC<{ data: GeneratedAudio }> = ({ data }) => {
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isReadingAloud, setIsReadingAloud] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const playbackStartTimeRef = useRef<number>(0);
    const playbackOffsetRef = useRef<number>(0);
    const progressBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!data.audio_base64) return;
        
        const initAudio = async () => {
            try {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const audioContext = audioContextRef.current;
                const decodedBytes = decodeBase64(data.audio_base64!);
                const buffer = await decodePcmAudio(decodedBytes, audioContext, 24000, 1);
                setAudioBuffer(buffer);
            } catch (error) {
                console.error("Failed to initialize or decode audio:", error);
            }
        };
        initAudio();
    }, [data.audio_base64]);
    
    useEffect(() => {
        return () => {
            sourceRef.current?.stop();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
            }
        };
    }, []);

    const updateProgressLoop = () => {
        if (audioContextRef.current && audioBuffer) {
            const elapsedTime = (audioContextRef.current.currentTime - playbackStartTimeRef.current) + playbackOffsetRef.current;
            if (elapsedTime >= audioBuffer.duration) {
                setIsPlaying(false);
                setCurrentTime(audioBuffer.duration);
                setProgress(100);
                playbackOffsetRef.current = 0; 
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            } else {
                setCurrentTime(elapsedTime);
                setProgress((elapsedTime / audioBuffer.duration) * 100);
                animationFrameRef.current = requestAnimationFrame(updateProgressLoop);
            }
        }
    };

    const handlePlay = () => {
        if (isReadingAloud) {
            speechSynthesis.cancel();
        }
        if (!audioContextRef.current || !audioBuffer) return;
        const audioContext = audioContextRef.current;
        if (audioContext.state === 'suspended') audioContext.resume();

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        source.start(0, playbackOffsetRef.current);
        playbackStartTimeRef.current = audioContext.currentTime;
        sourceRef.current = source;
        setIsPlaying(true);

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(updateProgressLoop);
    };

    const handlePause = () => {
        if (!audioContextRef.current) return;
        if (sourceRef.current) {
            sourceRef.current.stop();
            playbackOffsetRef.current = (audioContextRef.current.currentTime - playbackStartTimeRef.current) + playbackOffsetRef.current;
        }
        setIsPlaying(false);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
    
    const handlePlayPause = () => {
        isPlaying ? handlePause() : handlePlay();
    };

    const handleToggleReadAloud = () => {
        if (isReadingAloud) {
            speechSynthesis.cancel();
        } else {
            if (isPlaying) {
                handlePause();
            }
            const utterance = new SpeechSynthesisUtterance(data.script);
            utterance.onend = () => {
                setIsReadingAloud(false);
            };
            utterance.onerror = (event) => {
                console.error('SpeechSynthesisUtterance.onerror', event);
                setIsReadingAloud(false);
            };
            speechSynthesis.speak(utterance);
            setIsReadingAloud(true);
        }
    };

    const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current || !audioBuffer) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.max(0, Math.min(1, clickX / width));
        const seekTime = percentage * audioBuffer.duration;
        
        if (isPlaying) {
            sourceRef.current?.stop();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }

        playbackOffsetRef.current = seekTime;
        setCurrentTime(seekTime);
        setProgress(percentage * 100);

        if (isPlaying) {
            handlePlay();
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const duration = audioBuffer ? audioBuffer.duration : 0;

    const scriptAndReadAloudSection = (
        <div className="flex justify-between items-start pt-2">
            <details className="group">
                <summary className="flex items-center cursor-pointer text-brand-blue text-sm font-semibold">
                    <ChevronDownIcon className="w-4 h-4 mr-1 group-open:rotate-180 transition-transform" />
                    Show Script
                </summary>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-brand-subtext whitespace-pre-wrap font-mono">{data.script}</div>
            </details>
            <button
                onClick={handleToggleReadAloud}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-brand-blue bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors flex-shrink-0 ml-4"
                aria-label={isReadingAloud ? 'Stop reading script' : 'Read script aloud'}
            >
                {isReadingAloud ? <SquareIcon className="h-4 w-4 mr-2" /> : <Volume2Icon className="h-4 w-4 mr-2" />}
                {isReadingAloud ? 'Stop' : 'Read Aloud'}
            </button>
        </div>
    );

    if (!data.audio_base64) {
        return (
            <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-lg text-center">
                     <AudioIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                     <p className="text-sm text-gray-600 font-semibold">Audio player is unavailable.</p>
                     <p className="text-xs text-gray-500 mb-4">Audio is not stored in saved sessions to conserve space.</p>
                </div>
                {scriptAndReadAloudSection}
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
             <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-md font-semibold text-brand-text mb-3">{data.title}</p>
                <div className="flex items-center space-x-4">
                    <button onClick={handlePlayPause} disabled={!audioBuffer} className="p-2 bg-brand-blue text-white rounded-full disabled:bg-gray-400 hover:bg-opacity-90 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
                        {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
                    </button>
                    <div className="flex-grow flex items-center space-x-3">
                        <span className="text-sm font-mono text-brand-subtext w-12 text-center">{formatTime(currentTime)}</span>
                        <div ref={progressBarRef} onClick={handleSeek} className="w-full h-2 bg-gray-200 rounded-full cursor-pointer group">
                            <div className="h-2 bg-brand-blue rounded-full relative" style={{ width: `${progress}%` }}>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-brand-blue rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        </div>
                        <span className="text-sm font-mono text-brand-subtext w-12 text-center">{formatTime(duration)}</span>
                    </div>
                </div>
            </div>
            {scriptAndReadAloudSection}
        </div>
    );
};

export const ImageRenderer: React.FC<{ data: GeneratedImage }> = ({ data }) => (
    <div className="space-y-2">
        <h4 className="font-semibold text-lg">{data.title}</h4>
        {data.image_base64 ? (
            <img src={`data:image/png;base64,${data.image_base64}`} alt={data.title} className="rounded-lg border border-gray-200 shadow-sm w-full" />
        ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg text-center">
                <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Image is not available for saved sessions.</p>
                <p className="text-xs text-gray-500">This is done to prevent exceeding browser storage limits.</p>
            </div>
        )}
    </div>
);

const FlashcardRenderer: React.FC<{ card: Flashcard }> = ({ card }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) {
            e.stopPropagation();
            if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter' && (e as React.KeyboardEvent).key !== ' ') {
                return;
            }
        }
        setIsFlipped(prev => !prev);
    };

    return (
      <div className="perspective-1000 w-full h-56" onClick={() => handleFlip()} role="button" tabIndex={0} onKeyDown={handleFlip}>
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden bg-white shadow-lg rounded-xl p-6 flex flex-col justify-center items-center cursor-pointer border border-gray-200 group">
            <p className="text-center text-lg font-semibold text-brand-text px-4">{card.question}</p>
             <button 
                onClick={handleFlip} 
                className="absolute bottom-2 right-2 p-2 text-gray-400 hover:text-brand-blue rounded-full hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue"
                aria-label="Flip to answer"
            >
                <RotateCwIcon className="h-5 w-5" />
            </button>
          </div>
          {/* Back */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-blue-50 shadow-lg rounded-xl p-6 flex flex-col justify-center items-center cursor-pointer group">
            <p className="text-center text-brand-text px-4">{card.answer}</p>
            <div className="absolute bottom-4 left-4 flex items-center space-x-1">
                {card.citations.map((c, i) => <CitationView key={i} citation={c}/>)}
            </div>
             <button 
                onClick={handleFlip} 
                className="absolute bottom-2 right-2 p-2 text-gray-400 hover:text-brand-blue rounded-full hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue"
                aria-label="Flip to question"
            >
                <RotateCwIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
};


export const FlashcardsContainer: React.FC<{ data: Flashcard[] }> = ({ data }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.map((card, index) => (
            <FlashcardRenderer key={index} card={card} />
        ))}
    </div>
);

export const QuizRenderer: React.FC<{ data: QuizItem[] }> = ({ data }) => {
    const [answersVisible, setAnswersVisible] = useState(false);
    return (
        <div className="space-y-4">
             <div className="text-right">
                <button onClick={() => setAnswersVisible(!answersVisible)} className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-lg hover:bg-opacity-90 transition-colors">
                    {answersVisible ? 'Hide Answers' : 'Show Answers'}
                </button>
             </div>
            {data.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-brand-text">{index + 1}. {item.question} {item.citations.map((c, i) => <CitationView key={i} citation={c}/>)}</p>
                    {answersVisible && (
                        <div className="mt-2 pl-4 border-l-2 border-brand-lightblue text-brand-text bg-blue-50 p-3 rounded-r-md animate-fade-in">
                            <p><span className="font-bold">Answer:</span> {item.answer}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
};

const SourceViewerModal: React.FC<{ source: Source; onClose: () => void }> = ({ source, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold text-brand-text">{source.name}</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-brand-subtext font-sans">{source.content}</pre>
            </div>
        </div>
    </div>
);

type ResultView = 'Report' | 'Study Kit' | 'Audio';

const Section: React.FC<{ title: string; icon: React.FC<{className: string}>; children: React.ReactNode; className?: string }> = ({ title, icon: Icon, children, className = '' }) => (
    <div className={`mt-6 bg-white p-6 rounded-xl shadow-md ${className}`}>
        <h3 className="text-xl font-bold text-brand-text mb-4 flex items-center border-b border-gray-200 pb-2">
            <Icon className="w-6 h-6 mr-3 text-brand-blue"/>
            {title}
        </h3>
        <div className="pl-1">{children}</div>
    </div>
);

export const ResearchResults: React.FC<{ pkg: ResearchPackage }> = ({ pkg }) => {
    const [activeView, setActiveView] = useState<ResultView>('Report');
    const [viewingSource, setViewingSource] = useState<Source | null>(null);

    const renderView = () => {
        switch (activeView) {
            case 'Report':
                return <Section title="Tiered Summary" icon={SummaryIcon}><SummaryRenderer data={pkg.summary} /></Section>;
            case 'Study Kit':
                return (
                    <div className="space-y-8">
                        <Section title="Visual Diagram" icon={ImageIcon}><ImageRenderer data={pkg.image} /></Section>
                        <Section title="Flashcards" icon={FlashcardIcon}><FlashcardsContainer data={pkg.flashcards} /></Section>
                        <Section title="Self-Assessment Quiz" icon={QuizIcon}><QuizRenderer data={pkg.quiz} /></Section>
                    </div>
                );
            case 'Audio':
                 return <Section title="Audio Companion" icon={AudioIcon}><AudioRenderer data={pkg.audio_dialogue} /></Section>;
            default:
                return null;
        }
    };
    
    return (
        <>
            {viewingSource && <SourceViewerModal source={viewingSource} onClose={() => setViewingSource(null)} />}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md animate-fade-in space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-brand-text tracking-tight">{pkg.title}</h2>
                    <p className="text-brand-subtext mt-1">Goal: <span className="font-medium text-brand-text">{pkg.goal}</span></p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-md font-semibold text-brand-text mb-2">Sources Used</h3>
                    <div className="flex flex-wrap gap-2">
                        {pkg.sources.map((source, i) => (
                            <button key={i} onClick={() => setViewingSource(source)} className="flex items-center space-x-2 bg-blue-100 text-brand-blue px-3 py-1 rounded-full text-sm hover:bg-blue-200 transition-colors">
                                {source.type === 'file' ? <FileIcon className="h-4 w-4" /> : <TextIcon className="h-4 w-4" />}
                                <span>{source.name}</span>
                                <BookOpenIcon className="h-4 w-4 opacity-70"/>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {(['Report', 'Study Kit', 'Audio'] as ResultView[]).map((view) => (
                            <button
                                key={view}
                                onClick={() => setActiveView(view)}
                                className={`${
                                    activeView === view
                                        ? 'border-brand-blue text-brand-blue'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                {view}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="mt-8 animate-fade-in">{renderView()}</div>
        </>
    );
};

export const SkeletonLoader: React.FC<{ status: string | null }> = ({ status }) => (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md">
        <div className="flex flex-col items-center justify-center space-y-4">
            <svg className="animate-spin h-8 w-8 text-brand-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-semibold text-brand-text">{status || 'Generating...'}</p>
            <p className="text-sm text-brand-subtext text-center max-w-md">The AI is synthesizing sources, generating visuals, and producing audio. This may take a moment.</p>
        </div>
    </div>
);


// Add custom styles for the 3D card flip
const style = document.createElement('style');
style.textContent = `
  .perspective-1000 { perspective: 1000px; }
  .transform-style-preserve-3d { transform-style: preserve-3d; }
  .rotate-y-180 { transform: rotateY(180deg); }
  .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
  .prose { all: revert; }
`;
document.head.append(style);