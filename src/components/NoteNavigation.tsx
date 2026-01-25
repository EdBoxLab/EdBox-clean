'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Target, AlertTriangle, Lightbulb, Settings, Zap } from 'lucide-react';

interface NoteNavigationProps {
    content: string;
}

interface NavItem {
    id: string;
    text: string;
    level: number;
    icon?: React.ElementType;
    iconColor?: string;
}

export function NoteNavigation({ content }: NoteNavigationProps) {
    const [navItems, setNavItems] = useState<NavItem[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!content) return;

        const items: NavItem[] = [];
        const lines = content.split('\n');

        lines.forEach((line) => {
            const h2Match = line.match(/^##\s+(.+)/);
            if (h2Match) {
                const text = h2Match[1].trim();
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                // Determine icon based on "Straight A" protocol keywords
                let icon = ChevronRight;
                let iconColor = 'text-zinc-500';

                if (text.includes('Missing Lecture') || text.includes('Intuition')) {
                    icon = Lightbulb; // Intuition
                    iconColor = 'text-yellow-400';
                } else if (text.includes('Exam Predictor') || text.includes('Intel')) {
                    icon = Target; // Predictor/Target
                    iconColor = 'text-red-400';
                } else if (text.includes('Algorithm') || text.includes('Protocol')) {
                    icon = Settings; // Algorithm
                    iconColor = 'text-blue-400';
                } else if (text.includes('Exam') || text.includes('Cheat')) {
                    icon = Zap; // Cheat/Exam
                    iconColor = 'text-purple-400';
                } else if (text.includes('Scenarios') || text.includes('Stakes')) {
                    icon = AlertTriangle; // Scenarios
                    iconColor = 'text-orange-400';
                }

                // Inject ID into the DOM elements (handled by ReactMarkdown usually, 
                // but we might need a custom renderer or just rely on text matching if we can't inject ids easily.
                // For now, let's assume valid anchors are generated or we find by text)
                items.push({ id, text, level: 2, icon, iconColor });
            }
        });

        setNavItems(items);
    }, [content]);

    // Scroll Spy Logic
    useEffect(() => {
        const handleScroll = () => {
            const headings = document.querySelectorAll('h2');
            let currentId = '';

            headings.forEach((heading) => {
                const top = heading.getBoundingClientRect().top;
                if (top < 150) { // Offset for header
                    // We need a way to match the heading to our ID. 
                    // Simple text matching is safest if IDs aren't strictly predictable.
                    const text = heading.textContent || '';
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    currentId = id;
                }
            });
            setActiveId(currentId);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [navItems]);

    const scrollToSection = (e: React.MouseEvent, id: string, text: string) => {
        e.preventDefault();

        // Find header by text content since standard markdown might not have exact IDs
        const headings = Array.from(document.querySelectorAll('h2'));
        const target = headings.find(h => h.textContent?.includes(text.split('(')[0].trim())); // specific fuzzy match

        if (target) {
            const top = target.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    if (navItems.length === 0) return null;

    return (
        <motion.div
            className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-end gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {navItems.map((item) => {
                const isActive = activeId === item.id;
                const Icon = item.icon!;

                return (
                    <button
                        key={item.id}
                        onClick={(e) => scrollToSection(e, item.id, item.text)}
                        className="group relative flex items-center justify-end"
                    >
                        {/* Label Tooltip */}
                        <AnimatePresence>
                            {(isHovered || isActive) && (
                                <motion.span
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className={`absolute right-10 whitespace-nowrap text-xs font-bold py-1 px-2 rounded-md bg-zinc-900/90 backdrop-blur border border-zinc-800 shadow-xl ${isActive ? 'text-white' : 'text-zinc-500'}`}
                                >
                                    {item.text.replace(/\(.*\)/, '')} {/* Clean text */}
                                </motion.span>
                            )}
                        </AnimatePresence>

                        {/* Icon Node */}
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border
                            ${isActive
                                ? `bg-zinc-800 border-indigo-500/50 scale-110 shadow-[0_0_15px_rgba(99,102,241,0.3)]`
                                : `bg-zinc-900/50 border-zinc-800 hover:border-zinc-600 grayscale hover:grayscale-0`}
                        `}>
                            <Icon className={`w-4 h-4 ${isActive ? item.iconColor : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                        </div>
                    </button>
                );
            })}
        </motion.div>
    );
}
