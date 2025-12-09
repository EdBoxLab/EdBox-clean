import React from "react";

interface ArcVisualizerProps {
    data: number[];
}

export const ArcVisualizer: React.FC<ArcVisualizerProps> = ({ data }) => {
    if (!data || data.length < 2) return <div className="text-zinc-500 text-xs italic">No data available</div>;

    const max = 100;
    const width = 300;
    const height = 100;
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (val / max) * height;
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="w-full overflow-hidden rounded bg-zinc-900/50 p-2 border border-zinc-800">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
                <path d={`M ${points}`} fill="none" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
                {/* Area under curve */}
                <path d={`M 0,${height} L ${points} L ${width},${height} Z`} fill="url(#gradient)" opacity="0.2" />
                <defs>
                    <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1 uppercase font-mono">
                <span>Intro</span>
                <span>Climax</span>
                <span>Resolution</span>
            </div>
        </div>
    );
};
