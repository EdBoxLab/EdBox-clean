'use client';

import { useState, useEffect } from 'react';
import { X, Share2, Users, TrendingUp, Copy, Check, MessageCircle, Send } from 'lucide-react';
import ShareButton, { QuickShareButtons } from './ShareButton';
import { 
  ShareableContent, 
  generateShareUrl, 
  copyShareLink, 
  trackShare,
  shareToStudyCircle,
  shareViaDirectMessage,
  getUserStudyCircles,
  getUserContacts
} from '@/lib/services/sharing-service';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ShareableContent;
  userId?: string;
  shareStats?: {
    totalShares: number;
    uniqueSharers: number;
    recentShares: Array<{
      platform: string;
      sharedAt: string;
      userName?: string;
    }>;
  };
}

export default function ShareModal({
  isOpen,
  onClose,
  content,
  userId,
  shareStats
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'external' | 'circles' | 'messages'>('external');
  const [studyCircles, setStudyCircles] = useState<Array<{id: string, name: string, member_count: number}>>([]);
  const [contacts, setContacts] = useState<Array<{id: string, name: string, avatar?: string}>>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [sharing, setSharing] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShareUrl(generateShareUrl(content));
      loadStudyCircles();
      loadContacts();
    }
  }, [isOpen, content]);

  const loadStudyCircles = async () => {
    const circles = await getUserStudyCircles();
    setStudyCircles(circles);
  };

  const loadContacts = async () => {
    const userContacts = await getUserContacts();
    setContacts(userContacts);
  };

  const handleCopyLink = async () => {
    const success = await copyShareLink(content);
    if (success) {
      setCopied(true);
      await trackShare(content, 'copy_link', userId);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleShareToCircle = async (circleId: string, circleName: string) => {
    setSharing(circleId);
    try {
      const success = await shareToStudyCircle(content, circleId, customMessage);
      if (success) {
        await trackShare(content, 'study_circle', userId);
        // Show success feedback
        alert(`Shared to ${circleName}!`);
        onClose();
      } else {
        alert('Failed to share to circle. Please try again.');
      }
    } catch (error) {
      console.error('Share to circle failed:', error);
      alert('Failed to share to circle. Please try again.');
    } finally {
      setSharing(null);
    }
  };

  const handleDirectMessage = async (recipientId: string, recipientName: string) => {
    setSharing(recipientId);
    try {
      const success = await shareViaDirectMessage(content, recipientId, customMessage);
      if (success) {
        await trackShare(content, 'direct_message', userId);
        // Show success feedback
        alert(`Sent to ${recipientName}!`);
        onClose();
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Direct message failed:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSharing(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Share {content.type}</h2>
              <p className="text-sm text-gray-500">Help others discover great content</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4">
            {content.imageUrl && (
              <img
                src={content.imageUrl}
                alt={content.title}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{content.title}</h3>
              {content.creatorName && (
                <p className="text-sm text-gray-500 mt-1">by {content.creatorName}</p>
              )}
              {content.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {content.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Share Stats */}
        {shareStats && (shareStats.totalShares > 0 || shareStats.uniqueSharers > 0) && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-900">
                  {shareStats.totalShares} shares
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-900">
                  {shareStats.uniqueSharers} people
                </span>
              </div>
            </div>
            
            {shareStats.recentShares.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Recent activity:</p>
                <div className="space-y-1">
                  {shareStats.recentShares.slice(0, 3).map((share, index) => (
                    <div key={index} className="flex items-center justify-between text-xs text-gray-600">
                      <span>Shared on {share.platform}</span>
                      <span>{new Date(share.sharedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Share Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('circles')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'circles'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Study Circles
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'messages'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Direct Message
            </button>
            <button
              onClick={() => setActiveTab('external')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'external'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Share2 className="w-4 h-4 inline mr-2" />
              External
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'circles' && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Share to Study Circle</h3>
              
              {/* Custom Message */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-2">Add a message (optional)</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={`Check out this ${content.type}: "${content.title}"`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              {/* Study Circles List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {studyCircles.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No study circles found</p>
                ) : (
                  studyCircles.map((circle) => (
                    <button
                      key={circle.id}
                      onClick={() => handleShareToCircle(circle.id, circle.name)}
                      disabled={sharing === circle.id}
                      className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {circle.name[0]}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{circle.name}</p>
                          <p className="text-xs text-gray-500">{circle.member_count} members</p>
                        </div>
                      </div>
                      {sharing === circle.id ? (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Send Direct Message</h3>
              
              {/* Custom Message */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-2">Add a message (optional)</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={`Hey! Check out this ${content.type}: "${content.title}"`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              {/* Contacts List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {contacts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No contacts found</p>
                ) : (
                  contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleDirectMessage(contact.id, contact.name)}
                      disabled={sharing === contact.id}
                      className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {contact.avatar ? (
                            <img src={contact.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            contact.name[0]
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{contact.name}</p>
                        </div>
                      </div>
                      {sharing === contact.id ? (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'external' && (
            <div>
              {/* Copy Link */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      copied
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 inline mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 inline mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Social Share Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Share on Social Media
                </label>
                
                <div className="flex justify-center">
                  <ShareButton
                    content={content}
                    userId={userId}
                    variant="minimal"
                    size="lg"
                    className="w-full justify-center"
                  />
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <QuickShareButtons
                    content={content}
                    userId={userId}
                    className="justify-center"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Network Effects Message */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-b-xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-3">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Spread the Knowledge!</h4>
            <p className="text-sm text-gray-600">
              When you share great content, you help build a stronger learning community. 
              Every share helps someone discover something new! 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing share modal state
export function useShareModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ShareableContent | null>(null);

  const openShareModal = (shareableContent: ShareableContent) => {
    setContent(shareableContent);
    setIsOpen(true);
  };

  const closeShareModal = () => {
    setIsOpen(false);
    setContent(null);
  };

  return {
    isOpen,
    content,
    openShareModal,
    closeShareModal
  };
}