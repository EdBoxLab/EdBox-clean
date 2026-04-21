'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export const FeaturesGrid = () => {
    return (
        <section id="features" className="px-6 py-20 md:py-24">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 md:grid-cols-2">
                <ScrollReveal className="md:col-span-2" delayMs={40}>
                    <article id="pulse" className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 md:p-8">
                        <div className="mb-5 flex items-center justify-between">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70">
                                <span className="h-2 w-2 rounded-full bg-[#8B5CF6] shadow-[0_0_12px_rgba(139,92,246,0.8)] animate-pulse" />
                                Pulse live workspace
                            </div>
                            <span className="text-xs text-white/50">Genie is active</span>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <h3 className="mb-3 text-3xl leading-[1.02] tracking-[-1.8px] text-white font-black">
                                    Pulse helps you understand hard topics, fast.
                                </h3>
                                <p className="text-sm leading-relaxed text-white/70 md:text-base">
                                    Ask Genie a question and Pulse instantly builds simple visuals, clear explanations,
                                    and study views you can actually follow. No jargon, no confusion, just clarity.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-4">
                                <div className="mb-3 text-xs text-white/50">Genie preview</div>
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-sm text-white/80">
                                        Explain glycolysis like I am revising for an exam and show ATP flow.
                                    </div>
                                    <div className="rounded-xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 p-3 text-sm text-[#DDD6FE]">
                                        Built a process map + quick memory anchors. Focus on energy investment vs payoff phases.
                                    </div>
                                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                        <div className="mb-2 text-xs text-white/60">Mini visualization</div>
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                            <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                                                <div className="mb-3 flex items-center gap-1.5">
                                                    <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                                                    <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                                                    <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                                                    <span className="ml-2 text-[10px] text-white/45">editor.ts</span>
                                                </div>
                                                <div className="grid grid-cols-[18px_1fr] gap-x-2 gap-y-1 text-[10px] leading-4 font-mono">
                                                    <span className="text-white/25">1</span><span><span className="text-[#8B5CF6]">const</span> <span className="text-white">quiz</span> <span className="text-white/40">=</span> <span className="text-[#3B82F6]">buildQuiz</span><span className="text-white/40">(</span><span className="text-white/60">material</span><span className="text-white/40">)</span></span>
                                                    <span className="text-white/25">2</span><span><span className="text-white/60">quiz</span><span className="text-white/40">.</span><span className="text-[#3B82F6]">addQuestion</span><span className="text-white/40">(</span><span className="text-[#8B5CF6]">'biology'</span><span className="text-white/40">)</span></span>
                                                    <span className="text-white/25">3</span><span><span className="text-white/60">quiz</span><span className="text-white/40">.</span><span className="text-[#3B82F6]">showAnswer</span><span className="text-white/40">(</span><span className="text-[#8B5CF6]">true</span><span className="text-white/40">)</span></span>
                                                    <span className="text-white/25">4</span><span><span className="text-white/60">return</span> <span className="text-[#10B981]">"ready"</span></span>
                                                </div>
                                            </div>

                                            <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                                                <div className="mb-3 flex items-center justify-between text-[10px] text-white/45">
                                                    <span>Biology</span>
                                                    <span>DNA structure</span>
                                                </div>
                                                <div className="relative mx-auto h-[112px] w-full overflow-hidden rounded-md border border-white/5 bg-[#0D0D13] px-3 py-2">
                                                    <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-[0.25em] text-white/30">
                                                        <span>Biology</span>
                                                        <span>Base pairs</span>
                                                    </div>
                                                    <svg viewBox="0 0 240 96" className="h-[92px] w-full" aria-hidden="true">
                                                        <path
                                                            d="M68 6 C24 18, 24 34, 68 46 C112 58, 112 74, 68 86"
                                                            fill="none"
                                                            stroke="#3B82F6"
                                                            strokeWidth="4"
                                                            strokeLinecap="round"
                                                        />
                                                        <path
                                                            d="M172 6 C216 18, 216 34, 172 46 C128 58, 128 74, 172 86"
                                                            fill="none"
                                                            stroke="#8B5CF6"
                                                            strokeWidth="4"
                                                            strokeLinecap="round"
                                                        />
                                                        <path d="M120 4 L120 92" stroke="rgba(255,255,255,0.09)" strokeDasharray="3 5" />

                                                        {[
                                                            { y: 14, left: 'A', right: 'T' },
                                                            { y: 30, left: 'C', right: 'G' },
                                                            { y: 46, left: 'G', right: 'C' },
                                                            { y: 62, left: 'T', right: 'A' },
                                                            { y: 78, left: 'C', right: 'G' },
                                                        ].map(({ y, left, right }, index) => (
                                                            <g key={index}>
                                                                <line x1="76" y1={String(y)} x2="164" y2={String(y)} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                                                                <circle cx="68" cy={String(y)} r="4.5" fill="#3B82F6" />
                                                                <circle cx="172" cy={String(y)} r="4.5" fill="#8B5CF6" />
                                                                <text x="120" y={String(y + 3)} textAnchor="middle" className="fill-white/65" style={{ fontSize: '9px', fontFamily: 'monospace' }}>
                                                                    {left}:{right}
                                                                </text>
                                                            </g>
                                                        ))}
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                </ScrollReveal>

                <ScrollReveal delayMs={100}>
                    <article id="studykit" className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 md:p-8">
                        <h3 className="mb-3 text-2xl tracking-[-1.6px] text-white font-black">
                            StudyKit
                        </h3>
                        <p className="mb-5 text-white/70">
                            Turn any PDF, link, or topic into AI-generated quizzes, flashcards, notes, and mind maps.
                        </p>
                        <div className="rounded-xl border border-white/[0.08] bg-[#0A0A0A] p-4">
                            <div className="mb-3 flex items-center justify-between text-xs text-white/60">
                                <span>AI pack ready</span>
                                <span>4 formats</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/10">
                                <div className="h-2 w-[74%] rounded-full bg-[#8B5CF6]" />
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/70">
                                <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">Quiz</span>
                                <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">Flashcards</span>
                                <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">Mind map</span>
                            </div>
                        </div>
                    </article>
                </ScrollReveal>

                <ScrollReveal delayMs={150}>
                    <article id="feed" className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 md:p-8">
                        <h3 className="mb-3 text-2xl tracking-[-1.6px] text-white font-black">
                            Feed
                        </h3>
                        <p className="mb-5 text-white/70">
                            A smart learning feed that automatically fills your knowledge gaps before they cost you marks.
                        </p>
                        <div className="space-y-2 rounded-xl border border-white/[0.08] bg-[#0A0A0A] p-4">
                            <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 text-sm text-white/80">
                                Weak spot detected: redox balancing. Added a 4-minute refresher.
                            </div>
                            <div className="rounded-lg border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 p-3 text-sm text-[#DDD6FE]">
                                Completed: confidence rose from 52% to 79%.
                            </div>
                        </div>
                    </article>
                </ScrollReveal>

                <div className="md:col-span-2 mt-2 flex justify-center">
                    <Link
                        href="/signup"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                    >
                        Start free
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
};
