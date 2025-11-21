
import React from 'react';
import type { UserStats } from '../types';
import { XPIcon, EdCoinIcon, StreakIcon } from '../StatIcons';

interface HeaderProps {
  stats: UserStats;
}

export const Header: React.FC<HeaderProps> = ({ stats }) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 p-2 sm:p-4 bg-gradient-to-b from-black/50 to-transparent">
      <div className="flex justify-between items-center text-white gap-2">
        <div className="flex items-center gap-2 sm:gap-4">
          <StatItem icon={<XPIcon />} value={stats.xp} />
          <StatItem icon={<EdCoinIcon />} value={stats.edCoins} />
        </div>
        <StatItem icon={<StreakIcon />} value={stats.streak} />
      </div>
    </div>
  );
};

interface StatItemProps {
  icon: React.ReactNode;
  value: number;
}

const StatItem: React.FC<StatItemProps> = ({ icon, value }) => (
  <div className="flex items-center gap-1 sm:gap-2 bg-black/30 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
    <span className="scale-75 sm:scale-100">{icon}</span>
    <span className="font-bold text-xs sm:text-sm tracking-wider">{value.toLocaleString()}</span>
  </div>
);
