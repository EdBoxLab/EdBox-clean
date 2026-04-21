'use client';

import { ScrollReveal } from './ScrollReveal';

const steps = [
    'Drop your material (PDF, link, or topic).',
    'EdBox creates quizzes, flashcards, notes, and a mind map with AI.',
    'Open Pulse and ask Genie to explain anything in simple words.',
    'Walk into the exam faster, smarter, and confident.',
];

export const HowItWorks = () => {
    return (
        <section id="how-it-works" className="px-6 py-20 md:py-24">
            <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 md:p-10">
                <ScrollReveal>
                    <h2 className="mb-8 text-4xl tracking-[-2px] text-white font-black md:text-5xl">
                        How it works
                    </h2>
                </ScrollReveal>

                <div className="relative pl-4 md:pl-8">
                    <div className="absolute left-[11px] top-2 h-[95%] w-px bg-white/15 md:left-[19px]" />

                    <div className="space-y-8">
                        {steps.map((step, index) => (
                            <ScrollReveal key={step} delayMs={index * 70}>
                                <div className="relative flex items-start gap-4 md:gap-6">
                                    <div className="relative z-10 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-[#8B5CF6]/80 bg-[#0A0A0A] text-[11px] font-semibold text-[#8B5CF6] md:h-8 md:w-8 md:text-xs">
                                        {index + 1}
                                    </div>
                                    <p className="pt-0.5 text-white/80 md:text-lg">
                                        {step}
                                    </p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
