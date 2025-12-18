import React, { useState, useEffect, useRef } from 'react';
import type { ArticleFeedItem, AudioGenerationState } from '@/types/feed';
import { BookOpenIcon, BookmarkIcon, ListenIcon, PauseIcon, SpinnerIcon, VideoErrorIcon } from './MediaIcons';
import { CardImage } from './CardImage';
import { FileText, Clock, Headphones, Bookmark, Share2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface ArticleCardProps {
    item: ArticleFeedItem;
    isActive: boolean;
    onViewArticle: (item: ArticleFeedItem) => void;
    audioState?: { state: AudioGenerationState; buffer?: AudioBuffer };
    onGenerateAudio: () => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ item, isActive, onViewArticle, audioState, onGenerateAudio }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

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

    const handleListenClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isPlaying) {
            audioSourceRef.current?.stop();
            audioSourceRef.current = null;
            setIsPlaying(false);
            return;
        }

        if (!audioState || audioState.state === 'idle' || audioState.state === 'error') {
            onGenerateAudio();
            return;
        }

        if (audioState.state === 'ready' && audioState.buffer) {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
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
        if (state === 'generating') return <SpinnerIcon />;
        if (state === 'error') return <VideoErrorIcon />;
        if (isPlaying) return <PauseIcon />;
        return <ListenIcon />;
    };

    return (
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-purple-900/20" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-3 mb-4"
            >
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full">
                    <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>3 min read</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{item.likes} views</span>
                    </div>
                </div>
            </motion.div>

            {item.imageGenerationState && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-sm mb-4 rounded-xl overflow-hidden shadow-2xl ring-2 ring-indigo-500/20"
                >
                    <CardImage
                        generationState={item.imageGenerationState}
                        imageUrl={item.imageUrl}
                        altText={item.title}
                    />
                </motion.div>
            )}

            <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg sm:text-xl font-bold mb-4 drop-shadow-lg px-2 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent"
            >
                {item.title}
            </motion.h2>

            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-md"
            >
                <div className="bg-gradient-to-r from-black/40 to-black/20 backdrop-blur-sm rounded-xl p-4 border border-indigo-500/20 mb-6">
                    <p className="text-gray-200 leading-relaxed text-sm">
                        {item.summary}
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md"
            >
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewArticle(item);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 cursor-pointer"
                >
                    <BookOpenIcon />
                    <span>Read Full Article</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleListenClick}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    disabled={audioState?.state === 'generating'}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-400/30 text-purple-300 font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-wait cursor-pointer"
                >
                    {renderListenButtonIcon()}
                    <span className="hidden sm:inline">{isPlaying ? 'Stop' : 'Listen'}</span>
                </motion.button>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-between w-full max-w-md mt-4"
            >
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="p-2 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-full transition-colors cursor-pointer"
                    >
                        <Bookmark className="w-4 h-4 text-indigo-400" />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-full transition-colors cursor-pointer"
                    >
                        <Share2 className="w-4 h-4 text-purple-400" />
                    </motion.button>
                </div>

                <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 rounded-full">
                    <FileText className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-bold">{item.xp_reward} XP</span>
                </div>
            </motion.div>

            {isPlaying && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-purple-500/80 rounded-full"
                >
                    <Headphones className="w-4 h-4 text-white animate-pulse" />
                    <span className="text-white text-xs font-bold">Playing</span>
                </motion.div>
            )}
        </div>
    );
};