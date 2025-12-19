'use client';

import { useState } from 'react';
import { Users, MessageCircle, Send } from 'lucide-react';
import { 
  ShareableContent, 
  shareToStudyCircle, 
  shareViaDirectMessage,
  trackShare 
} from '@/lib/services/sharing-service';

interface InternalShareButtonsProps {
  content: ShareableContent;
  userId?: string;
  className?: string;
  onShareComplete?: () => void;
}

export default function InternalShareButtons({ 
  content, 
  userId, 
  className = '',
  onShareComplete 
}: InternalShareButtonsProps) {
  const [showCircleModal, setShowCircleModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const handleQuickShare = async (type: 'circle' | 'message') => {
    if (type === 'circle') {
      setShowCircleModal(true);
    } else {
      setShowMessageModal(true);
    }
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={() => handleQuickShare('circle')}
          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          title="Share to Study Circle"
        >
          <Users className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => handleQuickShare('message')}
          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="Send to Friend"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Share Modals would go here - for now, we'll use the main ShareModal */}
    </>
  );
}

// Quick action component for study circles
export function QuickCircleShare({ 
  content, 
  userId, 
  circleId, 
  circleName,
  onSuccess 
}: {
  content: ShareableContent;
  userId?: string;
  circleId: string;
  circleName: string;
  onSuccess?: () => void;
}) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      const success = await shareToStudyCircle(content, circleId);
      if (success) {
        await trackShare(content, 'study_circle', userId);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Quick share failed:', error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
    >
      {sharing ? (
        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Send className="w-4 h-4" />
      )}
      Share to {circleName}
    </button>
  );
}

// Quick action component for direct messages
export function QuickMessageShare({ 
  content, 
  userId, 
  recipientId, 
  recipientName,
  onSuccess 
}: {
  content: ShareableContent;
  userId?: string;
  recipientId: string;
  recipientName: string;
  onSuccess?: () => void;
}) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      const success = await shareViaDirectMessage(content, recipientId);
      if (success) {
        await trackShare(content, 'direct_message', userId);
        onSuccess?.();
      }
    } catch (error) {
      console.error('Quick message failed:', error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
    >
      {sharing ? (
        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Send className="w-4 h-4" />
      )}
      Send to {recipientName}
    </button>
  );
}