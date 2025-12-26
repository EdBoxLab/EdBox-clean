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
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-4 relative overflow-hidden bg-transparent">
            {/* Stunning Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.15),transparent_80%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.1),transparent_70%)]" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

            {/* Insight Icon Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-4 mb-8 z-10"
            >
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative p-3.5 bg-slate-900 rounded-2xl border border-white/10 shadow-xl">
                        <MessageSquare className="w-6 h-6 text-indigo-400" />
                    </div>
                </div>
                <div className="text-left">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block mb-0.5">Deep Dive</span>
                    <h3 className="text-xl font-bold text-white tracking-tight">Genie's Insight</h3>
                </div>
            </motion.div>

            {/* Chat Area */}
            <div className="w-full max-w-sm flex flex-col gap-4 z-10 h-[320px] sm:h-[400px] overflow-y-auto no-scrollbar py-4 px-2">
                <AnimatePresence mode="popLayout">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            className="flex justify-start"
                        >
                            <div className="relative group max-w-[95%]">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl rounded-tl-none shadow-xl">
                                    <p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium tracking-tight text-left">
                                        {msg.text}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex justify-start items-center gap-1.5 bg-white/5 backdrop-blur-md border border-white/10 p-3 rounded-2xl rounded-tl-none w-16"
                        >
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer decoration */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 flex items-center gap-3 z-10 opacity-30"
            >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Analysis Active</span>
                <Sparkles className="w-4 h-4 text-indigo-400" />
            </motion.div>

            {/* Background Decorations */}
            <div className="absolute bottom-[-10%] left-[-10%] opacity-[0.03] pointer-events-none">
                <Brain className="w-64 h-64 text-indigo-500" />
            </div>
            <div className="absolute top-[-5%] right-[-5%] opacity-[0.02] pointer-events-none">
                <Zap className="w-48 h-48 text-purple-500" />
            </div>

            {/* Particle field */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-[1px] h-[1px] bg-indigo-400/20 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [-40, 40],
                            opacity: [0, 0.3, 0],
                        }}
                        transition={{
                            duration: 6 + Math.random() * 4,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
