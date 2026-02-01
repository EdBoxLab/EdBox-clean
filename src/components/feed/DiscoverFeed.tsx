'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeedOverlay } from './FeedOverlay';
import { FeedItem } from '@/types/feed';
import { supabase } from '@/lib/supabase/client';
import { generateFeedBatch } from '@/services/feedService';

export const DiscoverFeed: React.FC = () => {
    const [heroItem, setHeroItem] = useState<FeedItem | null>(null);
    const [allItems, setAllItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [overlayOpen, setOverlayOpen] = useState(false);
    const [fetchingMore, setFetchingMore] = useState(false);

    const loadItems = async (initial = false) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const batch = await generateFeedBatch(
                user?.user_metadata?.interests || ['Technology', 'Science', 'History'],
                [], [],
                allItems.map(i => i.id), // seenIds
                allItems.map(i => i.title) // seenTitles
            );

            if (initial) {
                if (batch.length > 0) setHeroItem(batch[0]);
                setAllItems(batch);
            } else {
                setAllItems(prev => [...prev, ...batch]);
            }
        } catch (err) {
            console.error("Failed to load discover items", err);
        } finally {
            setLoading(false);
            setFetchingMore(false);
        }
    };

    useEffect(() => {
        loadItems(true);
    }, []);

    // Optimistic Update Handler
    const handleItemUpdate = (id: string, updates: Partial<FeedItem>) => {
        setAllItems(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates } as FeedItem : item
        ));

        if (heroItem && heroItem.id === id) {
            setHeroItem(prev => prev ? { ...prev, ...updates } as FeedItem : null);
        }
    };

    if (!loading && !heroItem) return null;

    // Use available image or fallback - prioritize explicit image/thumbnail and avoid video files for img tag
    const getHeroImage = (item: FeedItem): string => {
        const potentialImages = [
            (item as any).thumbnailUrl,           // Highest priority: Explicit thumbnail
            (item as any).mediaUrl,               // Secondary: Media URL (check for image extension)
            (item as any).imageUrl                // Legacy/Other
        ].filter(url => url && typeof url === 'string');

        // Find first valid image (rudimentary check for video extensions to avoid broken images)
        const validImage = potentialImages.find(url =>
            !url.match(/\.(mp4|webm|mov)$/i) // Exclude obviously video formats
        );

        return validImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000'; // Default techy/abstract background
    };

    const bgImage = heroItem ? getHeroImage(heroItem) : '';

    return (
        <div className="mb-8 w-full">
            {loading ? (
                <div className="w-full h-64 bg-zinc-900/50 rounded-2xl animate-pulse backdrop-blur-sm border border-white/5" />
            ) : (
                <>
                    <motion.div
                        onClick={() => setOverlayOpen(true)}
                        className="group relative w-full h-64 md:h-80 rounded-3xl overflow-hidden cursor-pointer border border-white/10 shadow-2xl"
                        whileHover={{ scale: 1.005 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        {bgImage && (
                            <img
                                src={bgImage}
                                alt={heroItem?.title || "Feed Item"}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                onError={(e) => {
                                    // Fallback if image fails to load
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000';
                                }}
                            />
                        )}

                        {/* Glassmorphism Overlay - The "Frame" */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />

                        {/* Glass Content Area */}
                        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 bg-black/40 backdrop-blur-xl border-t border-white/10">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <span className="inline-block px-3 py-1 mb-3 text-[10px] font-bold tracking-widest text-white uppercase border border-white/30 rounded-full backdrop-blur-md shadow-lg bg-white/10">
                                    For You
                                </span>
                                <h2 className="text-2xl md:text-3xl font-medium text-white leading-tight tracking-tight mb-2">
                                    {heroItem?.title}
                                </h2>
                                <p className="text-sm text-white/70 line-clamp-1 font-light">
                                    Tap to explore this story and more
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>

                    <AnimatePresence>
                        {overlayOpen && (
                            <FeedOverlay
                                items={allItems}
                                initialActiveId={heroItem?.id}
                                onClose={() => setOverlayOpen(false)}
                                onItemUpdate={handleItemUpdate}
                                onLoadMore={() => {
                                    if (!fetchingMore) {
                                        setFetchingMore(true);
                                        loadItems(false);
                                    }
                                }}
                            />
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
};
