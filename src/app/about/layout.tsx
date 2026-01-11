import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About EdBox - Learning That Actually Works | Our Story & Mission',
    description: 'Meet the team behind EdBox. Born from frustration with passive learning, we built the AI-powered platform that makes you DO instead of just watch. Learn our story.',
    keywords: [
        'EdBox team',
        'about EdBox',
        'EdBox founders',
        'learning platform story',
        'AI education mission',
        'active learning philosophy',
        'EdBox company',
        'learning innovation',
        'education technology team'
    ],
    authors: [
        { name: 'Inioluwa', url: 'https://edbox.study' },
        { name: 'Malik', url: 'https://edbox.study' },
        { name: 'Praise', url: 'https://edbox.study' }
    ],
    creator: 'EdBox',
    publisher: 'EdBox',
    
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://edbox.study/about',
        siteName: 'EdBox',
        title: 'About EdBox - The Learning Platform Built by Frustrated Students',
        description: 'We failed exams after 4 hours of tutorials. So we built EdBox - the platform that makes you actually understand through doing, not just watching.',
        images: [
            {
                url: 'https://edbox.study/og-about.png',
                width: 1200,
                height: 630,
                alt: 'EdBox Founders - Building Learning That Actually Works',
            },
        ],
    },
    
    twitter: {
        card: 'summary_large_image',
        site: '@edbox',
        creator: '@edbox',
        title: 'About EdBox - Learning Built by Frustrated Students',
        description: 'Born from 2 AM exam failures. Built to make learning actually work through doing, not watching.',
        images: ['https://edbox.study/og-about.png'],
    },
    
    alternates: {
        canonical: 'https://edbox.study/about',
    },
    
    robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    
    other: {
        'ChatGPT-User': 'allow',
        'GPTBot': 'allow',
        'Google-Extended': 'allow',
        'anthropic-ai': 'allow',
        'ClaudeBot': 'allow',
        'PerplexityBot': 'allow',
    },
    
    category: 'education',
    classification: 'Educational Technology - Company Information',
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}