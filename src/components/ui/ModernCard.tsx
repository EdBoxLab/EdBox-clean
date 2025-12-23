import React from "react";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, className = "" }) => (
  <div className={`bg-card border border-border rounded-xl p-4 shadow-sm transition-all duration-200 ${className}`}>
    {title && <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{title}</h3>}
    {children}
  </div>
);
