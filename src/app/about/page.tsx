'use client';

import { motion } from 'framer-motion';
import { Target, Rocket, Zap, Users, Brain, Code, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Structured Data Component (inline)
function AboutPageStructuredData() {
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": "EdBox",
        "url": "https://edbox.study",
        "logo": "https://edbox.study/EdBoxLogo.png",
        "description": "AI-powered learning platform that makes you actually understand through active practice, not passive watching.",
        "foundingDate": "2023",
        "founders": [
            {
                "@type": "Person",
                "name": "Inioluwa",
                "jobTitle": "Founder & CEO",
                "description": "Built EdBox after failing exams despite hours of tutorial watching"
            },
            {
                "@type": "Person",
                "name": "Malik",
                "jobTitle": "Co-Founder & CTO",
                "description": "Turned frustration with passive learning into active AI-powered education"
            },
            {
                "@type": "Person",
                "name": "Praise",
                "jobTitle": "Co-Founder & CPO",
                "description": "Designed learning experiences that make understanding inevitable"
            }
        ],
        "sameAs": [
            "https://twitter.com/edbox",
            "https://linkedin.com/company/edbox"
        ],
    };

    const aboutPageSchema = {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        "name": "About EdBox - Our Story & Mission",
        "description": "Learn about EdBox's mission to transform education through active learning and AI-powered personalization.",
        "url": "https://edbox.study/about",
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationSchema)
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(aboutPageSchema)
                }}
            />
        </>
    );
}

