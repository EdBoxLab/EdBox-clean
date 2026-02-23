'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { WindowType } from '../../types';
import {
    X, ChevronRight, Loader2, Sparkles, BookOpen,
    GraduationCap, ArrowLeft, ExternalLink, Search
} from 'lucide-react';

interface SkillGraph {
    id: string;
    goal: string;
    nodes: SkillNode[];
    estimated_hours?: string;
    total_skills?: number;
    created_at: string;
}

interface SkillNode {
    id: string;
    title: string;
    description?: string;
    level?: number;
    order_index?: number;
}

interface SkillPickerModalProps {
    onClose: () => void;
    onOpenWidget: (type: WindowType, data?: any) => void;
}

const MotionDiv = motion.div as any;

const SkillPickerModal: React.FC<SkillPickerModalProps> = ({ onClose, onOpenWidget }) => {
    const [graphs, setGraphs] = useState<SkillGraph[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGraph, setSelectedGraph] = useState<SkillGraph | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchGraphs();
    }, []);

    const fetchGraphs = async () => {
        try {
            const supabase = createSupabaseBrowserClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('skill_graphs')
                .select('id, goal, nodes, estimated_hours, total_skills, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setGraphs(data as SkillGraph[]);
            }
        } catch (e) {
            console.error('Failed to fetch skill graphs:', e);
        } finally {
            setLoading(false);
        }
    };

    const handlePickSkill = (graph: SkillGraph, skill: SkillNode) => {
        onOpenWidget(WindowType.SKILL_SESSION, {
            skillId: skill.id,
            graphId: graph.id,
            skillTitle: skill.title,
        });
        onClose();
    };

    const filteredNodes = selectedGraph
        ? (selectedGraph.nodes || []).filter(n =>
            n.title?.toLowerCase().includes(search.toLowerCase()) ||
            n.description?.toLowerCase().includes(search.toLowerCase())
        )
        : [];

    return (
        <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e: any) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <MotionDiv
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3">
                        {selectedGraph && (
                            <button
                                onClick={() => { setSelectedGraph(null); setSearch(''); }}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <div>
                            <h2 className="text-base font-bold text-white">
                                {selectedGraph ? selectedGraph.goal : 'Choose a Skill to Learn'}
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {selectedGraph
                                    ? `${filteredNodes.length} skill${filteredNodes.length !== 1 ? 's' : ''} available`
                                    : 'Pick a learning path, then choose a skill'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Search (skill picker view) */}
                {selectedGraph && (
                    <div className="px-6 pt-4 shrink-0">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search skills..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-8 pr-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                            />
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                            <Loader2 size={32} className="animate-spin mb-3 text-cyan-500" />
                            <span className="text-sm">Loading your learning paths...</span>
                        </div>
                    ) : !selectedGraph ? (
                        // Graph picker
                        graphs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                                <GraduationCap size={40} className="mb-3 opacity-30" />
                                <p className="text-sm font-medium mb-1">No learning paths yet</p>
                                <p className="text-xs text-slate-600 mb-4">Create one to start learning with Genie.</p>
                                <a
                                    href="/generate"
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-xl font-semibold transition-colors"
                                >
                                    <Sparkles size={14} /> Create Learning Path
                                    <ExternalLink size={12} />
                                </a>
                            </div>
                        ) : (
                            graphs.map(graph => (
                                <MotionDiv
                                    key={graph.id}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => setSelectedGraph(graph)}
                                    className="flex items-center gap-4 p-4 bg-slate-800/60 hover:bg-slate-800 border border-white/8 hover:border-cyan-500/30 rounded-xl cursor-pointer transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center shrink-0">
                                        <BookOpen size={18} className="text-cyan-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{graph.goal}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {graph.total_skills ?? (graph.nodes?.length ?? 0)} skills
                                            {graph.estimated_hours ? ` · ~${graph.estimated_hours}` : ''}
                                        </p>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                                </MotionDiv>
                            ))
                        )
                    ) : (
                        // Skill node picker
                        filteredNodes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                                <Search size={32} className="mb-3 opacity-30" />
                                <p className="text-sm">No skills match your search</p>
                            </div>
                        ) : (
                            filteredNodes
                                .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                                .map((skill, i) => (
                                    <MotionDiv
                                        key={skill.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => handlePickSkill(selectedGraph, skill)}
                                        className="flex items-center gap-4 p-4 bg-slate-800/60 hover:bg-slate-800 border border-white/8 hover:border-cyan-500/40 rounded-xl cursor-pointer transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 text-sm font-bold">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">{skill.title}</p>
                                            {skill.description && (
                                                <p className="text-xs text-slate-500 truncate mt-0.5">{skill.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Start →
                                            </span>
                                        </div>
                                    </MotionDiv>
                                ))
                        )
                    )}
                </div>
            </MotionDiv>
        </MotionDiv>
    );
};

export default SkillPickerModal;
