'use client';
import React from 'react';
import { SunIcon, MoonIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  title: string;
  onSignIn: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onSignIn }) => {
  return (
    <header className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
      <h1 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h1>
      <div className="flex items-center space-x-4">
        <button onClick={() => onSignIn()} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
          <UserCircleIcon className="h-6 w-6" />
          <span>Sign In</span>
        </button>
      </div>
    </header>
  );
};