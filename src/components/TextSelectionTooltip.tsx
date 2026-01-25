'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface TextSelectionTooltipProps {
    onAskGenie: (text: string) => void;
}

export function TextSelectionTooltip({ onAskGenie }: TextSelectionTooltipProps) {
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [selectedText, setSelectedText] = useState('');
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
                setPosition(null);
                return;
            }

            const text = selection.toString().trim();
            if (text.length < 3) { // Ignore accidental tiny selections
                setPosition(null);
                return;
            }

            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Position above the selection
            setPosition({
                x: rect.left + rect.width / 2,
                y: rect.top + window.scrollY - 10 // 10px offset up
            });
            setSelectedText(text);
        };

        // Debounce selection change for performance/stability
        let timeout: NodeJS.Timeout;
        const debouncedHandleSelection = () => {
            clearTimeout(timeout);
            timeout = setTimeout(handleSelectionChange, 200);
        };

        document.addEventListener('selectionchange', debouncedHandleSelection);
        return () => {
            document.removeEventListener('selectionchange', debouncedHandleSelection);
            clearTimeout(timeout);
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent losing selection
        e.stopPropagation();
        onAskGenie(selectedText);
        // Clear selection after asking
        window.getSelection()?.removeAllRanges();
        setPosition(null);
    };

    if (!position) return null;

    return (
        <AnimatePresence>
            <motion.div
                ref={tooltipRef}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y,
                    transform: 'translate(-50%, -100%)',
                    zIndex: 50 // High z-index but below side panels
                }}
                className="pointer-events-auto"
            >
                <button
                    onMouseDown={handleMouseDown}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                >
                    <Sparkles className="w-3 h-3" />
                    Ask Genie
                </button>
                {/* Little triangle arrow at bottom */}
                <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-indigo-600 rotate-45 -z-10"></div>
            </motion.div>
        </AnimatePresence>
    );
}
