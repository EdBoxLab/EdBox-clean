'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

const avatars = ['A', 'R', 'M', 'T'];

export const HeroSection = () => {
    return (
        <section className="px-6 pb-16 pt-14 md:pt-20">
            <div className="mx-auto w-full max-w-6xl">
                <ScrollReveal>
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/75">
                        <span className="h-2 w-2 rounded-full bg-[#8B5CF6] shadow-[0_0_14px_rgba(139,92,246,0.9)] animate-pulse" />
                        Now in early access
                    </div>
                </ScrollReveal>

                <ScrollReveal delayMs={50}>
                    <h1 className="max-w-4xl text-5xl leading-[0.95] tracking-[-2.2px] text-white font-black md:text-7xl">
                        Study smarter. Grade better.
                    </h1>
                </ScrollReveal>

                <ScrollReveal delayMs={110}>
                    <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
                        Upload your PDF, paste a link, or drop a topic. EdBox uses AI to create quizzes, flashcards,
                        notes, and mind maps from your materials so you study faster, understand more, and get better grades.
                    </p>
                </ScrollReveal>

                <ScrollReveal delayMs={170}>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <Link
                            href="/signup"
                            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                        >
                            Start free
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/pulse"
                            className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.03] px-6 py-3 text-sm text-white transition-colors hover:bg-white/[0.06]"
                        >
                            See Pulse in action
                        </Link>
                    </div>
                </ScrollReveal>

                <ScrollReveal delayMs={230}>
                    <div className="mt-9 flex items-center gap-4">
                        <div className="flex -space-x-2">
                            {avatars.map((avatar) => (
                                <div
                                    key={avatar}
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0A0A0A] bg-white/[0.08] text-xs text-white"
                                >
                                    {avatar}
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-white/65">
                            Students already using EdBox to revise faster every week.
                        </p>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
};
