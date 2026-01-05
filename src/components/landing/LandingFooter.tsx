'use client';

import Link from 'next/link';

export const LandingFooter = () => {
    return (
        <footer className="py-20 px-6 border-t border-white/5 bg-[#0A0A0A]">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-2">
                    <span className="text-[#9CA3AF] text-sm">EdBox © 2025</span>
                </div>

                <nav className="flex items-center gap-8">
                    {['About', 'Blog', 'Twitter', 'Email Us'].map((item) => (
                        <Link
                            key={item}
                            href="#"
                            className="text-sm text-[#6B7280] hover:text-white transition-colors"
                        >
                            {item}
                        </Link>
                    ))}
                </nav>
            </div>
        </footer>
    );
};
