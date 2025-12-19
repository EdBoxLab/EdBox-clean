'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import ShareButton from './ShareButton';
import { ShareableContent } from '@/lib/services/sharing-service';

interface FloatingShareButtonProps {
  content: ShareableContent;
  userId?: string;
  className?: string;
}

export default function FloatingShareButton({ 
  content, 
  userId, 
  className = '' 
}: FloatingShareButtonProps) {
  return (
    <div 
      className={`group ${className}`}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
      }}
    >
      <ShareButton
        content={content}
        userId={userId}
        variant="icon"
        size="sm"
        className="bg-gray-900/90 hover:bg-gray-800 text-white border border-gray-600 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 opacity-0 group-hover:opacity-100"
      />
    </div>
  );
}