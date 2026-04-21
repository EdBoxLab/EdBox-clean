import type { Metadata } from 'next';
import { Inter, Spline_Sans } from 'next/font/google';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const splineSans = Spline_Sans({ subsets: ['latin'], variable: '--font-spline' });

export const metadata: Metadata = {
    title: 'EdBox - Study Smarter. Grade Better.',
    description: 'EdBox turns your materials into AI quizzes, flashcards, notes, and mind maps so you can study faster and get better grades.',
};

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`${inter.variable} ${splineSans.variable} min-h-screen bg-[#0A0A0A] text-[#F3F4F6] font-sans selection:bg-[#8B5CF6] selection:text-white`}>
            {children}
        </div>
    );
}
