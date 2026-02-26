'use client';

import { useEffect, useRef } from 'react';

interface SkillRadarChartProps {
    labels: string[];
    values: number[];
    size?: number;
}

export default function SkillRadarChart({ labels, values, size = 280 }: SkillRadarChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    if (!labels.length || labels.length < 2) {
        return (
            <div className="flex items-center justify-center h-[280px] text-slate-500 text-sm">
                Start learning skills to see your radar chart
            </div>
        );
    }

    const cx = size / 2;
    const cy = size / 2;
    const radius = (size / 2) * 0.72;
    const levels = 4;
    const count = labels.length;

    const angleStep = (2 * Math.PI) / count;
    const startAngle = -Math.PI / 2; // Start from top

    const getPoint = (angle: number, r: number) => ({
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle)
    });

    // Grid polygon points at each level
    const gridPolygons = Array.from({ length: levels }, (_, i) => {
        const r = (radius * (i + 1)) / levels;
        return Array.from({ length: count }, (_, j) => {
            const p = getPoint(startAngle + j * angleStep, r);
            return `${p.x},${p.y}`;
        }).join(' ');
    });

    // Axes
    const axes = Array.from({ length: count }, (_, i) => ({
        x2: getPoint(startAngle + i * angleStep, radius).x,
        y2: getPoint(startAngle + i * angleStep, radius).y
    }));

    // Data polygon
    const dataPoints = Array.from({ length: count }, (_, i) => {
        const val = Math.min(100, Math.max(0, values[i] || 0));
        const r = (radius * val) / 100;
        const p = getPoint(startAngle + i * angleStep, r);
        return `${p.x},${p.y}`;
    }).join(' ');

    // Label positions (slightly beyond the axis)
    const labelPositions = Array.from({ length: count }, (_, i) => {
        const angle = startAngle + i * angleStep;
        const r = radius + 28;
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), label: labels[i], value: values[i] };
    });

    return (
        <svg
            ref={svgRef}
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="overflow-visible"
        >
            {/* Grid polygons */}
            {gridPolygons.map((points, i) => (
                <polygon
                    key={i}
                    points={points}
                    fill="none"
                    stroke="#1e2d3d"
                    strokeWidth="1"
                    opacity={0.6}
                />
            ))}

            {/* Axes */}
            {axes.map((axis, i) => (
                <line
                    key={i}
                    x1={cx} y1={cy}
                    x2={axis.x2} y2={axis.y2}
                    stroke="#1e2d3d"
                    strokeWidth="1"
                    opacity={0.8}
                />
            ))}

            {/* Data fill polygon */}
            <polygon
                points={dataPoints}
                fill="#3B82F6"
                fillOpacity={0.15}
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinejoin="round"
                className="transition-all duration-700"
            >
                <animate attributeName="fillOpacity" from="0" to="0.15" dur="0.8s" repeatCount="1" />
            </polygon>

            {/* Data point dots */}
            {Array.from({ length: count }, (_, i) => {
                const val = Math.min(100, Math.max(0, values[i] || 0));
                const r = (radius * val) / 100;
                const p = getPoint(startAngle + i * angleStep, r);
                return (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3B82F6" stroke="#0F172A" strokeWidth="2" />
                );
            })}

            {/* Labels */}
            {labelPositions.map((pos, i) => {
                const isLeft = pos.x < cx - 10;
                return (
                    <g key={i}>
                        <text
                            x={pos.x}
                            y={pos.y}
                            textAnchor={isLeft ? 'end' : pos.x > cx + 10 ? 'start' : 'middle'}
                            dominantBaseline="middle"
                            fontSize="10"
                            fill="#94A3B8"
                            fontFamily="Inter, sans-serif"
                            fontWeight="500"
                        >
                            {pos.label.length > 14 ? pos.label.substring(0, 13) + '…' : pos.label}
                        </text>
                        <text
                            x={pos.x}
                            y={pos.y + 13}
                            textAnchor={isLeft ? 'end' : pos.x > cx + 10 ? 'start' : 'middle'}
                            dominantBaseline="middle"
                            fontSize="9"
                            fill="#3B82F6"
                            fontFamily="Inter, sans-serif"
                            fontWeight="600"
                        >
                            {pos.value}%
                        </text>
                    </g>
                );
            })}

            {/* Center dot */}
            <circle cx={cx} cy={cy} r="3" fill="#1e2d3d" />
        </svg>
    );
}
