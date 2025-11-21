'use client';

import React from 'react';

// Mock data for initial implementation
const mockRemixableContent = [
    {
        id: 'q1',
        type: 'Quiz',
        title: 'JavaScript Fundamentals',
        creator: { name: 'CodeWizard', avatar: 'https://i.pravatar.cc/150?u=codewizard' },
        remixes: 12,
        plays: '1.5k'
    },
    {
        id: 'f1',
        type: 'Flashcards',
        title: 'Organic Chemistry Reactions',
        creator: { name: 'ChemQueen', avatar: 'https://i.pravatar.cc/150?u=chemqueen' },
        remixes: 5,
        plays: '890'
    },
    {
        id: 'c1',
        type: 'Micro-Course',
        title: 'The Basics of Photoshop',
        creator: { name: 'DesignDan', avatar: 'https://i.pravatar.cc/150?u=designdan' },
        remixes: 2,
        plays: '4.2k'
    }
];

const mockChallenges = [
    { 
        id: 'ch1', 
        title: 'Flashcard Frenzy: Biology', 
        description: 'Create the best flashcard deck for introductory biology.', 
        participants: 128, 
        endsIn: '3 days'
    },
    { 
        id: 'ch2', 
        title: 'Quiz Battle: 90s Trivia', 
        description: 'Think you know the 90s? Prove it.', 
        participants: 450, 
        endsIn: '24 hours'
    },
];

const RemixCard = ({ item }: { item: any }) => (
    <div className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-green-500 transition-colors">
        <div className="flex items-center mb-3">
            <img src={item.creator.avatar} alt={item.creator.name} className="w-8 h-8 rounded-full mr-3" />
            <span className="text-sm text-gray-400">Created by {item.creator.name}</span>
        </div>
        <h3 className="text-xl font-bold text-green-400">{item.title}</h3>
        <p className="text-gray-500 mt-1">{item.type}</p>
        <div className="flex justify-between items-center mt-4 text-sm">
            <span className="text-gray-400">{item.plays} plays</span>
            <span className="text-gray-400">{item.remixes} remixes</span>
            <button className="bg-green-600 hover:bg-green-500 text-white font-semibold py-1 px-4 rounded-full">Remix</button>
        </div>
    </div>
);

const ChallengeCard = ({ challenge }: { challenge: any }) => (
    <div className="bg-gradient-to-br from-purple-800 to-indigo-900 rounded-lg p-5 border border-purple-700 hover:border-yellow-400 transition-colors">
        <h3 className="text-xl font-bold text-yellow-300">{challenge.title}</h3>
        <p className="text-indigo-200 mt-2">{challenge.description}</p>
        <div className="flex justify-between items-center mt-4 text-sm">
            <span className="font-semibold text-indigo-200">{challenge.participants} participants</span>
            <span className="text-yellow-400 font-bold">Ends in {challenge.endsIn}</span>
            <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-1 px-4 rounded-full">Join</button>
        </div>
    </div>
);

export default function ContentRemixPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
                Remix & Challenge
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                Build on others' work and compete in community challenges.
            </p>
        </div>

        {/* Remix Section */}
        <div className="mb-16">
            <h2 className="text-3xl font-bold mb-6 border-l-4 border-green-500 pl-4">Remix Popular Content</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockRemixableContent.map(item => <RemixCard key={item.id} item={item} />)}
            </div>
        </div>

        {/* Challenges Section */}
        <div>
            <h2 className="text-3xl font-bold mb-6 border-l-4 border-yellow-400 pl-4">Join a Challenge</h2>
            <div className="space-y-6">
                 {mockChallenges.map(challenge => <ChallengeCard key={challenge.id} challenge={challenge} />)}
            </div>
        </div>
      </div>
    </div>
  );
}
