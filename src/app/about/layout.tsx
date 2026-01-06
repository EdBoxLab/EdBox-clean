import type { Metadata } from 'next';
import { Inter, Spline_Sans } from 'next/font/google';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const splineSans = Spline_Sans({ subsets: ['latin'], variable: '--font-spline' });

export const metadata: Metadata = {
    title: 'EdBox - Learn by Doing',
    description: 'Stop watching videos. Start learning by doing with AI-generated courses, study kits, and interactive challenges.',
};

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`${inter.variable} ${splineSans.variable} font-sans bg-[#0A0A0A] text-[#F3F4F6] min-h-screen selection:bg-[#8B5CF6] selection:text-white`}>
            {children}
        </div>
    );
}
