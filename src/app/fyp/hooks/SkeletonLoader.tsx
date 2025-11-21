
import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className }) => (
  <>
    <style>{`
      @keyframes shimmer {
        100% {
          transform: translateX(100%);
        }
      }
      .shimmer-wrapper::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        transform: translateX(-100%);
        background-image: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0,
          rgba(255, 255, 255, 0.05) 20%,
          rgba(255, 255, 255, 0.1) 60%,
          rgba(255, 255, 255, 0) 100%
        );
        animation: shimmer 2s infinite;
      }
    `}</style>
    <div className={`relative overflow-hidden bg-white/5 shimmer-wrapper ${className}`} />
  </>
);
