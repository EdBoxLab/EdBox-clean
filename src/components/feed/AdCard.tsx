
import React, { useEffect } from 'react';

export interface AdProps {
    adClient?: string;
    adSlot?: string;
}

export const AdCard: React.FC<AdProps> = ({
    adClient = "ca-pub-XXXXXXXXXXXXXX", // Replace with your AdSense Client ID
    adSlot = "YYYYYYYYYY" // Replace with your Ad Slot ID
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
        <div className="relative h-full w-full flex flex-col justify-center items-center bg-gray-900 overflow-hidden rounded-2xl border border-gray-800 p-4">
            {/* Sponsored Badge */}
            <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sponsored</span>
            </div>

            <div className="w-full text-center">
                {/* AdSense Unit */}
                <ins className="adsbygoogle"
                    style={{ display: 'block', width: '100%', height: '100%' }}
                    data-ad-client={adClient}
                    data-ad-slot={adSlot}
                    data-ad-format="auto"
                    data-full-width-responsive="true"></ins>

                {/* Fallback / Placeholder for Development */}
                <div className="mt-4 text-xs text-gray-600">
                    AdSense Placeholder ({adClient} / {adSlot})
                </div>
            </div>
        </div>
    );
};
