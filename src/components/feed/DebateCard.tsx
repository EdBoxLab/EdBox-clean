import React, { useState } from 'react';
import { Scale, Users, MessageSquare, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface DebateCardProps {
    item: {
        title: string;
        topic: string;
        viewpoint_a: string;
        viewpoint_b: string;
        question: string;
    };
    isActive: boolean;
}

export const DebateCard: React.FC<DebateCardProps> = ({ item, isActive }) => {
    const [selected, setSelected] = useState<'a' | 'b' | null>(null);

    return (
        <div className="w-full text-center flex flex-col justify-center items-center h-full px-6 relative overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 w-full max-w-sm"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-cyan-500/20 rounded-full border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                        <Scale className="w-8 h-8 text-cyan-400" />
                    </div>
                </div>

                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-2 block">Intellectual Debate</span>
                <h3 className="text-2xl font-black text-white mb-8 leading-tight">{item.title}</h3>

                <div className="grid gap-4 mb-8">
                    <button 
                        onClick={() => setSelected('a')}
                        className={`p-5 rounded-2xl border transition-all text-left relative overflow-hidden group ${
                            selected === 'a' 
                                ? 'bg-cyan-500/20 border-cyan-500 shadow-lg' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <span className="text-[10px] font-black text-cyan-400/60 uppercase tracking-widest mb-1 block">PERSPECTIVE A</span>
                        <p className="text-sm text-white/90 leading-relaxed font-medium">{item.viewpoint_a}</p>
                        {selected === 'a' && <ShieldCheck className="absolute top-4 right-4 w-4 h-4 text-cyan-400" />}
                    </button>

                    <button 
                        onClick={() => setSelected('b')}
                        className={`p-5 rounded-2xl border transition-all text-left relative overflow-hidden group ${
                            selected === 'b' 
                                ? 'bg-purple-500/20 border-purple-500 shadow-lg' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <span className="text-[10px] font-black text-purple-400/60 uppercase tracking-widest mb-1 block">PERSPECTIVE B</span>
                        <p className="text-sm text-white/90 leading-relaxed font-medium">{item.viewpoint_b}</p>
                        {selected === 'b' && <ShieldCheck className="absolute top-4 right-4 w-4 h-4 text-purple-400" />}
                    </button>
                </div>

                <div className="bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3 mb-1">
                        <MessageSquare className="w-3 h-3 text-white/40" />
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">The Big Question</span>
                    </div>
                    <p className="text-xs text-white/60 font-medium italic">"{item.question}"</p>
                </div>
            </motion.div>

            {/* Background Decor */}
            <div className="absolute top-1/2 left-0 w-1/2 h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 right-0 w-1/2 h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
        </div>
    );
};
