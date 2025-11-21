'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, UserPlus, UserCheck, Users } from 'lucide-react';

const CreatorCard = ({ creator, onFollow, onUnfollow, isProcessing }: { creator: any, onFollow: (id: string) => void, onUnfollow: (id: string) => void, isProcessing: boolean }) => (
    <div className="bg-gray-800 p-5 rounded-lg text-center transition-all hover:scale-105">
        <img src={creator.avatar_url || 'https://i.pravatar.cc/150?u=a-creator'} alt={creator.username} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-purple-500" />
        <h3 className="font-bold text-xl text-white">{creator.username}</h3>
        <p className="text-sm text-gray-400 mt-1 mb-3">{creator.bio || 'A passionate learner and creator.'}</p>
        <div className="flex items-center justify-center text-gray-500 mb-4">
            <Users className="h-4 w-4 mr-1.5" />
            <span>{creator.follower_count.toLocaleString()} Followers</span>
        </div>
        {creator.is_following ? (
            <button 
                onClick={() => onUnfollow(creator.user_id)}
                disabled={isProcessing}
                className="w-full py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-700 transition-colors flex items-center justify-center text-sm disabled:opacity-50">
                <UserCheck className="h-4 w-4 mr-1.5"/>
                Following
            </button>
        ) : (
            <button 
                onClick={() => onFollow(creator.user_id)}
                disabled={isProcessing}
                className="w-full py-2 px-4 rounded-md bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center text-sm disabled:opacity-50">
                <UserPlus className="h-4 w-4 mr-1.5"/>
                Follow
            </button>
        )}
    </div>
);

export default function CreatorProfilesPage() {
    const [creators, setCreators] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchCreators = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/creators');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setCreators(data);
        } catch (error) {
            console.error("Failed to fetch creators:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCreators();
    }, []);

    const handleFollow = async (id: string) => {
        setProcessingId(id);
        // Optimistic update
        setCreators(creators.map(c => c.user_id === id ? { ...c, is_following: true, follower_count: c.follower_count + 1 } : c));
        try {
            await fetch(`/api/creators/${id}/follow`, { method: 'POST' });
        } catch (error) {
            // Revert on failure
            setCreators(creators.map(c => c.user_id === id ? { ...c, is_following: false, follower_count: c.follower_count - 1 } : c));
            console.error('Failed to follow creator:', error);
        }
        setProcessingId(null);
    };

    const handleUnfollow = async (id: string) => {
        setProcessingId(id);
        // Optimistic update
        setCreators(creators.map(c => c.user_id === id ? { ...c, is_following: false, follower_count: c.follower_count - 1 } : c));
        try {
            await fetch(`/api/creators/${id}/follow`, { method: 'DELETE' });
        } catch (error) {
            // Revert on failure
            setCreators(creators.map(c => c.user_id === id ? { ...c, is_following: true, follower_count: c.follower_count + 1 } : c));
            console.error('Failed to unfollow creator:', error);
        }
        setProcessingId(null);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                        Creator Profiles
                    </h1>
                    <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                        Discover and follow the most influential learners on the platform.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-60">
                        <Loader2 className="h-16 w-16 animate-spin text-purple-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {creators.map(creator => (
                            <CreatorCard key={creator.user_id} creator={creator} onFollow={handleFollow} onUnfollow={handleUnfollow} isProcessing={processingId === creator.user_id} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
