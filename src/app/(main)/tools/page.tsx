'use client';

import React from 'react';
import Link from 'next/link';
import { Search, FileText, Sparkles } from 'lucide-react';

const tools = [
  {
    id: 'research-assistant',
    title: 'Research Assistant',
    description: 'AI-powered research tool to help you find, analyze, and synthesize information.',
    icon: Search,
    href: '/research-assistant',
    gradient: 'from-blue-600/20 to-cyan-600/20',
    iconColor: 'text-blue-400',
    borderHover: 'hover:border-blue-500',
  },
  {
    id: 'note-taker',
    title: 'Note Taker',
    description: 'Simple, distraction-free note-taking right in your browser.',
    icon: FileText,
    href: '/tools/notes',
    gradient: 'from-green-600/20 to-emerald-600/20',
    iconColor: 'text-green-400',
    borderHover: 'hover:border-green-500',
  },
  {
    id: 'study-kit',
    title: 'Study Kit',
    description: 'Generate quizzes, flashcards, notes, and mind maps from any material.',
    icon: Sparkles,
    href: '/tools/study-kit',
    gradient: 'from-indigo-600/20 to-purple-600/20',
    iconColor: 'text-indigo-400',
    borderHover: 'hover:border-indigo-500',
  },
];

export default function ToolsPage() {
  const tools = [
    {
      href: "/research-assistant",
      title: "Research Assistant",
      description: "Your AI-powered research assistant.",
      icon: AcademicCapIcon,
    },
    {
      href: "/notes",
      title: "Notes",
      description:
        "Create notes from PDFs, images, or prompts. Take notes with your voice or by writing.",
      icon: PencilSquareIcon,
    },
    {
      href: "/quiz-forge",
      title: "Quiz Forge",
      description:
        "Generate exhaustive quizzes of all types from an upload or a prompt.",
      icon: ClipboardDocumentListIcon,
    },
    {
      href: "/flashcard-gen",
      title: "Flashcard Gen",
      description:
        "Generate exhaustive flashcards from an upload or a prompt.",
      icon: RectangleStackIcon,
    },
    {
      href: "/engines",
      title: "Engines",
      description:
        "Access state of the art engines that make visualizing any learning concepts possible.",
      icon: Cog6ToothIcon,
    },
  ];

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
                className={`group border-2 border-zinc-700 ${tool.borderHover} bg-zinc-900/30 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-${tool.iconColor.split('-')[1]}-900/20`}
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
