'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkillGraph, SkillNode } from '@/lib/courseCreation/types';
import { Lock, CheckCircle2, Sparkles, Trophy, Clock } from 'lucide-react';

interface SkillGraphViewProps {
    graph: SkillGraph;
    onSkillClick?: (skillId: string) => void;
    userProgress?: Record<string, number>;
}

export const SkillGraphView: React.FC<SkillGraphViewProps> = ({
    graph,
    onSkillClick,
    userProgress = {}
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [isMobile, setIsMobile] = useState(false);

    const calculatePositions = () => {
        const nodeSize = isMobile ? 90 : 140;
        const maxTier = Math.max(...graph.nodes.map(n => getTier(n.id)));

        const nodes = graph.nodes.map((node) => {
            const tier = getTier(node.id);
            const nodesInTier = graph.nodes.filter(n => getTier(n.id) === tier).length;
            const indexInTier = graph.nodes.filter(n => getTier(n.id) === tier).indexOf(node);

            if (isMobile) {
                // Vertical staggered layout for mobile
                const verticalSpacing = dimensions.height / (graph.nodes.length + 1);
                const horizontalOffset = tier % 2 === 0 ? dimensions.width * 0.3 : dimensions.width * 0.7;

                return {
                    ...node,
                    x: horizontalOffset,
                    y: verticalSpacing * (graph.nodes.indexOf(node) + 1),
                };
            } else {
                // Horizontal tiered layout for desktop
                const horizontalSpacing = dimensions.width / (maxTier + 2);
                const verticalSpacing = dimensions.height / (nodesInTier + 1);

                return {
                    ...node,
                    x: horizontalSpacing * (tier + 1),
                    y: verticalSpacing * (indexInTier + 1),
                };
            }
        });
        return nodes;
    };

    const getTier = (nodeId: string): number => {
        const node = graph.nodes.find(n => n.id === nodeId);
        if (!node || node.prerequisites.length === 0) return 0;
        return Math.max(...node.prerequisites.map(prereqId => getTier(prereqId) + 1));
    };

    const isUnlocked = (node: SkillNode): boolean => {
        return node.prerequisites.every(prereqId => (userProgress[prereqId] || 0) >= 0.8);
    };

    const getMasteryLevel = (nodeId: string): number => {
        return userProgress[nodeId] || 0;
    };

    const getNodeStatus = (node: SkillNode): 'locked' | 'available' | 'in-progress' | 'mastered' => {
        const mastery = getMasteryLevel(node.id);
        if (!isUnlocked(node)) return 'locked';
        if (mastery >= 0.8) return 'mastered';
        if (mastery > 0) return 'in-progress';
        return 'available';
    };

    const getNodeColor = (status: string): { bg: string; border: string; glow: string } => {
        switch (status) {
            case 'mastered':
                return { bg: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500', glow: 'shadow-emerald-500/50' };
            case 'in-progress':
                return { bg: 'from-indigo-500/20 to-purple-500/20', border: 'border-indigo-500', glow: 'shadow-indigo-500/50' };
            case 'available':
                return { bg: 'from-blue-500/10 to-cyan-500/10', border: 'border-blue-500/50', glow: 'shadow-blue-500/30' };
            default:
                return { bg: 'from-zinc-800/50 to-zinc-900/50', border: 'border-zinc-700', glow: 'shadow-zinc-700/20' };
        }
    };

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth;
                const mobile = width < 768;
                setIsMobile(mobile);
                setDimensions({
                    width,
                    height: mobile ? Math.max(600, graph.nodes.length * 120) : Math.max(600, width * 0.6)
                });
            }
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [graph.nodes.length]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const positions = calculatePositions();

        graph.edges.forEach(edge => {
            const fromNode = positions.find(n => n.id === edge.from);
            const toNode = positions.find(n => n.id === edge.to);

            if (fromNode && toNode) {
                const fromStatus = getNodeStatus(fromNode);
                const toStatus = getNodeStatus(toNode);

                ctx.beginPath();
                ctx.moveTo(fromNode.x, fromNode.y);
                ctx.lineTo(toNode.x, toNode.y);

                const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
                if (fromStatus === 'mastered') {
                    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
                    gradient.addColorStop(1, toStatus === 'mastered' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.2)');
                } else {
                    gradient.addColorStop(0, 'rgba(63, 63, 70, 0.3)');
                    gradient.addColorStop(1, 'rgba(63, 63, 70, 0.3)');
                }

                ctx.strokeStyle = gradient;
                ctx.lineWidth = isMobile ? 1.5 : 2;
                ctx.stroke();
            }
        });
    }, [graph, dimensions, userProgress, isMobile]);

    const positions = calculatePositions();
    const nodeSize = isMobile ? 90 : 140;
    const nodeRadius = nodeSize / 2;

    return (
        <div ref={containerRef} className="relative w-full bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.15) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

            <div className="relative p-4 md:p-0" style={{ height: dimensions.height }}>
                {positions.map((node) => {
                    const status = getNodeStatus(node);
                    const colors = getNodeColor(status);
                    const mastery = getMasteryLevel(node.id);
                    const unlocked = isUnlocked(node);

                    return (
                        <motion.div
                            key={node.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: getTier(node.id) * 0.1, type: 'spring', stiffness: 200 }}
                            className="absolute"
                            style={{
                                left: node.x - nodeRadius,
                                top: node.y - nodeRadius,
                                width: nodeSize,
                                height: nodeSize,
                            }}
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                        >
                            <motion.button
                                onClick={() => {
                                    if (unlocked) {
                                        setSelectedNode(node);
                                        onSkillClick?.(node.id);
                                    }
                                }}
                                disabled={!unlocked}
                                whileHover={unlocked ? { scale: 1.05 } : {}}
                                whileTap={unlocked ? { scale: 0.95 } : {}}
                                className={`
                  relative w-full h-full rounded-full border-2 backdrop-blur-md
                  transition-all duration-300 overflow-hidden group
                  ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
                  ${colors.border} bg-gradient-to-br ${colors.bg}
                  ${hoveredNode === node.id ? `shadow-2xl ${colors.glow}` : 'shadow-lg shadow-black/20'}
                `}
                            >
                                {unlocked && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                )}

                                {status === 'available' && (
                                    <motion.div
                                        className="absolute inset-0 rounded-full"
                                        style={{
                                            background: 'conic-gradient(from 0deg, transparent, rgba(99, 102, 241, 0.3), transparent)',
                                        }}
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                    />
                                )}

                                <div className="relative z-10 p-2 md:p-4 flex flex-col items-center justify-center h-full text-center">
                                    <div className={`mb-1 ${status === 'locked' ? 'opacity-40' : ''}`}>
                                        {status === 'mastered' ? (
                                            <CheckCircle2 className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} text-emerald-400`} />
                                        ) : status === 'locked' ? (
                                            <Lock className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} text-zinc-500`} />
                                        ) : (
                                            <Sparkles className={`${isMobile ? 'w-5 h-5' : 'w-8 h-8'} text-indigo-400`} />
                                        )}
                                    </div>

                                    <h3 className={`${isMobile ? 'text-[10px]' : 'text-sm'} font-bold mb-1 line-clamp-2 px-1 ${status === 'locked' ? 'text-zinc-500' : 'text-white'
                                        }`}>
                                        {node.title}
                                    </h3>

                                    <span className={`${isMobile ? 'text-[8px] px-1 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full ${status === 'locked'
                                            ? 'bg-zinc-800 text-zinc-600'
                                            : 'bg-white/10 text-zinc-300'
                                        }`}>
                                        {node.level}
                                    </span>

                                    {mastery > 0 && (
                                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="2" />
                                            <motion.circle
                                                cx="50" cy="50" r="48" fill="none" stroke="url(#progress-gradient)" strokeWidth="2" strokeLinecap="round"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: mastery }}
                                                transition={{ duration: 1, delay: 0.3 }}
                                                strokeDasharray="301.59"
                                                strokeDashoffset={301.59 * (1 - mastery)}
                                            />
                                            <defs>
                                                <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#6366f1" />
                                                    <stop offset="100%" stopColor="#a855f7" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    )}
                                </div>

                                {!isMobile && (
                                    <AnimatePresence>
                                        {hoveredNode === node.id && unlocked && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-64 bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-2xl z-50 pointer-events-none"
                                            >
                                                <p className="text-xs text-zinc-300 mb-2">{node.description}</p>
                                                <div className="flex items-center gap-3 text-xs text-zinc-400">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{node.estimatedMinutes}m</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Trophy className="w-3 h-3" />
                                                        <span>{node.xpReward} XP</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}
                            </motion.button>
                        </motion.div>
                    );
                })}
            </div>

            <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-lg p-2 md:p-3 text-xs">
                <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500" />
                        <span className="text-zinc-400 text-[10px] md:text-xs">Mastered</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500" />
                        <span className="text-zinc-400 text-[10px] md:text-xs">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/50" />
                        <span className="text-zinc-400 text-[10px] md:text-xs">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700" />
                        <span className="text-zinc-400 text-[10px] md:text-xs">Locked</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
