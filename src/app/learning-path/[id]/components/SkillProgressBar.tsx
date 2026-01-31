'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkillProgressBarProps {
    progress: number; // 0 to 100
    height?: string;
    className?: string;
    showLabel?: boolean;
    colorClass?: string;
    trackColorClass?: string;
    animated?: boolean;
    delay?: number;
    roundedClass?: string;
    duration?: number;
}

export default function SkillProgressBar({
    progress,
    height = 'h-1.5',
    className = '',
    showLabel = false,
    colorClass = 'bg-indigo-500',
    trackColorClass = 'bg-gray-700',
    animated = true,
    delay = 0,
    roundedClass = 'rounded-full',
    duration = 1
}: SkillProgressBarProps) {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    return (
        <div className={`w-full ${className}`}>
            {showLabel && (
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-bold">{Math.round(clampedProgress)}%</span>
                </div>
            )}
            <div className={`w-full ${trackColorClass} ${roundedClass} ${height} overflow-hidden`}>
                {animated ? (
                    <motion.div
                        className={`h-full ${roundedClass} ${colorClass}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${clampedProgress}%` }}
                        transition={{ duration: duration, delay: delay, ease: "easeOut" }}
                    />
                ) : (
                    <div
                        className={`h-full ${roundedClass} ${colorClass}`}
                        style={{ width: `${clampedProgress}%` }}
                    />
                )}
            </div>
        </div>
    );
}
