'use client';
import React, { useState, useRef, useEffect } from 'react';
import { TagCloseIcon, ArrowUpIcon } from '../MediaIcons';
import { SUGGESTED_INTEREST_CATEGORIES } from '../constants';

type IconComponent = React.FC<{ className?: string }>;
const TagClose = TagCloseIcon as unknown as IconComponent;
const ArrowUp = ArrowUpIcon as unknown as IconComponent;

interface InterestSelectorProps {
  onInterestsSelected: (interests: string[]) => void;
}

export const InterestSelector: React.FC<InterestSelectorProps> = ({ onInterestsSelected }) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>(
    SUGGESTED_INTEREST_CATEGORIES?.[0]?.name ?? null
  );
  const minSelection = 5;
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAddInterest = (interestToAdd?: string) => {
    const newInterest = (interestToAdd ?? inputValue).trim();
    if (!newInterest) {
      setInputValue('');
      inputRef.current?.focus();
      return;
    }
    if (!selectedInterests.some(i => i.toLowerCase() === newInterest.toLowerCase())) {
      setSelectedInterests(prev => [...prev, newInterest]);
    }
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    setSelectedInterests(prev => prev.filter(i => i !== interestToRemove));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInterest();
    } else if (e.key === 'Backspace' && inputValue === '' && selectedInterests.length > 0) {
      setSelectedInterests(prev => prev.slice(0, -1));
    }
  };

  const handleSubmit = () => {
    if (selectedInterests.length < minSelection) {
      alert(`Select at least ${minSelection} interests`);
      return;
    }
    onInterestsSelected(selectedInterests);
  };

  const canContinue = selectedInterests.length >= minSelection;

  const renderSuggestions = (suggestions: string[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {suggestions.map(s => {
        const isSelected = selectedInterests.some(i => i.toLowerCase() === s.toLowerCase());
        return (
          <button
            key={s}
            type="button"
            onClick={() => (isSelected ? handleRemoveInterest(s) : handleAddInterest(s))}
            className={`text-sm px-3 py-1.5 rounded-full transition w-full text-left ${
              isSelected
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
            }`}
            aria-pressed={isSelected}
          >
            {isSelected ? `✓ ${s}` : s}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col bg-slate-900 text-slate-50 min-h-screen">
      {/* Scrollable content with bottom padding */}
      <div className="flex-1 overflow-auto w-full max-w-5xl mx-auto p-4 sm:p-8 pb-24">
        <header className="mb-4">
          <h1 className="text-lg sm:text-2xl font-bold">Personalize Your Feed</h1>
          <p className="text-sm text-slate-400 mt-1">
            Add at least {minSelection} topics you’re interested in.
          </p>
        </header>

        {/* Input */}
        <div className="mb-4">
          <label htmlFor="interest-input" className="sr-only">Add an interest</label>
          <div className="flex gap-2">
            <input
              id="interest-input"
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a topic and press Enter"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => handleAddInterest()}
              className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm text-white"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Or pick suggestions from the categories below.
          </p>
        </div>

        {/* Selected tags */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-300">
              {selectedInterests.length} / {minSelection} selected
            </div>
            <div className="text-xs text-slate-500">
              Tips: press Enter to add, Backspace to remove last
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedInterests.length === 0 ? (
              <div className="text-sm text-slate-400">No topics selected yet</div>
            ) : (
              selectedInterests.map(interest => (
                <span
                  key={interest}
                  className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-sm rounded-full px-3 py-1"
                >
                  <span>{interest}</span>
                  <button
                    onClick={() => handleRemoveInterest(interest)}
                    aria-label={`Remove ${interest}`}
                    className="p-1 rounded-full hover:bg-slate-700"
                  >
                    <TagClose className="w-4 h-4 text-slate-300" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4 mb-20">
          {SUGGESTED_INTEREST_CATEGORIES.map(category => {
            const suggestions = (category as any).interests ?? [];
            const isOpen = openCategory === category.name;
            return (
              <div key={category.name} className="bg-slate-900 border border-slate-700 rounded-lg">
                <button
                  type="button"
                  onClick={() => setOpenCategory(isOpen ? null : category.name)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold">{category.name}</span>
                  <ArrowUp
                    className={`w-4 h-4 text-slate-400 transform transition-transform ${
                      isOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <div className="mt-2">{renderSuggestions(suggestions)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="w-full bg-slate-900 border-t border-slate-700 fixed bottom-0 left-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => { setSelectedInterests([]); setInputValue(''); inputRef.current?.focus(); }}
            className="text-sm text-slate-300 hover:text-white"
          >
            Reset
          </button>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-400 hidden sm:block">
              You need at least {minSelection} topics
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canContinue}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                canContinue
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestSelector;
