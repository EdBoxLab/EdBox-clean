'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Table as TableIcon, Layout, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomEdBoxTableProps {
    children: React.ReactNode;
    className?: string;
}

export function CustomEdBoxTable({ children, className }: CustomEdBoxTableProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "my-12 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/50 backdrop-blur-xl shadow-2xl",
                className
            )}
        >
            {/* Header / Accent Bar */}
            <div className="bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-xl">
                        <Layout className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400/80">Comparative Matrix</span>
                        <p className="text-[10px] text-zinc-500 font-medium">Extracted with high fidelity from source</p>
                    </div>
                </div>
                <TableIcon className="w-4 h-4 text-zinc-700" />
            </div>

            {/* Table Wrapper */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse text-left">
                    {children}
                </table>
            </div>

            {/* Footer / Info */}
            <div className="px-6 py-3 bg-zinc-900/30 border-t border-zinc-800/50 flex items-center gap-2">
                <Info className="w-3 h-3 text-zinc-600" />
                <span className="text-[10px] text-zinc-600 font-medium italic">
                    This table synthesizes complex data for rapid mastery.
                </span>
            </div>
        </motion.div>
    );
}

export function CustomEdBoxThead({ children }: { children: React.ReactNode }) {
    return (
        <thead className="bg-zinc-900/80">
            {children}
        </thead>
    );
}

export function CustomEdBoxTh({ children }: { children: React.ReactNode }) {
    return (
        <th className="px-6 py-5 text-sm font-bold text-indigo-100 uppercase tracking-wide border-b border-zinc-800">
            {children}
        </th>
    );
}

export function CustomEdBoxTd({ children }: { children: React.ReactNode }) {
    return (
        <td className="px-6 py-5 text-sm text-zinc-300 border-b border-zinc-800/50 leading-relaxed">
            {children}
        </td>
    );
}

export function CustomEdBoxTr({ children }: { children: React.ReactNode }) {
    return (
        <tr className="group hover:bg-indigo-500/5 transition-colors">
            {children}
        </tr>
    );
}
