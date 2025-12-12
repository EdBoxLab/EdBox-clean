import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', action }) => {
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700/50">
          {title && <h3 className="text-lg font-semibold text-emerald-400">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};