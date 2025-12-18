'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/contexts/ThemeContext';

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 group"
            aria-label="Toggle theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={theme}
                    initial={{ y: 20, opacity: 0, rotate: -45 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: -20, opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex items-center justify-center"
                >
                    {theme === 'light' ? (
                        <Sun className="w-5 h-5 text-amber-500" />
                    ) : (
                        <Moon className="w-5 h-5 text-blue-400" />
                    )}
                </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 rounded-xl ring-2 ring-primary/0 group-hover:ring-primary/20 transition-all duration-300" />
        </button>
    );
};
