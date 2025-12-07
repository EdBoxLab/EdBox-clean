import React from "react";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, className = "" }) => (
  <div className={`bg-[#323238] border border-zinc-700/50 rounded-xl p-4 ${className}`}>
    {title && <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider">{title}</h3>}
    {children}
  </div>
);
