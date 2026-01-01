import React from 'react';

interface RadialProgressProps {
  value: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function RadialProgress({
  value,
  size = 60,
  strokeWidth = 6,
  color = 'stroke-green-500',
  label
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - value * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${color} transition-all duration-500 ease-in-out`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
          {Math.round(value * 100)}%
        </div>
      </div>
      {label && <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{label}</span>}
    </div>
  );
}
