import React, { useState, useRef, useEffect } from 'react';

interface KeyTermProps {
  term: string;
  definition: string;
}

export const KeyTerm: React.FC<KeyTermProps> = ({ term, definition }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <span className="relative inline-block" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-purple-300 font-semibold border-b border-purple-300/50 hover:border-purple-300/100 transition-colors duration-200 focus:outline-none"
      >
        {term}
      </button>
      {isOpen && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 border border-purple-500/50 rounded-lg shadow-xl z-10"
          role="tooltip"
        >
          <p className="text-sm text-gray-200">{definition}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-[-1px] w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-purple-500/50" />
        </div>
      )}
    </span>
  );
};