'use client';

import React, { useState, useEffect } from 'react';
import { SkillGraphView } from '@/components/SkillGraphView';
import { SkillGraph, SkillNode, CourseCategory, Challenge } from '@/lib/courseCreation/types';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X, Sparkles, Trophy, Clock, Target, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';


const DEMO_SKILL_GRAPH: SkillGraph = {
    id: 'demo_graph_1',
    userId: 'demo_user',
    goal: 'Build AI Chatbots',
    nodes: [
        {
            id: 'skill_1',
            title: 'Understand API Basics',
            description: 'Learn how to make HTTP requests and handle responses',
            category: CourseCategory.Technology,
            engine: 'codestudio',
            level: 'Beginner',
            estimatedMinutes: 15,
            prerequisites: [],
            masteryThreshold: { minSuccessRate: 0.8, challengesRequired: 3 },
            xpReward: 100,
        },
        {
            id: 'skill_2',
            title: 'Write Your First Function',
            description: 'Create reusable code with functions',
            category: CourseCategory.Technology,
            engine: 'codestudio',
            level: 'Beginner',
            estimatedMinutes: 20,
            prerequisites: ['skill_1'],
            masteryThreshold: { minSuccessRate: 0.8, challengesRequired: 3 },
            xpReward: 150,
        },
        {
            id: 'skill_3',
            title: 'Connect to Gemini API',
            description: 'Integrate Google Gemini for AI responses',
            category: CourseCategory.Technology,
            engine: 'codestudio',
            level: 'Intermediate',
            estimatedMinutes: 25,
            prerequisites: ['skill_2'],
            masteryThreshold: { minSuccessRate: 0.8, challengesRequired: 3 },
            xpReward: 200,
        },
        {
            id: 'skill_4',
            title: 'Build Conversation Logic',
            description: 'Manage chat history and context',
            category: CourseCategory.Technology,
            engine: 'codestudio',
            level: 'Intermediate',
            estimatedMinutes: 30,
            prerequisites: ['skill_3'],
            masteryThreshold: { minSuccessRate: 0.8, challengesRequired: 3 },
            xpReward: 250,
        },
        {
            id: 'skill_5',
            title: 'Design Chat UI',
            description: 'Create an interactive chat interface',
            category: CourseCategory.Technology,
            engine: 'codestudio',
            level: 'Advanced',
            estimatedMinutes: 35,
            prerequisites: ['skill_4'],
            masteryThreshold: { minSuccessRate: 0.8, challengesRequired: 3 },
            xpReward: 300,
        },
    ],
    edges: [
        { from: 'skill_1', to: 'skill_2' },
        { from: 'skill_2', to: 'skill_3' },
        { from: 'skill_3', to: 'skill_4' },
        { from: 'skill_4', to: 'skill_5' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const DEMO_CHALLENGES: Record<string, Challenge> = {
    skill_1: {
        id: 'ch_1',
        skillId: 'skill_1',
        title: 'Fetch User Data from API',
        description: 'Create a function that fetches user data from a REST API endpoint',
        engine: 'codestudio',
        difficulty: 'Easy',
        starterCode: `// Fetch user data from the API\nasync function fetchUser(userId) {\n  // Your code here\n  \n}\n\n// Test your function\nfetchUser(1).then(user => console.log(user));`,
        validationCriteria: [{ type: 'ai_eval', rubric: 'Did they correctly use the fetch API?' }],
        hints: ['Use the fetch() function', 'Remember to await the response', 'Parse JSON with .json()'],
        explanation: 'APIs allow programs to communicate. The fetch() function makes HTTP requests to retrieve data.',
    },
};

export default function DemoCourse() {
    const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
    const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSkillClick = (skillId: string) => {
        const skill = DEMO_SKILL_GRAPH.nodes.find(n => n.id === skillId);
        if (skill) {
            setSelectedSkill(skill);
            setCurrentChallenge(DEMO_CHALLENGES[skillId] || null);
        }
    };

    const handleCloseEngine = () => {
        setSelectedSkill(null);
        setCurrentChallenge(null);
    };

    const renderEngine = () => {
        if (!currentChallenge) return null;
        const engineStr = String(currentChallenge.engine).toLowerCase();
        switch (engineStr) {
            default:
                return <div className="text-white">Engine not available for this skill.</div>;
        }
    };

    const totalMinutes = DEMO_SKILL_GRAPH.nodes.reduce((sum, n) => sum + n.estimatedMinutes, 0);
    const totalXP = DEMO_SKILL_GRAPH.nodes.reduce((sum, n) => sum + n.xpReward, 0);

    return (
        <div className="min-h-screen bg-gray-900 text-white pb-20 md:pb-0 overflow-hidden">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">

                {/* INSANE HERO SECTION */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 md:mb-12 relative"
                >
                    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl p-6 md:p-12">
                        {/* Morphing Gradient Background */}
                        <motion.div
                            className="absolute inset-0"
                            animate={{
                                background: [
                                    'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #667eea 100%)',
                                    'linear-gradient(135deg, #f093fb 0%, #667eea 25%, #764ba2 50%, #4facfe 75%, #f093fb 100%)',
                                    'linear-gradient(135deg, #4facfe 0%, #f093fb 25%, #667eea 50%, #764ba2 75%, #4facfe 100%)',
                                    'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #667eea 100%)',
                                ],
                            }}
                            transition={{
                                duration: 10,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            style={{
                                backgroundSize: '400% 400%',
                            }}
                        />

                        {/* Warping Blobs */}
                        <motion.div
                            className="absolute w-96 h-96 rounded-full blur-3xl opacity-30"
                            style={{
                                background: 'radial-gradient(circle, rgba(255,0,255,0.8) 0%, transparent 70%)',
                                left: mousePosition.x * 0.05,
                                top: mousePosition.y * 0.05,
                            }}
                            animate={{
                                scale: [1, 1.2, 0.8, 1],
                                x: [0, 50, -50, 0],
                                y: [0, -30, 30, 0],
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                        <motion.div
                            className="absolute w-80 h-80 rounded-full blur-3xl opacity-30"
                            style={{
                                background: 'radial-gradient(circle, rgba(0,255,255,0.8) 0%, transparent 70%)',
                                right: mousePosition.x * 0.03,
                                bottom: mousePosition.y * 0.03,
                            }}
                            animate={{
                                scale: [1, 0.8, 1.3, 1],
                                x: [0, -40, 40, 0],
                                y: [0, 40, -40, 0],
                            }}
                            transition={{
                                duration: 6,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />

                        {/* Floating Particles */}
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 bg-white rounded-full"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                    y: [0, -100, 0],
                                    opacity: [0, 1, 0],
                                    scale: [0, 1.5, 0],
                                }}
                                transition={{
                                    duration: 3 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2,
                                }}
                            />
                        ))}

                        {/* Grid Overlay */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                                backgroundSize: '50px 50px',
                            }} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 mb-4 md:mb-6">
                                <motion.div
                                    className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border border-white/30"
                                    animate={{
                                        rotate: [0, 10, -10, 0],
                                        scale: [1, 1.1, 0.9, 1],
                                        boxShadow: [
                                            '0 0 20px rgba(255,255,255,0.3)',
                                            '0 0 40px rgba(255,0,255,0.5)',
                                            '0 0 20px rgba(0,255,255,0.5)',
                                            '0 0 20px rgba(255,255,255,0.3)',
                                        ],
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
                                </motion.div>
                                <div className="flex-1">
                                    <motion.p
                                        className="text-xs md:text-sm text-white/90 font-bold uppercase tracking-widest mb-1"
                                        animate={{
                                            opacity: [0.7, 1, 0.7],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                        }}
                                    >
                                        Engine-Native Learning
                                    </motion.p>
                                    <motion.h1
                                        className="text-3xl sm:text-4xl md:text-6xl font-black text-white relative"
                                        style={{
                                            textShadow: '0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(255,0,255,0.3)',
                                        }}
                                    >
                                        {DEMO_SKILL_GRAPH.goal.split('').map((char, i) => (
                                            <motion.span
                                                key={i}
                                                className="inline-block"
                                                animate={{
                                                    y: [0, -10, 0],
                                                    rotateZ: [0, 5, -5, 0],
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    delay: i * 0.1,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                {char === ' ' ? '\u00A0' : char}
                                            </motion.span>
                                        ))}
                                    </motion.h1>
                                </div>
                            </div>

                            <motion.p
                                className="text-sm md:text-lg text-white/95 mb-4 md:mb-6 max-w-2xl font-medium"
                                animate={{
                                    opacity: [0.8, 1, 0.8],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                }}
                            >
                                Master AI development through hands-on practice. No passive videos—just real coding challenges that build your skills progressively.
                            </motion.p>

                            {/* Stats with Glowing Effects */}
                            <div className="flex flex-wrap gap-2 md:gap-4">
                                {[
                                    { icon: Target, label: `${DEMO_SKILL_GRAPH.nodes.length} Skills`, color: '#00ffff' },
                                    { icon: Clock, label: `${totalMinutes} min`, color: '#ff00ff' },
                                    { icon: Trophy, label: `${totalXP} XP`, color: '#ffff00' },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/30 relative overflow-hidden"
                                        whileHover={{ scale: 1.05, borderColor: stat.color }}
                                        whileTap={{ scale: 0.95 }}
                                        animate={{
                                            boxShadow: [
                                                `0 0 10px ${stat.color}40`,
                                                `0 0 20px ${stat.color}60`,
                                                `0 0 10px ${stat.color}40`,
                                            ],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: i * 0.3,
                                        }}
                                    >
                                        <motion.div
                                            animate={{
                                                rotate: 360,
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                                ease: "linear"
                                            }}
                                        >
                                            <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                        </motion.div>
                                        <span className="text-xs md:text-sm font-bold text-white">{stat.label}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Skill Graph */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8 md:mb-12"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
                        <h2 className="text-2xl md:text-3xl font-bold text-white">Your Learning Path</h2>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
                            <Zap className="w-4 h-4" />
                            <span>Tap any skill to start</span>
                        </div>
                    </div>
                    <SkillGraphView graph={DEMO_SKILL_GRAPH} onSkillClick={handleSkillClick} />
                </motion.div>

                {/* How It Works */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
                >
                    {[
                        { icon: Target, title: 'Click a Skill', description: 'Select any unlocked skill node from the graph above', color: 'from-blue-500 to-cyan-500' },
                        { icon: Sparkles, title: 'Practice in Engine', description: 'Solve real challenges in our interactive coding environment', color: 'from-purple-500 to-pink-500' },
                        { icon: Trophy, title: 'Master & Progress', description: 'Unlock new skills as you demonstrate mastery', color: 'from-emerald-500 to-green-500' }
                    ].map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="relative group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl"
                                style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
                            <div className="relative bg-gray-800 rounded-2xl p-4 md:p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                                <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-lg`}>
                                    <step.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-white mb-2">{step.title}</h3>
                                <p className="text-gray-400 text-xs md:text-sm">{step.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

            </div>

            {/* Engine Modal */}
            <AnimatePresence>
                {selectedSkill && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4"
                        onClick={handleCloseEngine}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-7xl h-[95vh] md:h-[90vh] bg-[#18181b] rounded-xl md:rounded-2xl border border-zinc-800 overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="h-14 md:h-16 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6 shrink-0">
                                <div className="flex-1 min-w-0 mr-4">
                                    <h3 className="text-base md:text-lg font-semibold text-white truncate">{selectedSkill.title}</h3>
                                    <p className="text-xs md:text-sm text-zinc-400 truncate">{selectedSkill.description}</p>
                                </div>
                                <button
                                    onClick={handleCloseEngine}
                                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                {renderEngine()}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
