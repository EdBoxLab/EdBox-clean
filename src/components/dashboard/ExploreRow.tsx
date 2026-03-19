import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { SkeletonCard } from './SkeletonCard';
import { DashboardItem } from '@/hooks/useDashboardData';

export const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
    })
};

interface ExploreRowProps {
    title: string;
    items: DashboardItem[];
    emptyMessage?: string;
    showProgress?: boolean;
    createLink?: string;
    createText?: string;
    isLoading?: boolean;
    onDelete?: (id: string, type: string) => void;
}

export const ExploreRow: React.FC<ExploreRowProps> = ({
    title,
    items,
    emptyMessage,
    showProgress = false,
    createLink,
    createText,
    isLoading = false,
    onDelete
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        const scrollElement = scrollRef.current;
        if (scrollElement) {
            scrollElement.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
            return () => {
                scrollElement.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [items]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollAmount = clientWidth * 0.8;
            scrollRef.current.scrollTo({
                left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    if (isLoading) {
        return (
            <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
                <div className="flex gap-4 overflow-hidden pb-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        );
    }

    if (!items || items.length === 0) {
        return (
            <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8 text-center">
                    <p className="text-gray-400 mb-4">{emptyMessage || "No items found."}</p>
                    {createLink && createText && (
                        <Link href={createLink} className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
                            <Plus className="w-4 h-4" /> {createText}
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                {items.length > 3 && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => scroll('left')}
                            className={`p-1.5 border rounded-md transition ${showLeftArrow
                                ? 'border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200'
                                : 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                                }`}
                            disabled={!showLeftArrow}
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className={`p-1.5 border rounded-md transition ${showRightArrow
                                ? 'border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200'
                                : 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                                }`}
                            disabled={!showRightArrow}
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((item, i) => (
                    <div key={item.id} className="relative group/card">
                        <Link href={item.href || '#'} className="block">
                            <motion.div
                                className={`flex-shrink-0 w-64 border border-zinc-800 hover:border-zinc-600 rounded-lg p-4 flex flex-col justify-between transition-colors bg-zinc-900/50 group ${showProgress ? 'min-h-[180px]' : 'min-h-[160px]'}`}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                custom={i}
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-grow min-w-0 pr-2">
                                        <p className="text-sm text-gray-400 uppercase tracking-wide font-medium">{item.type}</p>
                                        <h3 className="font-bold text-lg text-white mt-1 line-clamp-2 break-words">{item.title}</h3>
                                    </div>
                                    {item.icon && <div className="flex-shrink-0 ml-2">{item.icon}</div>}
                                </div>

                                {showProgress && typeof item.progress === 'number' && (
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-400">{item.progress}% complete</span>
                                        </div>
                                        <div className="w-full bg-zinc-800 rounded-full h-2">
                                            <div
                                                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${item.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-indigo-400 group-hover:text-indigo-300 text-sm mt-3 transition-colors">
                                    Open <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </motion.div>
                        </Link>

                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDelete(item.id, item.type);
                                }}
                                className="absolute bottom-2 right-2 p-2.5 bg-zinc-900/90 hover:bg-red-500 text-zinc-400 hover:text-white rounded-full border border-zinc-800 hover:border-red-500 transition-all z-20 shadow-xl"
                                title={`Delete ${item.type}`}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
