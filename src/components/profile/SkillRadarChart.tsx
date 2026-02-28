'use client';

import { useRef } from 'react';

interface SkillRadarChartProps {
    labels: string[];
    values: number[];
    size?: number;
}

export default function SkillRadarChart({ labels, values, size = 300 }: SkillRadarChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    if (!labels.length || labels.length < 2) {
        return (
            <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground text-sm rounded-2xl border border-border/30 w-full bg-card/50">
                <svg className="w-10 h-10 mb-3 opacity-15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                </svg>
                <span className="font-semibold text-sm">No verified data yet</span>
                <span className="text-xs text-muted-foreground/60 mt-1.5 max-w-[220px] text-center leading-relaxed">
                    Complete learning sessions to build your domain map.
                </span>
            </div>
        );
    }

    const cx = size / 2;
    const cy = size / 2;
    const radius = (size / 2) * 0.62;
    const levels = 4;
    const count = labels.length;
    const angleStep = (2 * Math.PI) / count;
    const startAngle = -Math.PI / 2;

    const pt = (angle: number, r: number) => ({
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle)
    });

    const polyStr = (r: number) =>
        Array.from({ length: count }, (_, j) => {
            const p = pt(startAngle + j * angleStep, r);
            return `${p.x},${p.y}`;
        }).join(' ');

    const dataPoints = Array.from({ length: count }, (_, i) => {
        const v = Math.min(100, Math.max(0, values[i] || 0));
        const p = pt(startAngle + i * angleStep, (radius * v) / 100);
        return `${p.x},${p.y}`;
    }).join(' ');

    const labelPositions = Array.from({ length: count }, (_, i) => {
        const angle = startAngle + i * angleStep;
        const r = radius + 34;
        return {
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle),
            label: labels[i],
            value: values[i],
        };
    });

    return (
        <div className="relative flex items-center justify-center w-full">
            <svg
                ref={svgRef}
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="overflow-visible"
                style={{ maxWidth: '100%' }}
            >
                {/* Concentric grid rings — outermost is slightly brighter */}
                {Array.from({ length: levels }, (_, i) => (
                    <polygon
                        key={`ring-${i}`}
                        points={polyStr((radius * (i + 1)) / levels)}
                        fill="none"
                        stroke={i === levels - 1 ? '#334155' : '#1E293B'}
                        strokeWidth={i === levels - 1 ? '1.2' : '0.8'}
                    />
                ))}

                {/* Spoke axes — dashed, subtle */}
                {Array.from({ length: count }, (_, i) => {
                    const end = pt(startAngle + i * angleStep, radius);
                    return (
                        <line
                            key={`spoke-${i}`}
                            x1={cx} y1={cy}
                            x2={end.x} y2={end.y}
                            stroke="#1E293B"
                            strokeWidth="0.8"
                            strokeDasharray="3 3"
                        />
                    );
                })}

                {/* Data polygon — solid blue fill, NO gradient */}
                <polygon
                    points={dataPoints}
                    fill="#3B82F6"
                    fillOpacity={0.12}
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeLinejoin="round"
                >
                    <animate attributeName="fill-opacity" from="0" to="0.12" dur="0.6s" fill="freeze" />
                    <animate attributeName="stroke-opacity" from="0" to="1" dur="0.6s" fill="freeze" />
                </polygon>

                {/* Data point dots — white center, blue ring */}
                {Array.from({ length: count }, (_, i) => {
                    const v = Math.min(100, Math.max(0, values[i] || 0));
                    const p = pt(startAngle + i * angleStep, (radius * v) / 100);
                    return (
                        <circle
                            key={`dot-${i}`}
                            cx={p.x} cy={p.y} r="3.5"
                            fill="#fff"
                            stroke="#3B82F6"
                            strokeWidth="2"
                            className="transition-transform duration-200"
                            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                        />
                    );
                })}

                {/* External labels — font-sans, clean two-line layout */}
                {labelPositions.map((pos, i) => {
                    const isLeft = pos.x < cx - 15;
                    const isRight = pos.x > cx + 15;
                    const anchor = isLeft ? 'end' : isRight ? 'start' : 'middle';
                    const truncated = pos.label.length > 18 ? pos.label.substring(0, 17) + '…' : pos.label;

                    return (
                        <g key={`lbl-${i}`}>
                            <text
                                x={pos.x} y={pos.y - 5}
                                textAnchor={anchor}
                                dominantBaseline="middle"
                                fontSize="10"
                                fill="#94A3B8"
                                fontFamily="var(--font-sans), system-ui, sans-serif"
                                fontWeight="600"
                                letterSpacing="0.04em"
                            >
                                {truncated}
                            </text>
                            <text
                                x={pos.x} y={pos.y + 9}
                                textAnchor={anchor}
                                dominantBaseline="middle"
                                fontSize="11"
                                fill="#3B82F6"
                                fontFamily="var(--font-mono), monospace"
                                fontWeight="700"
                            >
                                {pos.value}%
                            </text>
                        </g>
                    );
                })}

                {/* Center anchor */}
                <circle cx={cx} cy={cy} r="2.5" fill="#334155" />
            </svg>
        </div>
    );
}
