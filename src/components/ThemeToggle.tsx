'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/contexts/ThemeContext';

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="p-2 w-9 h-9 rounded-xl bg-secondary animate-pulse" />
        );
    }

    return (
        <button
            onClick={() => {
                console.log('ThemeToggle: Button clicked. Calling toggleTheme...');
                toggleTheme();
            }}
            className="relative p-2 rounded-xl bg-secondary hover:bg-accent transition-colors duration-200 group"
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
