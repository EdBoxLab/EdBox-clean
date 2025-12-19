'use client';

import { useState, useEffect } from 'react';
import { Share2, MessageCircle, Send, Mail, Copy, Check, Users } from 'lucide-react';
import {
  ShareableContent,
  shareToTwitter,
  shareToFacebook,
  shareToLinkedIn,
  shareToWhatsApp,
  shareToTelegram,
  shareViaEmail,
  copyShareLink,
  shareNative,
  trackShare,
  getShareCount
} from '@/lib/services/sharing-service';

interface ShareButtonProps {
  content: ShareableContent;
  userId?: string;
  variant?: 'button' | 'icon' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export default function ShareButton({
  content,
  userId,
  variant = 'button',
  size = 'md',
  showCount = false,
  className = ''
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [isNativeShareAvailable, setIsNativeShareAvailable] = useState(false);

  useEffect(() => {
    // Check if native share is available
    setIsNativeShareAvailable(!!navigator.share);
    
    // Load share count if requested
    if (showCount) {
      getShareCount(content.type, content.id).then(setShareCount);
    }
  }, [content.type, content.id, showCount]);

  const handleShare = async (platform: string, shareFunction: () => void | Promise<void>) => {
    try {
      await shareFunction();
      await trackShare(content, platform, userId);
      setIsOpen(false);
      
      // Update share count
      if (showCount) {
        setShareCount(prev => prev + 1);
      }
    } catch (error) {
      console.error(`Failed to share to ${platform}:`, error);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyShareLink(content);
    if (success) {
      setCopied(true);
      await trackShare(content, 'copy_link', userId);
      setTimeout(() => setCopied(false), 2000);
      
      if (showCount) {
        setShareCount(prev => prev + 1);
      }
    }
  };

  const handleNativeShare = async () => {
    const success = await shareNative(content);
    if (success) {
      await trackShare(content, 'native_share', userId);
      setIsOpen(false);
      
      if (showCount) {
        setShareCount(prev => prev + 1);
      }
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const renderTrigger = () => {
    const baseClasses = `inline-flex items-center gap-2 rounded-lg transition-colors ${sizeClasses[size]} ${className}`;
    
    if (variant === 'icon') {
      return (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`${baseClasses} bg-gray-100 hover:bg-gray-200 text-gray-700`}
        >
          <Share2 className={iconSizes[size]} />
        </button>
      );
    }
    
    if (variant === 'minimal') {
      return (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`${baseClasses} text-gray-500 hover:text-gray-700`}
        >
          <Share2 className={iconSizes[size]} />
          Share
        </button>
      );
    }
    
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${baseClasses} bg-blue-600 hover:bg-blue-700 text-white font-medium`}
      >
        <Share2 className={iconSizes[size]} />
        Share
        {showCount && shareCount > 0 && (
          <span className="bg-blue-500 text-xs px-1.5 py-0.5 rounded-full">
            {shareCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="relative">
      {renderTrigger()}
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Share Menu */}
          <div className="absolute top-full mt-2 right-0 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[280px]">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Share this {content.type}</h3>
              <p className="text-xs text-gray-500 mt-1 truncate">{content.title}</p>
            </div>
            
            <div className="space-y-2">
              {/* Native Share (Mobile) */}
              {isNativeShareAvailable && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4 text-blue-500" />
                  Share via...
                </button>
              )}

              {/* Study Circles */}
              <button
                onClick={() => {
                  // This will be handled by the ShareModal for better UX
                  setIsOpen(false);
                  // Trigger ShareModal with circles tab
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4 text-purple-500" />
                Share to Study Circle
              </button>

              {/* Direct Message */}
              <button
                onClick={() => {
                  // This will be handled by the ShareModal for better UX
                  setIsOpen(false);
                  // Trigger ShareModal with messages tab
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-green-500" />
                Send to Friend
              </button>
              
              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              
              {/* Social Media Platforms */}
              <button
                onClick={() => handleShare('twitter', () => shareToTwitter(content))}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-4 h-4 text-blue-400">𝕏</div>
                Share on X (Twitter)
              </button>
              
              <button
                onClick={() => handleShare('facebook', () => shareToFacebook(content))}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-4 h-4 text-blue-600 font-bold">f</div>
                Share on Facebook
              </button>
              
              <button
                onClick={() => handleShare('linkedin', () => shareToLinkedIn(content))}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-4 h-4 text-blue-700 font-bold">in</div>
                Share on LinkedIn
              </button>
              
              <button
                onClick={() => handleShare('whatsapp', () => shareToWhatsApp(content))}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-green-500" />
                Share on WhatsApp
              </button>
              
              <button
                onClick={() => handleShare('telegram', () => shareToTelegram(content))}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4 text-blue-500" />
                Share on Telegram
              </button>
              
              <button
                onClick={() => handleShare('email', () => shareViaEmail(content))}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4 text-gray-500" />
                Share via Email
              </button>
            </div>
            
            {showCount && shareCount > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  Shared {shareCount} time{shareCount !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Quick Share Buttons (for inline use)
export function QuickShareButtons({ content, userId, className = '' }: {
  content: ShareableContent;
  userId?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const success = await copyShareLink(content);
    if (success) {
      setCopied(true);
      await trackShare(content, 'copy_link', userId);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleCopyLink}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Copy Link"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
      
      <button
        onClick={() => {
          shareToTwitter(content);
          trackShare(content, 'twitter', userId);
        }}
        className="p-2 text-gray-500 hover:text-blue-400 hover:bg-gray-100 rounded-lg transition-colors"
        title="Share on X (Twitter)"
      >
        <div className="w-4 h-4 text-center font-bold">𝕏</div>
      </button>
      
      <button
        onClick={() => {
          shareToFacebook(content);
          trackShare(content, 'facebook', userId);
        }}
        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="Share on Facebook"
      >
        <div className="w-4 h-4 text-center font-bold text-blue-600">f</div>
      </button>
      
      <button
        onClick={() => {
          shareToLinkedIn(content);
          trackShare(content, 'linkedin', userId);
        }}
        className="p-2 text-gray-500 hover:text-blue-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Share on LinkedIn"
      >
        <div className="w-4 h-4 text-center font-bold text-blue-700 text-xs">in</div>
      </button>
    </div>
  );
}