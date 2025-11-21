'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Loader2, Users, BookOpen, Share2 } from 'lucide-react';
import ShareSetModal from '@/components/socials/ShareSetModal';

// Types
interface CircleMember {
    user_id: string;
    username: string;
    avatar_url: string;
}

interface SharedStudySet {
    id: number;
    title: string;
    description: string;
    username: string;
    avatar_url: string;
    shared_at: string;
}

interface CircleDetails {
    id: number;
    name: string;
    description: string;
    creator_username: string;
    member_count: number;
    members: CircleMember[];
}

export default function CircleDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const circleId = typeof id === 'string' ? parseInt(id, 10) : NaN;

    const [circle, setCircle] = useState<CircleDetails | null>(null);
    const [studySets, setStudySets] = useState<SharedStudySet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchCircleDetails = useCallback(async () => {
        if (isNaN(circleId)) return;
        try {
            const response = await fetch(`/api/circles/${circleId}`);
            if (!response.ok) {
                if (response.status === 404) notFound();
                throw new Error(`Failed to fetch circle: ${response.statusText}`);
            }
            return await response.json();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            return null;
        }
    }, [circleId, notFound]);

    const fetchSharedStudySets = useCallback(async () => {
        if (isNaN(circleId)) return [];
        try {
            const response = await fetch(`/api/circles/${circleId}/sets`);
            if (!response.ok) {
                throw new Error(`Failed to fetch study sets: ${response.statusText}`);
            }
            return await response.json();
        } catch (err) {
            // Don't set a page-level error for this, just fail silently
            console.error(err);
            return [];
        }
    }, [circleId]);

    const loadAllData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const [circleData, setsData] = await Promise.all([
            fetchCircleDetails(),
            fetchSharedStudySets(),
        ]);
        if (circleData) setCircle(circleData);
        if (setsData) setStudySets(setsData);
        setIsLoading(false);
    }, [fetchCircleDetails, fetchSharedStudySets]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    const handleShare = async (studySetId: number) => {
        if (isNaN(circleId)) return;
        const response = await fetch(`/api/circles/${circleId}/sets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ study_set_id: studySetId }),
        });

        if (!response.ok) {
            const { error } = await response.json();
            throw new Error(error || 'Failed to share the study set.');
        }
        
        // Refresh the list of shared sets
        const updatedSets = await fetchSharedStudySets();
        setStudySets(updatedSets);
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen bg-gray-900"><Loader2 className="h-16 w-16 animate-spin text-purple-400" /></div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen bg-gray-900 text-red-400">Error: {error}</div>;
    }

    if (!circle) {
        return null; // notFound() would have been called
    }

    return (
        <>
            <ShareSetModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onShare={handleShare}
                circleId={circleId}
            />
            <div className="min-h-screen bg-gray-900 text-white p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-gray-800 p-6 rounded-lg mb-8 shadow-lg">
                        <h1 className="text-4xl font-bold text-white mb-2">{circle.name}</h1>
                        <p className="text-gray-400 text-lg mb-4">{circle.description}</p>
                        <div className="flex items-center text-sm text-gray-500">
                            <span>Created by <span className="font-semibold text-purple-400">{circle.creator_username}</span></span>
                            <span className="mx-2">|</span>
                            <Users className="h-4 w-4 mr-1.5" />
                            <span>{circle.member_count} Members</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content: Shared Study Sets */}
                        <div className="lg:col-span-2">
                            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold flex items-center">
                                        <BookOpen className="h-6 w-6 mr-3 text-purple-400"/>
                                        Shared Study Sets
                                    </h2>
                                    <button
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
                                        onClick={() => setIsModalOpen(true)}
                                    >
                                        <Share2 className="h-4 w-4 mr-2"/>
                                        Share Set
                                    </button>
                                </div>
                                {studySets.length > 0 ? (
                                    <ul className="space-y-4">
                                        {studySets.map(set => (
                                            <li key={set.id} className="bg-gray-700 p-4 rounded-lg flex items-start justify-between hover:bg-gray-600 transition-colors cursor-pointer" onClick={() => router.push(`/study-sets/${set.id}`)}>
                                                <div>
                                                    <p className="font-bold text-lg text-white">{set.title}</p>
                                                    <p className="text-sm text-gray-400">{set.description}</p>
                                                    <div className="flex items-center mt-2 text-xs text-gray-500">
                                                        <img src={set.avatar_url || 'https://i.pravatar.cc/150?u=' + set.username} alt={set.username} className="w-5 h-5 rounded-full mr-2"/>
                                                        Shared by <span className="font-semibold text-purple-400 mx-1">{set.username}</span>
                                                        <span>- {new Date(set.shared_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg p-12">
                                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                                        <h3 className="text-lg font-semibold">No Shared Sets</h3>
                                        <p>Be the first to share a study set in this circle!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar: Members List */}
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-fit">
                            <h3 className="text-xl font-bold mb-4">Members</h3>
                            <ul className="space-y-4">
                                {circle.members.map(member => (
                                    <li key={member.user_id} className="flex items-center">
                                        <img src={member.avatar_url || 'https://i.pravatar.cc/150?u=' + member.user_id} alt={member.username} className="w-10 h-10 rounded-full mr-3"/>
                                        <span className="font-medium text-gray-300">{member.username}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
