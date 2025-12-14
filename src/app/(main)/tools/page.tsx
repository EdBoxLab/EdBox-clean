'use client';

import React from 'react';
import Link from 'next/link';
import {
  AcademicCapIcon,
  PencilSquareIcon,
  ClipboardDocumentListIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { Zap } from 'lucide-react';

const tools = [
  {
    id: 'notes',
    href: '/notes',
    title: 'Notes',
    description: 'Create notes from PDFs, images, or prompts. Take notes with your voice or by writing.',
    icon: PencilSquareIcon,
    gradient: 'from-green-600/20 to-emerald-600/20',
    iconColor: 'text-green-400',
    borderHover: 'hover:border-green-500',
  },
  {
    id: 'study-kit',
    href: '/tools/study-kit',
    title: 'Study Kit',
    description: 'AI-powered study tools to help you learn faster and retain more information.',
    icon: Zap,
    gradient: 'from-yellow-600/20 to-amber-600/20',
    iconColor: 'text-yellow-300',
    borderHover: 'hover:border-yellow-500',
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Learning Tools
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Powerful AI-driven tools to enhance your learning experience.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className={`group border-2 border-zinc-700 ${tool.borderHover} bg-zinc-900/30 rounded-2xl p-6 transition-all hover:shadow-lg`}
              >
                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${tool.gradient} border-2 border-zinc-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-8 h-8 ${tool.iconColor}`} />
                </div>

                {/* Content */}
                <h2 className="text-2xl font-bold mb-2 text-white group-hover:text-indigo-300 transition-colors">
                  {tool.title}
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {tool.description}
                </p>

                {/* Arrow indicator */}
                <div className="mt-4 flex items-center text-sm text-zinc-500 group-hover:text-indigo-400 transition-colors">
                  <span>Open tool</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}