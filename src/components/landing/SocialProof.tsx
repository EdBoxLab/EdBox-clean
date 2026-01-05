'use client';

import { motion } from 'framer-motion';

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
        <section className="py-32 px-6 border-t border-white/5 bg-[#0A0A0A]">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-white mb-4">847 students joined this week.</h2>
                    <p className="text-[#9CA3AF]">Here's what they're saying.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: t.delay }}
                            viewport={{ once: true }}
                            className="p-8 rounded-2xl bg-[#0F0F10] border border-white/5 hover:border-[#8B5CF6]/50 transition-colors group"
                        >
                            <p className="text-lg text-[#F3F4F6] mb-6 leading-relaxed">"{t.text}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-[#9CA3AF] group-hover:bg-[#8B5CF6] group-hover:text-white transition-colors">
                                    {t.author[0]}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">{t.author}</div>
                                    <div className="text-xs text-[#6B7280]">{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
