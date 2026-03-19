'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Plus, X, CheckCircle2 } from 'lucide-react';

export const MindmapView = ({
    displayContent,
    mindmapDragPosition,
    setMindmapDragPosition,
    selectedNodeData,
    setSelectedNodeData,
    windowSize
}: any) => {
    return (
        <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl h-[600px] flex flex-col items-center shadow-2xl overflow-hidden relative touch-none">
                <div className="absolute top-4 left-4 flex items-center gap-2 z-50 pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Interactive Map • Drag to Pan</span>
                </div>

                {(() => {
                    const data = displayContent.mindmaps;
                    if (!data || (!data.central && !data.center)) return <div className="text-zinc-500 mt-20">Generating visualization...</div>;

                    const centralTopic = data.central || (typeof data.center === 'object' ? data.center.topic : data.center);
                    const branches = data.branches || (typeof data.center === 'object' ? data.center.subtopics : []);

                    return (
                        <>
                            <div className="absolute top-4 right-4 z-50">
                                <button
                                    onClick={() => setMindmapDragPosition({ x: 0, y: 0 })}
                                    className="p-2 bg-zinc-800/80 backdrop-blur-md border border-zinc-700 hover:border-indigo-500/50 rounded-full text-zinc-400 hover:text-indigo-400 transition-all shadow-lg hover:shadow-indigo-500/20"
                                    title="Reset View"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                            <motion.div
                                drag
                                dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
                                animate={mindmapDragPosition}
                                onDragEnd={(e, info) => {
                                    setMindmapDragPosition({ x: info.point.x, y: info.point.y });
                                }}
                                className="relative w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center p-20"
                            >
                                {/* Central Node */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="bg-indigo-600 text-white px-6 py-4 sm:px-8 sm:py-5 rounded-3xl font-bold text-lg sm:text-2xl shadow-[0_0_50px_rgba(79,70,229,0.3)] z-50 relative border-2 border-indigo-400 text-center max-w-[200px] sm:max-w-none"
                                >
                                    {centralTopic}
                                </motion.div>

                                {/* Branches */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    {branches.map((branch: any, i: number, arr: any[]) => {
                                        const angle = (i / arr.length) * 2 * Math.PI;
                                        const isMobile = windowSize.width < 768;
                                        const radius = isMobile ? 220 : 300;
                                        const x = Math.cos(angle) * radius;
                                        const y = Math.sin(angle) * (radius * 0.7);

                                        const branchTopic = typeof branch === 'string' ? branch : branch.topic || branch.name;
                                        const subtopics = branch.subtopics || [];

                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: 0, y: 0 }}
                                                animate={{ opacity: 1, x, y }}
                                                transition={{ delay: i * 0.1, duration: 0.8, type: 'spring' }}
                                                className="absolute flex flex-col items-center z-10 pointer-events-auto"
                                            >
                                                <button
                                                    onClick={() => setSelectedNodeData(branch)}
                                                    className="bg-zinc-950 border border-zinc-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl w-40 sm:w-56 hover:border-indigo-500 hover:bg-zinc-900 transition-all group text-left"
                                                >
                                                    <h5 className="font-bold text-[11px] sm:text-sm text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2">{branchTopic}</h5>
                                                    {subtopics.length > 0 && (
                                                        <div className="space-y-1">
                                                            {subtopics.slice(0, 3).map((s: string, idx: number) => (
                                                                <div key={idx} className="text-[9px] sm:text-[10px] text-zinc-400 flex items-center gap-1">
                                                                    <span className="w-1 h-1 rounded-full bg-zinc-600 shrink-0"></span>
                                                                    <span className="line-clamp-1">{s}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {branch.details && (
                                                        <div className="mt-2 flex items-center gap-1 text-[9px] text-indigo-400 font-bold uppercase tracking-tighter">
                                                            <Plus className="w-2.5 h-2.5" /> View Details
                                                        </div>
                                                    )}
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Decorative Background Glows */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-indigo-600/5 rounded-full blur-[100px] -z-10"></div>
                            </motion.div>
                        </>
                    );
                })()}
            </div>

            {/* Node Details Panel */}
            <AnimatePresence>
                {selectedNodeData && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-zinc-900 border-2 border-indigo-500/30 rounded-2xl overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xl font-bold text-white">{selectedNodeData.topic}</h4>
                                <button
                                    onClick={() => setSelectedNodeData(null)}
                                    className="p-2 hover:bg-zinc-800 rounded-lg transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h5 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Key Points</h5>
                                    <ul className="space-y-2">
                                        {selectedNodeData.subtopics?.map((s: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-zinc-300">
                                                <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="text-xs font-bold uppercase tracking-widest text-indigo-400">In-Depth Details</h5>
                                    <p className="text-zinc-300 leading-relaxed bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                                        {selectedNodeData.details || "No additional details available for this topic."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
