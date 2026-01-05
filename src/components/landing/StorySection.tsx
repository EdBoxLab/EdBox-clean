'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export const StorySection = () => {
    return (
        <section className="py-32 px-6 bg-[#0A0A0A]">
            <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-6"
                    >
                        <h2 className="text-3xl font-bold text-white">Why I built this.</h2>
                        <div className="space-y-6 text-[#9CA3AF] text-lg leading-relaxed">
                            <p>
                                I was drowning in PDF slides, 3-hour lecture videos, and messy handwritten notes.
                                I spent more time <em>organizing</em> my study materials than actually studying.
                            </p>
                            <p>
                                I wanted something that just worked. Like magic.
                                Paste a topic, get a quiz. Upload notes, get flashcards.
                            </p>
                            <p>
                                So I built EdBox. It's not a big corporate "LMS" with 500 features.
                                It's a simple, fast tool for students who actually want to learn.
                            </p>
                            <p className="font-medium text-white">
                                We're growing fast (23% this week!), but I still read every email.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            {/* Placeholder for Founder Image - Using a generic energetic avatar if real one not avail */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                                A
                            </div>
                            <div>
                                <div className="text-white font-medium">Ayodeji</div>
                                <div className="text-sm text-[#9CA3AF]">Founder, EdBox</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative bg-[#111113] p-8 rounded-2xl border border-white/5 rotate-3 hover:rotate-0 transition-transform duration-500"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent opacity-50"></div>
                        <p className="text-sm text-[#9CA3AF] mb-4 uppercase tracking-wider font-semibold">Real User Feedback</p>
                        <p className="text-xl text-white italic mb-6">
                            "I just finished a semester's worth of Biology revision in 2 days using the Course Generator. This is actually insane."
                        </p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(s => (
                                <div key={s} className="w-4 h-4 text-[#F59E0B] fill-current">★</div>
                            ))}
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};
