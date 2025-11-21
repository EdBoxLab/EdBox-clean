'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Star, Shuffle, Trophy } from 'lucide-react';

const FeatureCard = ({ title, description, href, icon: Icon }: { title: string, description: string, href?: string, icon: React.ElementType }) => {
    const content = (
        <div className="feature-placeholder">
            <Icon className="mx-auto mb-4 h-12 w-12 text-purple-400" />
            <h2>{title}</h2>
            <p>{description}</p>
        </div>
    );

    if (href) {
        return <Link href={href} passHref>{content}</Link>;
    }
    return content;
};


export default function SocialPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6 md:p-8">
      <style jsx>{`
        .feature-placeholder {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        @media (min-width: 640px) {
          .feature-placeholder {
            padding: 24px;
          }
        }
        .feature-placeholder:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        .feature-placeholder h2 {
            font-size: 1.25rem;
            font-weight: bold;
            margin-bottom: 8px;
            color: #A78BFA;
        }
        @media (min-width: 640px) {
          .feature-placeholder h2 {
            font-size: 1.5rem;
          }
        }
        .feature-placeholder p {
          font-size: 0.875rem;
        }
        @media (min-width: 640px) {
          .feature-placeholder p {
            font-size: 1rem;
          }
        }
        a {
            text-decoration: none;
            color: inherit;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
             Socials
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-gray-400 max-w-2xl mx-auto px-4">
            Learn together, compete for glory, and share your favorite moments. Welcome to the social side of learning.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <FeatureCard 
                title="Study Circles" 
                description="Small, invite-only learning squads." 
                href="/socials/study-circles"
                icon={Users}
            />
            <FeatureCard 
                title="Creator Profiles" 
                description="Follow your favorite creators." 
                href="/socials/creator-profiles"
                icon={Star}
            />
            <FeatureCard 
                title="Content Remix" 
                description="Remix flashcards and quizzes." 
                href="/socials/content-remix"
                icon={Shuffle}
            />
            <FeatureCard 
                title="Leaderboards" 
                description="Compete on streaks and XP." 
                href="/socials/leaderboards"
                icon={Trophy}
            />
        </div>
      </div>
    </div>
  );
}
