'use client';

import React, { useState, useEffect } from 'react';
import { Share2, Users, User, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareButtonProps {
  contentType: 'course' | 'study_kit' | 'note';
  contentId: string;
  contentTitle?: string;
}

interface Circle {
  id: number;
  name: string;
  description: string;
}

export function ShareButton({ contentType, contentId, contentTitle }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareMode, setShareMode] = useState<'circle' | 'user'>('circle');
  const [selectedCircle, setSelectedCircle] = useState<number | null>(null);
  const [recipientUserId, setRecipientUserId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen && shareMode === 'circle') {
      loadCircles();
    }
  }, [isOpen, shareMode]);

  const loadCircles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/study-circles');
      const data = await res.json();
      setCircles(data.circles || []);
    } catch (error) {
      console.error('Failed to load circles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (shareMode === 'circle' && !selectedCircle) return;
    if (shareMode === 'user' && !recipientUserId.trim()) return;

    try {
      setSharing(true);
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentId,
          circleId: shareMode === 'circle' ? selectedCircle : null,
          recipientUserId: shareMode === 'user' ? recipientUserId : null,
          message,
        }),
      });

      if (res.ok) {
        setShareSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setShareSuccess(false);
          setSelectedCircle(null);
          setRecipientUserId('');
          setMessage('');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to share:', error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Share {contentTitle || 'Content'}
              </h2>

              {shareSuccess ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                  <p className="text-green-500 text-lg font-semibold">
                    Shared successfully!
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setShareMode('circle')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${
                        shareMode === 'circle'
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Circle
                    </button>
                    <button
                      onClick={() => setShareMode('user')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${
                        shareMode === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Direct
                    </button>
                  </div>

                  {shareMode === 'circle' ? (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select Circle
                      </label>
                      {loading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                      ) : circles.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          No circles found. Create one first!
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {circles.map((circle) => (
                            <button
                              key={circle.id}
                              onClick={() => setSelectedCircle(circle.id)}
                              className={`w-full text-left p-3 rounded-lg transition-all ${
                                selectedCircle === circle.id
                                  ? 'bg-blue-600/20 border border-blue-500'
                                  : 'bg-zinc-800 hover:bg-zinc-700 border border-transparent'
                              }`}
                            >
                              <p className="font-medium text-white">{circle.name}</p>
                              {circle.description && (
                                <p className="text-sm text-gray-400 truncate">
                                  {circle.description}
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Recipient User ID
                      </label>
                      <input
                        type="text"
                        value={recipientUserId}
                        onChange={(e) => setRecipientUserId(e.target.value)}
                        placeholder="Enter user ID..."
                        className="w-full bg-zinc-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {contentType === 'course' && 'Course will be auto-personalized for recipient'}
                      </p>
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message (optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Add a message..."
                      rows={3}
                      className="w-full bg-zinc-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleShare}
                      disabled={
                        sharing ||
                        (shareMode === 'circle' && !selectedCircle) ||
                        (shareMode === 'user' && !recipientUserId.trim())
                      }
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {sharing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sharing...
                        </>
                      ) : (
                        'Share'
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
