import React, { useEffect } from 'react';
import { Play, SkipForward } from 'lucide-react';

export interface AdProps {
    adClient?: string;
    adSlot?: string;
    onSkip?: () => void;
}

export const AdCard: React.FC<AdProps> = ({
    adClient = "ca-pub-7134321558578802",
    adSlot = "8765432109", // Default slot, can be overridden
    onSkip
}) => {

    useEffect(() => {
        try {
            (window as any).adsbygoogle = (window as any).adsbygoogle || [];
            (window as any).adsbygoogle.push({});
        } catch (e) {
            console.error("AdSense error:", e);
        }
    }, []);

    return (
        <div className="relative h-full w-full flex flex-col justify-center items-center bg-black overflow-hidden rounded-2xl border border-white/10 p-4">
            {/* AdSense Script - Local ensures it's loaded for the unit */}
            <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`} crossOrigin="anonymous"></script>
            
            {/* Sponsored Badge */}
            <div className="absolute top-6 left-6 z-20 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Sponsored</span>
            </div>

            {/* Skip Button */}
            {onSkip && (
                <button 
                    onClick={onSkip}
                    className="absolute top-6 right-6 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 transition-all active:scale-95 group flex items-center gap-2"
                >
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">Skip Ad</span>
                    <SkipForward className="w-3 h-3 text-white group-hover:translate-x-0.5 transition-transform" />
                </button>
            )}

            <div className="w-full h-full flex flex-col items-center justify-center relative">
                {/* AdSense Unit */}
                <div className="w-full aspect-video bg-slate-900/50 rounded-xl overflow-hidden flex items-center justify-center border border-white/5 relative">
                    <ins className="adsbygoogle"
                        style={{ display: 'block', width: '100%', height: '100%' }}
                        data-ad-client={adClient}
                        data-ad-slot={adSlot}
                        data-ad-format="video"
                        data-full-width-responsive="true"></ins>
                    
                    {/* Visual Placeholder for Video Ad */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-4 opacity-20">
                        <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center">
                            <Play className="w-6 h-6 fill-white" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Loading Video Ad...</p>
                    </div>
                </div>

                <div className="mt-8 text-center space-y-2 max-w-sm">
                    <h3 className="text-lg font-bold text-white tracking-tight">Interactive Learning Experiences</h3>
                    <p className="text-sm text-white/50 leading-relaxed">Discover how EdBox is revolutionizing education with AI-powered interactive modules.</p>
                </div>
            </div>
        </div>
    );
};
