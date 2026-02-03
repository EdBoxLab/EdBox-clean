'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

const testimonials = [
    {
        text: "I haven't opened my textbook in 3 weeks. EdBox generates better quizzes anyway.",
        author: "Sarah J.",
        role: "Med Student",
        delay: 0
    },
    {
        text: "The 'Smart Feed' is dangerous. I sat down for 5 mins and ended up studying for an hour.",
        author: "Mike T.",
        role: "Computer Science",
        delay: 0.1
    },
    {
        text: "Finally an app that doesn't feel like it was built in 2005. The UI is gorgeous.",
        author: "Elena R.",
        role: "Design Student",
        delay: 0.2
    }
];

export const SocialProof = () => {
    return (
        <section className="py-40 px-6 bg-[#050505] relative overflow-hidden">

            {/* Background Data Flow */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex items-center justify-center gap-4 mb-12"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="w-2 h-2 rounded-full bg-[#8B5CF6] shadow-[0_0_15px_#8B5CF6]"
                        />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">What users say</span>
                    </motion.div>

                    <h2 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">
                        Loved by <span className="text-[#8B5CF6]">students.</span>
                    </h2>

                    {/* Alive Data HUD */}
                    <div className="max-w-md mx-auto relative p-8 rounded-[32px] bg-white/[0.02] border border-white/[0.05] backdrop-blur-3xl overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#8B5CF6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex justify-between items-end mb-6 relative z-10">
                            <div className="text-left">
                                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Active Users</div>
                                <div className="text-4xl font-black text-white tabular-nums">100+<span className="text-[#8B5CF6]">_</span></div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest mb-1">Status: Growing</div>
                                <div className="flex gap-1 h-4 items-end">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: [4, 16, 4] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                                            className="w-1 bg-[#8B5CF6]/40 rounded-full"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Alive Progress Bar */}
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/[0.02]">
                            <motion.div
                                initial={{ x: '-100%' }}
                                whileInView={{ x: '0%' }}
                                transition={{ duration: 2, ease: "circOut" }}
                                className="h-full bg-gradient-to-r from-transparent via-[#8B5CF6] to-white relative"
                            >
                                <motion.div
                                    animate={{ left: ['0%', '100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    className="absolute top-0 bottom-0 w-20 bg-white/20 blur-md"
                                />
                            </motion.div>
                        </div>

                        <div className="mt-4 flex justify-between text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                            <span>Join the early group</span>
                            <span>100+ pioneers together</span>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-10 rounded-[32px] bg-white/[0.02] border border-white/[0.05] hover:border-[#8B5CF6]/30 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[320px]"
                        >
                            <div className="absolute top-0 left-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <MessageCircle className="w-16 h-16 text-white" />
                            </div>

                            <p className="text-xl text-zinc-300 font-medium leading-relaxed relative z-10">"{t.text}"</p>

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/[0.05] flex items-center justify-center text-xs font-black text-[#8B5CF6] group-hover:bg-[#8B5CF6] group-hover:text-white transition-all shadow-xl">
                                    {t.author[0]}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-white">{t.author}</span>
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{t.role}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
