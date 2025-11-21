'use client';

import React from 'react';

// Mock data for initial implementation
const mockMoments = [
  {
    id: '1',
    user: { name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice' },
    genieReaction: 'cheer',
    context: 'Nailed a tough quiz on Quantum Physics!',
    timestamp: '2h ago',
    likes: 42,
    comments: 5,
  },
  {
    id: '2',
    user: { name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=bob' },
    genieReaction: 'roast', // A fun addition!
    context: 'When you forget the formula for photosynthesis...',
    timestamp: '5h ago',
    likes: 128,
    comments: 12,
  },
  {
    id: '3',
    user: { name: 'Charlie', avatar: 'https://i.pravatar.cc/150?u=charlie' },
    genieReaction: 'wink',
    context: 'Finally understood recursion thanks to Genie.',
    timestamp: '1d ago',
    likes: 78,
    comments: 8,
  },
];

// A component to render the Genie sticker/reaction
const GenieSticker = ({ reaction }: { reaction: string }) => {
    const stickerMap: Record<string, string> = {
        cheer: '🎉',
        roast: '🔥',
        wink: '😉',
        hype: '🚀',
        default: '🤖',
        sad: '😢'
    };
    return <div className="text-6xl absolute -bottom-5 -right-2 transform rotate-12">{stickerMap[reaction] || '🤖'}</div>
}

const MomentCard = ({ moment }: { moment: any }) => (
    <div className="bg-gray-800 rounded-2xl p-6 relative overflow-hidden border border-gray-700 hover:border-purple-500 transition-all">
        <div className="flex items-start">
            <img src={moment.user.avatar} alt={moment.user.name} className="w-12 h-12 rounded-full mr-4" />
            <div>
                <p className="font-bold">{moment.user.name}</p>
                <p className="text-gray-400 text-sm">{moment.timestamp}</p>
            </div>
        </div>
        <p className="mt-4 text-lg">{moment.context}</p>
        <GenieSticker reaction={moment.genieReaction} />
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
            <div>
                <button className="text-red-500 hover:text-red-400 transition-colors">❤️ {moment.likes}</button>
                <button className="text-blue-500 hover:text-blue-400 transition-colors ml-4">💬 {moment.comments}</button>
            </div>
            <button className="bg-purple-600 hover:bg-purple-500 text-white py-1 px-4 rounded-full text-sm font-semibold">Share</button>
        </div>
    </div>
);

export default function GenieMomentsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Genie Moments
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                Share your learning journey highs (and lows) with the world.
            </p>
        </div>

        <div className="space-y-8">
            {mockMoments.map(moment => (
                <MomentCard key={moment.id} moment={moment} />
            ))}
        </div>
      </div>
    </div>
  );
}
