import React, { useState, useEffect } from 'react';
import type { InsightFeedItem } from '@/types/feed';
import { Sparkles, MessageSquare, Brain, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InsightCardProps {
    item: InsightFeedItem;
    isActive: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({ item, isActive }) => {
    const [messages, setMessages] = useState<{ text: string, sender: 'genie' | 'user' }[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (!isActive) {
            setMessages([]);
            return;
        }

        const fullContent = item.full_content || '';
        const sentences = fullContent.split(/[.!?]+/).filter(s => s && s.trim().length > 0);

        let currentIdx = 0;
        let isMounted = true;
        let nextTimeout: NodeJS.Timeout;

        const showNextMessage = () => {
            if (!isMounted || currentIdx >= sentences.length) return;

            setIsTyping(true);
            nextTimeout = setTimeout(() => {
                if (!isMounted) return;
                setIsTyping(false);

                const sentence = sentences[currentIdx];
                if (sentence) {
                    setMessages(prev => [...prev, { text: sentence.trim() + '.', sender: 'genie' }]);
                }

                currentIdx++;
                nextTimeout = setTimeout(showNextMessage, 2000);
            }, 1000);
        };

        const initialTimeout = setTimeout(showNextMessage, 500);
        return () => {
            isMounted = false;
            clearTimeout(initialTimeout);
            clearTimeout(nextTimeout);
        };
    }, [isActive, item.full_content]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-purple-900/10" />

            {/* Header */}

            {/* Chat Area */}
            <div className="w-full max-w-xs sm:max-w-sm flex flex-col gap-2 sm:gap-3 z-10 h-[250px] sm:h-[300px] overflow-y-auto no-scrollbar py-2 sm:py-4 px-1 sm:px-2">
                <AnimatePresence>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            className="flex justify-start"
                        >
                            <div className="bg-zinc-800/80 backdrop-blur-md border border-zinc-700/50 p-2 sm:p-3 rounded-2xl rounded-tl-none max-w-[90%] sm:max-w-[85%] shadow-md">
                                <p className="text-xs sm:text-sm lg:text-base text-gray-100 leading-relaxed font-medium">
                                    {msg.text}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex justify-start items-center gap-1 bg-zinc-800/50 p-2 rounded-xl w-12"
                        >
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>


            {/* Background Decoration */}
            <div className="absolute bottom-4 left-4 opacity-5">
                <Brain className="w-32 h-32 text-indigo-500" />
            </div>
            <div className="absolute top-4 right-4 opacity-5">
                <Zap className="w-32 h-32 text-purple-500" />
            </div>
        </div>
    );
};
