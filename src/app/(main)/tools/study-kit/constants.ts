import { Brain, Zap, FileText, Map, BookOpen, Target, Briefcase, Table2 } from 'lucide-react';

export const contentTypes = [
    { id: 'quizzes', label: 'Quizzes', icon: Brain, description: 'Multiple choice, true/false, and short answer' },
    { id: 'flashcards', label: 'Flashcards', icon: Zap, description: 'Front and back study cards' },
    { id: 'notes', label: 'Notes', icon: FileText, description: 'Structured summary notes' },
    { id: 'mindmaps', label: 'Mind Maps', icon: Map, description: 'Visual concept connections' },
];

export const noteSubTabs = [
    { id: 'deepExplanation', label: 'Deep Explanation', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500', tag: 'Master the Material' },
    { id: 'cheatsheet', label: 'Cheatsheet', icon: Target, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500', tag: 'Exam Ready' },
    { id: 'application', label: 'Application', icon: Briefcase, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500', tag: 'Real World' },
    { id: 'tables', label: 'Tables', icon: Table2, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500', tag: 'Quick Reference' },
] as const;

export type NoteSubTab = typeof noteSubTabs[number]['id'];
