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
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl"
        >
            <div className="flex items-center gap-12">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                        <Image
                            src="/logo_new.ico"
                            alt="EdBox Logo"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white group-hover:text-gray-200 transition-colors">EdBox</span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    {['About', 'Blog', 'Twitter', 'Email Us'].map((item) => (
                        <Link
                            key={item}
                            href="/about"
                            className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors"
                        >
                            {item}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <Link
                    href="/login"
                    className="text-sm font-medium text-[#F3F4F6] hover:text-white transition-colors"
                >
                    Login
                </Link>
                <Link
                    href="/signup"
                    className="group flex items-center gap-2 bg-[#8B5CF6] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#7C3AED] transition-all hover:pr-5 shadow-lg shadow-purple-500/20"
                >
                    Start for free
                    <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                </Link>
            </div>
        </motion.header>
    );
};
