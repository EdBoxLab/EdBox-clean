
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const root = window.document.documentElement;
        const initialTheme = localStorage.getItem('theme') as Theme | null;
        console.log('ThemeProvider: Initializing. LocalStorage theme:', initialTheme);

        if (initialTheme) {
            setTheme(initialTheme);
            root.classList.remove('light', 'dark');
            root.classList.add(initialTheme);
            console.log('ThemeProvider: Applied theme from localStorage:', initialTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
            root.classList.remove('light', 'dark');
            root.classList.add('dark');
            console.log('ThemeProvider: Applied system prefers-dark');
        } else {
            root.classList.remove('light', 'dark');
            root.classList.add('light');
            console.log('ThemeProvider: default to light');
        }
    }, []);

    const toggleTheme = () => {
        console.log('ThemeProvider: toggleTheme called. Current state:', theme);
        const root = window.document.documentElement;
        const newTheme = theme === 'light' ? 'dark' : 'light';

        console.log('ThemeProvider: Switching to:', newTheme);
        root.classList.remove('light', 'dark');
        root.classList.add(newTheme);
        localStorage.setItem('theme', newTheme);
        setTheme(newTheme);
        console.log('ThemeProvider: State and DOM updated to:', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};