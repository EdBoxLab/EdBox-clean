import React, { useState, useEffect } from 'react';
import { PERIODIC_DATA } from '../../constants';
import { PeriodicElement, ElementCategory } from '../../types';
import { Filter, Info } from 'lucide-react';

export const PeriodicTableModule: React.FC<{ setContext: (data: any) => void }> = ({ setContext }) => {
  const [activeElement, setActiveElement] = useState<PeriodicElement | null>(null);
  const [highlightCategory, setHighlightCategory] = useState<ElementCategory | 'all'>('all');

  useEffect(() => {
    setContext({
      module: 'Periodic Table',
      selectedElement: activeElement,
      viewMode: highlightCategory
    });
  }, [activeElement, highlightCategory, setContext]);

  // Helper for category colors
  const getCategoryColor = (cat: ElementCategory) => {
    switch (cat) {
      case 'alkali-metal': return 'bg-red-500 border-red-400 text-red-50';
      case 'alkaline-earth-metal': return 'bg-orange-500 border-orange-400 text-orange-50';
      case 'transition-metal': return 'bg-yellow-600 border-yellow-500 text-yellow-50';
      case 'post-transition-metal': return 'bg-gray-500 border-gray-400 text-gray-50';
      case 'metalloid': return 'bg-teal-600 border-teal-500 text-teal-50';
      case 'non-metal': return 'bg-green-600 border-green-500 text-green-50';
      case 'halogen': return 'bg-blue-500 border-blue-400 text-blue-50';
      case 'noble-gas': return 'bg-purple-600 border-purple-500 text-purple-50';
      default: return 'bg-slate-700 border-slate-600 text-slate-200';
    }
  };

  const categories: { id: ElementCategory; label: string }[] = [
    { id: 'alkali-metal', label: 'Alkali Metals' },
    { id: 'alkaline-earth-metal', label: 'Alkaline Earth' },
    { id: 'transition-metal', label: 'Transition Metals' },
    { id: 'metalloid', label: 'Metalloids' },
    { id: 'non-metal', label: 'Non-Metals' },
    { id: 'halogen', label: 'Halogens' },
    { id: 'noble-gas', label: 'Noble Gases' },
  ];

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Periodic Table of Elements</h2>
          <p className="text-slate-400">Explore properties of metals, non-metals, and metalloids.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg overflow-x-auto max-w-full">
          <button
            onClick={() => setHighlightCategory('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${highlightCategory === 'all' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setHighlightCategory(c.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${highlightCategory === c.id ? getCategoryColor(c.id).split(' ')[0] + ' text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Table Grid */}
        <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 p-4 overflow-auto flex items-center justify-center relative">
          <div 
            className="grid gap-1 md:gap-2" 
            style={{ 
              gridTemplateColumns: 'repeat(18, minmax(28px, 1fr))',
              gridTemplateRows: 'repeat(7, minmax(28px, 1fr))',
              width: '100%',
              maxWidth: '1000px',
              aspectRatio: '18/7'
            }}
          >
            {PERIODIC_DATA.map(el => {
              const isDimmed = highlightCategory !== 'all' && highlightCategory !== el.category;
              const isSelected = activeElement?.number === el.number;
              const colorClass = getCategoryColor(el.category);
              
              return (
                <button
                  key={el.number}
                  onClick={() => setActiveElement(el)}
                  style={{ gridColumn: el.col, gridRow: el.row }}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded md:rounded-md border 
                    transition-all duration-200 relative group
                    ${isDimmed ? 'opacity-20 grayscale' : 'opacity-100'}
                    ${isSelected ? 'ring-2 ring-white scale-110 z-10' : 'hover:scale-110 hover:z-10'}
                    ${colorClass}
                  `}
                >
                  <span className="text-[8px] md:text-[10px] absolute top-0.5 left-1 opacity-70">{el.number}</span>
                  <span className="text-xs md:text-sm font-bold">{el.symbol}</span>
                </button>
              );
            })}
            
            {/* Placeholder for Lanthanides/Actinides visual hint if needed, omitted for clean UI */}
          </div>
          
          {!activeElement && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-slate-600 font-mono text-sm">Select an element to view details</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="w-full lg:w-80 bg-slate-800/50 border border-slate-700 rounded-2xl backdrop-blur-sm p-6 flex flex-col">
          {activeElement ? (
            <div className="animate-in slide-in-from-right fade-in duration-300">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold mb-4 border-2 shadow-lg ${getCategoryColor(activeElement.category)}`}>
                {activeElement.symbol}
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-1">{activeElement.name}</h3>
              <div className="inline-block px-2 py-1 rounded bg-slate-700 text-xs text-slate-300 font-mono mb-6 capitalize">
                {activeElement.category.replace(/-/g, ' ')}
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Atomic Number</div>
                  <div className="text-lg font-mono text-white">{activeElement.number}</div>
                </div>
                
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Atomic Mass</div>
                  <div className="text-lg font-mono text-white">{activeElement.mass} u</div>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {activeElement.summary}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition text-sm">
                  Ask AI about {activeElement.name}
                </button>
              </div>
            </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center">
                <Filter className="w-12 h-12 mb-4 opacity-20" />
                <p>Select an element from the table to reveal its secrets.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};