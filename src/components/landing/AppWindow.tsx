'use client';

import { motion } from 'framer-motion';

export const AppWindow = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`rounded-xl border border-white/10 bg-[#0A0A0A] shadow-2xl shadow-indigo-500/10 overflow-hidden ${className}`}
        >
            {/* Window Controls */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FEBC2E]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
                </div>
                <div className="mx-auto w-1/3 h-5 rounded-md bg-white/5"></div>
            </div>

            {/* Window Content */}
            <div className="relative">
                {children}
            </div>
        </motion.div>
    );
};
