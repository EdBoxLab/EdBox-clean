'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// NOTE: The timeframe state is not used for now, but is kept for future implementation

const LeaderboardRow = ({ entry }: { entry: any }) => (
    <div className={`flex items-center p-3 rounded-lg transition-all ${entry.isUser ? 'bg-purple-600 scale-105' : 'bg-gray-800'}`}>
        <span className={`font-bold text-lg w-10 ${entry.rank <= 3 ? 'text-yellow-400' : 'text-gray-400'}`}>{entry.rank}</span>
        <img src={entry.avatar_url || 'https://i.pravatar.cc/150?u=a-user'} alt={entry.username} className="w-10 h-10 rounded-full mx-4" />
        <span className="flex-grow font-semibold text-white">{entry.isUser ? "You" : entry.username}</span>
        <div className="flex items-center text-yellow-400 mr-4">
            <span className="font-bold mr-1">🔥</span> {entry.streak}
        </div>
        <span className="font-bold text-lg text-cyan-400">{entry.xp.toLocaleString()} XP</span>
    </div>
);

const CircleLeaderboardRow = ({ entry }: { entry: any }) => (
     <div className="flex items-center p-3 rounded-lg bg-gray-800">
        <span className={`font-bold text-lg w-10 ${entry.rank <= 3 ? 'text-yellow-400' : 'text-gray-400'}`}>{entry.rank}</span>
        <span className="flex-grow font-semibold text-white ml-4">{entry.name}</span>
        <span className="font-bold text-lg text-cyan-400">{entry.total_xp.toLocaleString()} XP</span>
    </div>
);

export default function LeaderboardsPage() {
  const [timeframe, setTimeframe] = useState('allTime');
  const [userLeaderboard, setUserLeaderboard] = useState<any[]>([]);
  const [circleLeaderboard, setCircleLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/leaderboards');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setUserLeaderboard(data.users);
        setCircleLeaderboard(data.circles);
      } catch (error) {
        console.error("Failed to fetch leaderboards:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboards();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                Leaderboards
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                See how you stack up against the competition.
            </p>
        </div>

        {/* Individual Leaderboard */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-12 border border-gray-700">
            <h2 className="text-3xl font-bold mb-4">Top Learners</h2>
            <div className="flex justify-center mb-6 bg-gray-900 rounded-full p-1">
                <button onClick={() => setTimeframe('daily')} className={`px-6 py-2 rounded-full font-semibold ${timeframe === 'daily' ? 'bg-purple-600' : ''}`}>Daily</button>
                <button onClick={() => setTimeframe('weekly')} className={`px-6 py-2 rounded-full font-semibold ${timeframe === 'weekly' ? 'bg-purple-600' : ''}`}>Weekly</button>
                <button onClick={() => setTimeframe('allTime')} className={`px-6 py-2 rounded-full font-semibold ${timeframe === 'allTime' ? 'bg-purple-600' : ''}`}>All-Time</button>
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
                </div>
            ) : (
                <div className="space-y-2">
                    {userLeaderboard.map(entry => <LeaderboardRow key={entry.rank} entry={entry} />)}
                </div>
            )}
        </div>

        {/* Circle Leaderboard */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <h2 className="text-3xl font-bold mb-4">Top Study Circles</h2>
            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
                </div>
            ) : (
                <div className="space-y-2">
                    {circleLeaderboard.map(entry => <CircleLeaderboardRow key={entry.rank} entry={entry} />)}
                </div>
            )}
        </div>

      </div>
    </div>
  );
}
