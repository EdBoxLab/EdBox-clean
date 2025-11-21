'use client';
import React from 'react';

export const ProjectsView: React.FC = () => {
  return (
    <div className="p-4 md:p-6 bg-white dark:bg-black min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white">Welcome to your IDE</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6 md:mb-8">
          This is a simplified IDE for demonstration purposes. Use the editor to write and preview your code.
        </p>
      </div>
    </div>
  );
};