'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { Loader2, Users, BookOpen, Share2 } from 'lucide-react';
import ShareSetModal from '@/components/socials/ShareSetModal';

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

// ✅ Enhanced safe fetch wrapper with better error handling
async function safeFetchJSON(url: string) {
  const res = await fetch(url, { credentials: 'include' });
  
  // Get text first to handle empty responses
  const text = await res.text();
  
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${text || 'No error message'}`);
  }
  
  // Check for empty response
  if (!text || text.trim() === '') {
    throw new Error('Empty response from server');
  }
  
  // Parse JSON safely
  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error('JSON parse error:', text);
    throw new Error('Invalid JSON response from server');
  }
}

export default function CircleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const circleId = Number(id);

  if (isNaN(circleId)) {
    notFound();
  }

  const [circle, setCircle] = useState<CircleDetails | null>(null);
  const [studySets, setStudySets] = useState<SharedStudySet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCircleDetails = useCallback(async () => {
    try {
      const data = await safeFetchJSON(`/api/circles/${circleId}`);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load circle details';
      console.error('Circle details error:', errorMessage);
      setError(errorMessage);
      return null;
    }
  }, [circleId]);

  const fetchSharedStudySets = useCallback(async () => {
    try {
      const data = await safeFetchJSON(`/api/circles/${circleId}/sets`);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Study sets error:', err);
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
    
    if (circleData) {
      setCircle(circleData);
    }
    
    if (setsData) {
      setStudySets(setsData);
    }
    
    setIsLoading(false);
  }, [fetchCircleDetails, fetchSharedStudySets]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleShare = async (studySetId: number) => {
    try {
      const res = await fetch(`/api/circles/${circleId}/sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ study_set_id: studySetId }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to share' }));
        throw new Error(errorData.error || 'Failed to share the study set.');
      }

      // Refresh the study sets list
      const updatedSets = await fetchSharedStudySets();
      setStudySets(updatedSets);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Share error:', err);
      alert(err instanceof Error ? err.message : 'Failed to share study set');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <Loader2 className="h-16 w-16 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-900 text-red-400">
        <p className="text-xl font-semibold mb-4">Error: {error}</p>
        <button 
          onClick={() => loadAllData()}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-gray-400">
        <p className="text-xl">Circle not found</p>
      </div>
    );
  }

  return (
    <>
      <ShareSetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onShare={handleShare}
        circleId={circleId}
      />
      <div className="min-h-screen bg-gray-900 text-white p-6 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gray-800 p-6 rounded-lg mb-8 shadow-lg">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{circle.name}</h1>
            <p className="text-gray-400 text-base sm:text-lg mb-4">{circle.description}</p>
            <div className="flex items-center text-sm text-gray-500">
              <span>
                Created by{' '}
                <span className="font-semibold text-purple-400">{circle.creator_username}</span>
              </span>
              <span className="mx-2">|</span>
              <Users className="h-4 w-4 mr-1.5" />
              <span>{circle.member_count} Members</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Shared Study Sets */}
            <div className="md:col-span-1 lg:col-span-2">
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold flex items-center">
                    <BookOpen className="h-6 w-6 mr-3 text-purple-400" />
                    Shared Study Sets
                  </h2>
                  <button
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Set
                  </button>
                </div>
                {studySets.length > 0 ? (
                  <ul className="space-y-4">
                    {studySets.map(set => (
                      <li
                        key={set.id}
                        className="bg-gray-700 p-4 rounded-lg flex items-start justify-between hover:bg-gray-600 transition-colors cursor-pointer"
                        onClick={() => router.push(`/study-sets/${set.id}`)}
                      >
                        <div>
                          <p className="font-bold text-lg text-white">{set.title}</p>
                          <p className="text-sm text-gray-400">{set.description}</p>
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <img
                              src={set.avatar_url || `https://i.pravatar.cc/150?u=${set.username}`}
                              alt={set.username}
                              className="w-5 h-5 rounded-full mr-2"
                            />
                            Shared by{' '}
                            <span className="font-semibold text-purple-400 mx-1">{set.username}</span>
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
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg lg:sticky lg:top-8 h-fit">
              <h3 className="text-xl font-bold mb-4">Members</h3>
              {circle.members && circle.members.length > 0 ? (
                <ul className="space-y-4">
                  {circle.members.map(member => (
                    <li key={member.user_id} className="flex items-center">
                      <img
                        src={member.avatar_url || `https://i.pravatar.cc/150?u=${member.user_id}`}
                        alt={member.username}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <span className="font-medium text-gray-300">{member.username}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No members to display</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}