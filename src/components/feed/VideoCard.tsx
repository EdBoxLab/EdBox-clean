
import React from 'react';
import { VideoFeedItem } from '@/types/feed';
import { Play } from 'lucide-react';

interface VideoCardProps {
    item: VideoFeedItem;
    isActive: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({ item, isActive }) => {
    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
                {item.video_url ? (
                    <iframe
                        src={item.video_url}
                        title={item.title}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-white/50">
                        <Play className="w-12 h-12 opacity-50" />
                    </div>
                )}
            </div>

        </div>
    );
};
