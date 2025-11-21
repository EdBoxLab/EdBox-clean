'use client';
import React from 'react';
import { SECTIONS } from './constants';
import type { Section } from './types';

interface SidebarProps {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection }) => {
  return (
    <aside className="w-16 bg-slate-100 dark:bg-slate-900 flex flex-col items-center py-4">
      <div className="flex flex-col space-y-4">
        {SECTIONS.map(section => (
          <button 
            key={section.id} 
            onClick={() => setActiveSection(section)} 
            className={`p-2 rounded-md ${activeSection.id === section.id ? 'bg-slate-200 dark:bg-slate-700' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <section.icon className={`h-6 w-6 ${activeSection.id === section.id ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`} />
          </button>
        ))}
      </div>
    </aside>
  );
};