export default function AboutPage() {
    const founders = [
        {
            name: "Inioluwa",
            role: "Founder & CEO",
            image: "/about/ini.png",
            bio: "Failed an exam after 4 hours of watching tutorials. Built EdBox so you actually learn instead of just consume.",
            twitter: "#",
            linkedin: "#"
        },
        {
            name: "Malik",
            role: "Co-Founder & CTO",
            image: "/about/malik.jpg",
            bio: "Turned frustration with passive learning into active AI-powered education systems.",
            twitter: "#",
            linkedin: "#"
        },
        {
            name: "Praise",
            role: "Co-Founder & CPO",
            image: "/about/praise.jpg",
            bio: "Designed the learning experience that makes understanding inevitable, not optional.",
            twitter: "#",
            linkedin: "#"
        }
    ];

    const values = [
        {
            icon: Target,
            title: "Understanding Over Completion",
            description: "We don't care if you finish a course. We care if you actually GET IT. Progress means nothing without comprehension."
        },
        {
            icon: Zap,
            title: "Action Over Consumption",
            description: "Watching teaches nothing. Doing teaches everything. Every lesson forces you to apply, not just absorb."
        },
        {
            icon: Brain,
            title: "Adaptive Over One-Size-Fits-All",
            description: "Your learning path adjusts to YOUR understanding in real-time. No more being stuck or bored."
        },
        {
            icon: Code,
            title: "Real Skills Over Certificates",
            description: "We measure what you can BUILD, not what you can memorize. Certificates are worthless without ability."
        }
    ];

    return (
        <main className="bg-gradient-to-b from-[#0A0A0A] via-[#0F0F1A] to-[#0A0A0A] min-h-screen text-white">
            <AboutPageStructuredData />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-[#8B5CF6]/10 blur-[150px] rounded-full pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 backdrop-blur-sm mb-8"
                    >
                        <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                        <span className="text-sm font-semibold">ABOUT EDBOX</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                    >
                        We're done with{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]">
                            bullshit learning
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
                    >
                        EdBox exists because watching 4 hours of tutorials taught us nothing.
                        We built the platform we desperately needed—one that makes you DO instead of just watch.
                    </motion.p>
                </div>
            </section>

            {/* The Problem Section */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl font-bold mb-6">The problem with learning today</h2>
                            <div className="space-y-6 text-gray-400">
                                <p className="text-lg leading-relaxed">
                                    <span className="text-white font-semibold">October 2023. 2 AM. Finals week.</span>
                                </p>
                                <p className="text-lg leading-relaxed">
                                    Four tabs open: ChatGPT, Quizlet, Coursera, Discord.
                                    Hours of content consumed. Zero understanding gained.
                                </p>
                                <p className="text-lg leading-relaxed">
                                    We failed that exam. Not because we didn't study.
                                    Because our tools gave us <span className="text-white font-semibold">content, not comprehension</span>.
                                </p>
                                <p className="text-lg leading-relaxed text-[#8B5CF6] font-semibold">
                                    That night, EdBox was born.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 rounded-2xl p-8 border border-[#8B5CF6]/30 backdrop-blur-sm">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-sm font-mono text-gray-400">Traditional Learning</span>
                                    </div>
                                    <div className="space-y-3 text-gray-300">
                                        <p>❌ Watch 2-hour lecture → Forget in 2 days</p>
                                        <p>❌ ChatGPT gives answers → You learn nothing</p>
                                        <p>❌ Flashcards memorize → Understanding zero</p>
                                        <p>❌ 4 different apps → Constant context switching</p>
                                    </div>
                                    <div className="pt-4 border-t border-white/10">
                                        <p className="text-white font-semibold">Result: Content consumed. Nothing learned.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-20 px-6 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#8B5CF6]/5 to-transparent pointer-events-none" />

                <div className="max-w-6xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 backdrop-blur-sm mb-6">
                            <Rocket className="w-4 h-4 text-[#3B82F6]" />
                            <span className="text-sm font-semibold">OUR MISSION</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Make learning that{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]">
                                actually works
                            </span>
                        </h2>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                            One app. One goal. You actually understand what you're learning.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((value, index) => (
                            <motion.div
                                key={value.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-6 border border-white/10 hover:border-[#8B5CF6]/50 transition-all group"
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <value.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold mb-3">{value.title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{value.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why We're Different */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Why EdBox is different
                        </h2>
                        <p className="text-xl text-gray-400">
                            We don't just claim to be better. Here's exactly how.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "One App, Complete Learning",
                                before: "ChatGPT + Coursera + Quizlet + Discord",
                                after: "Just EdBox",
                                metric: "4 apps → 1 app"
                            },
                            {
                                title: "Practice Until You Get It",
                                before: "Watch lecture → Hope you remember",
                                after: "Do problems → Understand deeply",
                                metric: "0% retention → 85% retention"
                            },
                            {
                                title: "AI That Adapts to YOU",
                                before: "One-size-fits-all courses",
                                after: "Personalized to your level",
                                metric: "Generic → Custom"
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gradient-to-br from-[#8B5CF6]/10 to-[#3B82F6]/10 rounded-2xl p-8 border border-[#8B5CF6]/30"
                            >
                                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-red-400">
                                        <span className="font-mono">❌</span>
                                        <span>{item.before}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-green-400">
                                        <span className="font-mono">✅</span>
                                        <span>{item.after}</span>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <span className="text-[#8B5CF6] font-bold text-sm">{item.metric}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Founders Section */}
            <section className="py-20 px-6 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#3B82F6]/5 to-transparent pointer-events-none" />

                <div className="max-w-6xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 backdrop-blur-sm mb-6">
                            <Users className="w-4 h-4 text-[#8B5CF6]" />
                            <span className="text-sm font-semibold">THE TEAM</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Built by frustrated learners
                        </h2>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                            We're not education experts. We're students who got fed up with learning that doesn't work.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {founders.map((founder, index) => (
                            <motion.div
                                key={founder.name}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15 }}
                                className="group"
                            >
                                <div className="relative mb-6 overflow-hidden rounded-2xl aspect-square">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 group-hover:scale-110 transition-transform duration-500" />
                                    <Image
                                        src={founder.image}
                                        alt={founder.name}
                                        fill
                                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                </div>

                                <h3 className="text-2xl font-bold mb-1">{founder.name}</h3>
                                <p className="text-[#8B5CF6] font-semibold mb-3">{founder.role}</p>
                                <p className="text-gray-400 text-sm leading-relaxed mb-4">{founder.bio}</p>

                                <div className="flex gap-3">
                                    <Link
                                        href={founder.twitter}
                                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#8B5CF6] hover:border-[#8B5CF6] transition-all"
                                    >
                                        <span className="text-xs">𝕏</span>
                                    </Link>

                                    <Link
                                        href={founder.linkedin}
                                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#3B82F6] hover:border-[#3B82F6] transition-all"
                                    >
                                        <span className="text-xs">in</span>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { number: "1,000+", label: "Active Students" },
                            { number: "10,000+", label: "Courses Generated" },
                            { number: "85%", label: "Retention Rate" },
                            { number: "4.8/5", label: "Student Rating" }
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div className="text-5xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] bg-clip-text text-transparent mb-2">
                                    {stat.number}
                                </div>
                                <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 rounded-3xl p-12 border border-[#8B5CF6]/30 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B5CF6]/20 blur-[100px] rounded-full" />

                        <h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">
                            Ready to actually learn?
                        </h2>
                        <p className="text-xl text-gray-400 mb-8 relative z-10">
                            Join 1,000+ students who stopped watching and started doing.
                        </p>

                        <Link
                            href="/signup"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white font-bold rounded-xl hover:scale-105 transition-transform relative z-10"
                        >
                            Start Learning Free
                            <Sparkles className="w-5 h-5" />
                        </Link>

                        <p className="text-sm text-gray-500 mt-6 relative z-10">
                            No credit card • Free forever • 5 minutes to first course
                        </p>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}

