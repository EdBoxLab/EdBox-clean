'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export const LandingHeader = () => {
    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 bg-[#0A0A0A]/40 backdrop-blur-2xl border-b border-white/[0.03]"
        >
            <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-3 group relative">
                    {/* Living Logo Glow */}
                    <motion.div
                        className="absolute inset-0 bg-[#8B5CF6]/20 blur-xl rounded-full"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/10 p-1 bg-zinc-900 group-hover:border-[#8B5CF6]/50 transition-colors">
                        <Image
                            src="/logo_new.ico"
                            alt="EdBox Logo"
                            fill
                            className="object-contain p-1 w-full h-full scale-125"
                            priority
                        />
                    </div>
                    <span className="font-black text-xl tracking-tight text-white group-hover:text-[#8B5CF6] transition-colors">EdBox</span>
                </Link>

                <nav className="hidden lg:flex items-center gap-8">
                    {[
                        { name: 'Why EdBox?', href: '#how-it-works' },
                        { name: 'Features', href: '#features' },
                        { name: 'About', href: '/about' }
                    ].map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="text-[13px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <Link
                    href="/login"
                    className="text-xs font-black uppercase tracking-widest text-[#9CA3AF] hover:text-white transition-colors"
                >
                    Login
                </Link>
                <Link
                    href="/signup"
                    className="group relative flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden"
                >
                    {/* Organic Shimmer */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.05] to-transparent"
                        animate={{
                            x: ['-200%', '200%'],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                    <span className="relative z-10">Start Free</span>
                    <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
        </motion.header>
    );
};
