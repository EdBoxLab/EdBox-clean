'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';

export const UserMenu: React.FC = () => {
    const { user, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    if (!user) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2">
                <img 
                    src={user.photoURL || 'https://avatar.vercel.sh/leerob'} 
                    alt={user.displayName || 'User'} 
                    className="w-9 h-9 rounded-full ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900 ring-indigo-500"
                />
                <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20">
                    <button
                        onClick={() => { signOut(); setIsOpen(false); }}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
};