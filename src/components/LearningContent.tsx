'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Lightbulb, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface LearningContentProps {
    content: {
        introduction: string;
        concepts: Array<{ title: string; explanation: string }>;
        examples: Array<{ title: string; code?: string; explanation: string }>;
        pitfalls: string[];
        tips: string[];
        estimatedReadTime: number;
    };
    onComplete: () => void;
}

export const LearningContent: React.FC<LearningContentProps> = ({ content, onComplete }) => {
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-full mb-4">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-indigo-400">{content.estimatedReadTime} min read</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Let's Learn!</h2>
                <p className="text-gray-400">Take your time to understand these concepts before practicing</p>
            </motion.div>

            {/* Introduction */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20"
            >
                <div className="flex items-start gap-3">
                    <BookOpen className="w-6 h-6 text-indigo-400 mt-1 shrink-0" />
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Why This Matters</h3>
                        <p className="text-gray-300 leading-relaxed">{content.introduction}</p>
                    </div>
                </div>
            </motion.div>

            {/* Core Concepts */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
            >
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Lightbulb className="w-6 h-6 text-yellow-400" />
                    Core Concepts
                </h3>
                {content.concepts.map((concept, index) => (
                    <div
                        key={index}
                        className="p-5 bg-gray-800 rounded-xl border border-gray-700 hover:border-indigo-500/50 transition-colors"
                    >
                        <h4 className="text-lg font-bold text-white mb-2">{concept.title}</h4>
                        <p className="text-gray-300 leading-relaxed">{concept.explanation}</p>
                    </div>
                ))}
            </motion.div>

            {/* Examples */}
            {content.examples.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                >
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        Practical Examples
                    </h3>
                    {content.examples.map((example, index) => (
                        <div
                            key={index}
                            className="p-5 bg-gray-800 rounded-xl border border-gray-700"
                        >
                            <h4 className="text-lg font-bold text-white mb-3">{example.title}</h4>
                            {example.code && (
                                <pre className="p-4 bg-gray-900 rounded-lg mb-3 overflow-x-auto">
                                    <code className="text-sm text-green-400">{example.code}</code>
                                </pre>
                            )}
                            <p className="text-gray-300 leading-relaxed">{example.explanation}</p>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Common Pitfalls */}
            {content.pitfalls.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 bg-red-500/10 rounded-2xl border border-red-500/20"
                >
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                        Common Pitfalls to Avoid
                    </h3>
                    <ul className="space-y-2">
                        {content.pitfalls.map((pitfall, index) => (
                            <li key={index} className="flex items-start gap-2 text-gray-300">
                                <span className="text-red-400 mt-1">⚠️</span>
                                <span>{pitfall}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>
            )}

            {/* Quick Tips */}
            {content.tips.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 bg-green-500/10 rounded-2xl border border-green-500/20"
                >
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                        <Lightbulb className="w-6 h-6 text-green-400" />
                        Quick Tips
                    </h3>
                    <ul className="space-y-2">
                        {content.tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2 text-gray-300">
                                <span className="text-green-400 mt-1">💡</span>
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>
            )}

            {/* Complete Button */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center pt-8"
            >
                <button
                    onClick={onComplete}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-indigo-500/50"
                >
                    I'm Ready to Practice! 🚀
                </button>
            </motion.div>
        </div>
    );
};
