// src/app/about/layout.tsx
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

    // Open Graph
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

    // Twitter
    twitter: {
        card: 'summary_large_image',
        site: '@edbox',
        creator: '@edbox',
        title: 'About EdBox - Learning Built by Frustrated Students',
        description: 'Born from 2 AM exam failures. Built to make learning actually work through doing, not watching.',
        images: ['https://edbox.study/og-about.png'],
    },

    // Alternate URLs
    alternates: {
        canonical: 'https://edbox.study/about',
    },

    // Robots
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
        // AI crawlers

    },
    other: {
        'ChatGPT-User': 'allow',
        'GPTBot': 'allow',
        'Google-Extended': 'allow',
        'anthropic-ai': 'allow',
        'ClaudeBot': 'allow',
        'PerplexityBot': 'allow',
    },

    // Additional metadata
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


// src/app/about/structured-data.tsx
export function AboutPageStructuredData() {
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
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "NG"
        }
    };

    const aboutPageSchema = {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        "name": "About EdBox - Our Story & Mission",
        "description": "Learn about EdBox's mission to transform education through active learning and AI-powered personalization.",
        "url": "https://edbox.study/about",
        "mainEntity": {
            "@type": "Organization",
            "name": "EdBox",
            "description": "Learning platform that prioritizes understanding over content consumption"
        }
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