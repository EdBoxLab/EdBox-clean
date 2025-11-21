'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import * as githubService from './services/githubService';

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    signOut(); // This should clear the user from your AuthContext
    setIsOpen(false);
    window.location.reload(); // Force a reload to reset app state
  };

  if (!user || user.isGuest) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2">
        <img src={user.photoURL || 'https://www.gravatar.com/avatar/?d=mp'} alt="User avatar" className="w-8 h-8 rounded-full" />
        <span className="hidden md:inline text-sm font-medium text-slate-700 dark:text-slate-300">{user.displayName || 'Account'}</span>
         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-500 dark:text-slate-400"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-20">
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-900 dark:text-white font-semibold">{user.displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
          </div>
          <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">Settings</a>
          <button 
            onClick={handleSignOut}
            className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-slate-100 dark:text-red-400 dark:hover:bg-slate-700"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};