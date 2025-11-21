'use client';

import React from 'react';

// Mock data for rewards
const mockRewards = [
    { id: 'r1', title: 'Exclusive Sticker Pack', cost: 500, type: 'sticker' },
    { id: 'r2', title: 'Genie Roast Credits (x3)', cost: 1000, type: 'feature' },
    { id: 'r3', title: '1 Month Premium', cost: 2500, type: 'premium' },
    { id: 'r4', title: 'Creator Course: Advanced CSS', cost: 5000, type: 'course' },
];

const RewardCard = ({ reward, userCoins }: { reward: any, userCoins: number }) => {
    const canAfford = userCoins >= reward.cost;
    const iconMap: Record<string, string> = {
        sticker: '🎨',
        feature: '✨',
        premium: '👑',
        course: '🎓'
    }

    return (
        <div className={`p-5 rounded-lg border ${canAfford ? 'border-gray-700 bg-gray-800' : 'border-gray-800 bg-gray-800/50'}`}>
            <div className="text-3xl mb-3">{iconMap[reward.type]}</div>
            <h3 className="text-xl font-bold text-white">{reward.title}</h3>
            <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-lg text-yellow-400">{reward.cost} EdCoins</span>
                <button 
                    disabled={!canAfford}
                    className={`font-bold py-2 px-4 rounded-lg transition-colors ${canAfford 
                        ? 'bg-green-600 text-white hover:bg-green-500' 
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`
                    }
                >
                    {canAfford ? 'Redeem' : 'Not enough coins'}
                </button>
            </div>
        </div>
    );
};

export default function ReferralsPage() {
    const userCoins = 1250;
    const referralCode = 'FRIEND-12345';
    const referralLink = `https://edbox.com/join?ref=${referralCode}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        // Add a toast notification in a real app
        alert('Referral link copied to clipboard!');
    };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                Refer & Earn
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                Invite your friends to EdBox and unlock exclusive rewards.
            </p>
        </div>

        {/* Referral Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 mb-12 text-center">
            <h2 className="text-3xl font-bold mb-2">Your Balance: <span className="text-yellow-300">{userCoins} EdCoins</span></h2>
            <p className="text-indigo-200 mb-6">Share your unique link to start earning.</p>
            <div className="bg-gray-900/50 rounded-lg p-4 flex items-center justify-center max-w-md mx-auto">
                <span className="text-gray-300 font-mono text-lg mr-4">{referralLink}</span>
                <button onClick={copyToClipboard} className="bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-400">Copy</button>
            </div>
        </div>

        {/* Rewards Section */}
        <div>
            <h2 className="text-3xl font-bold mb-6 border-l-4 border-yellow-400 pl-4">Redeem Rewards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockRewards.map(reward => (
                    <RewardCard key={reward.id} reward={reward} userCoins={userCoins} />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
