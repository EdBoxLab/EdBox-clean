'use client';

import Link from 'next/link';

export const LandingFooter = () => {
    return (
        <footer className="border-t border-white/[0.08] bg-[#0A0A0A] px-6 py-10">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <p className="text-sm text-white/55">EdBox © 2026</p>
                <nav className="flex items-center gap-5">
                    <Link href="/about" className="text-sm text-white/60 transition-colors hover:text-white">
                        About
                    </Link>
                    <Link href="/pricing" className="text-sm text-white/60 transition-colors hover:text-white">
                        Pricing
                    </Link>
                    <Link href="/login" className="text-sm text-white/60 transition-colors hover:text-white">
                        Log in
                    </Link>
                </nav>
            </div>
        </footer>
    );
};
