import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const links = [
    { label: 'StudyKit', href: '#studykit' },
    { label: 'Pulse', href: '#pulse' },
    { label: 'Feed', href: '#feed' },
    { label: 'Pricing', href: '/pricing' },
];

export const LandingHeader = () => {
    return (
        <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0A0A0A]/85 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center gap-3">
                    <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-white/15 bg-white/[0.03]">
                        <Image src="/logo_new.ico" alt="EdBox" fill className="object-contain p-1" priority />
                    </div>
                    <span className="text-lg tracking-[-1px] text-white font-black">EdBox</span>
                </Link>

                <nav className="hidden items-center gap-6 md:flex">
                    {links.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="text-sm text-white/70 transition-colors hover:text-white"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <Link href="/login" className="text-sm text-white/75 transition-colors hover:text-white">
                        Log in
                    </Link>
                    <Link
                        href="/signup"
                        className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                    >
                        Start free
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </header>
    );
};
