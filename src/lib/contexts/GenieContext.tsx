'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface GenieContextType {
  isOpen: boolean;
  isPinned: boolean;
  setIsOpen: (val: boolean) => void;
  setIsPinned: (val: boolean) => void;
  toggleChat: () => void;
}

const GenieContext = createContext<GenieContextType | undefined>(undefined);

export const GenieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(true); // Default to pinned as requested

  const toggleChat = () => setIsOpen(prev => !prev);

  return (
    <GenieContext.Provider value={{ isOpen, isPinned, setIsOpen, setIsPinned, toggleChat }}>
      {children}
    </GenieContext.Provider>
  );
};

export const useGenie = () => {
  const context = useContext(GenieContext);
  if (!context) throw new Error('useGenie must be used within a GenieProvider');
  return context;
};
