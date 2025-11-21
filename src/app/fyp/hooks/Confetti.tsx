import React, { useEffect, useState } from 'react';

interface ConfettiProps {
  isFiring: boolean;
}

const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];

interface ConfettiPieceData {
  id: number;
  xEnd: number;
  yEnd: number;
  rotation: number;
  duration: number;
}

export const Confetti: React.FC<ConfettiProps> = ({ isFiring }) => {
  const [pieces, setPieces] = useState<ConfettiPieceData[]>([]);

  useEffect(() => {
    if (isFiring) {
      const newPieces = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        xEnd: Math.random() * 100 - 50, // -50vw to +50vw
        yEnd: Math.random() * 80 - 40,  // -40vh to +40vh
        rotation: Math.random() * 720 - 360,
        duration: Math.random() * 2 + 1.5,
      }));
      setPieces(newPieces);
      const timer = setTimeout(() => setPieces([]), 4000); // Clear after longest animation
      return () => clearTimeout(timer);
    }
  }, [isFiring]);
  
  if (!isFiring) return null;

  return (
    <>
    <style>{`
      ${pieces.map(p => `
        @keyframes confetti-fall-${p.id} {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + ${p.xEnd}vw), calc(-50% + ${p.yEnd}vh)) rotate(${p.rotation}deg) scale(0);
            opacity: 0;
          }
        }
      `).join('')}
    `}</style>
    <div className="absolute inset-0 z-50 pointer-events-none">
        {pieces.map(p => {
            const style: React.CSSProperties = {
                position: 'absolute',
                width: `${Math.random() * 8 + 6}px`,
                height: `${Math.random() * 8 + 6}px`,
                backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                top: '50%',
                left: '50%',
                opacity: 0,
                transform: `translate(-50%, -50%)`,
                animation: `confetti-fall-${p.id} ${p.duration}s ease-out forwards`,
            };
            return <div key={p.id} style={style} />;
        })}
    </div>
    </>
  );
};