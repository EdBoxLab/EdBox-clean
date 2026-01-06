import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://edbox.com';

export const metadata: Metadata = {
  title: 'EdBox - AI-Powered Learning Platform | Learn Smarter with AI',
  description: 'Transform your learning with EdBox - AI-powered platform that generates personalized flashcards, quizzes, and study guides. Join 100,000+ students learning smarter with 24/7 AI tutoring.',
  keywords: [
    'AI learning platform',
    'AI study tools',
    'personalized learning',
    'AI flashcard generator',
    'AI tutor',
    'adaptive learning',
    'online learning',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${siteUrl}/about`,
    siteName: 'EdBox',
    title: 'EdBox - AI-Powered Learning Platform',
    description: 'Learn smarter with AI-generated study materials and 24/7 tutoring.',
    images: [
      {
        url: `${siteUrl}/og-about.jpg`,
        width: 1200,
        height: 630,
        alt: 'EdBox AI Learning Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EdBox - AI-Powered Learning Platform',
    description: 'AI-powered learning with personalized study materials',
    images: [`${siteUrl}/og-about.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}