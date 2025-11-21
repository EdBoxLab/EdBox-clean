import React, { useState, useEffect } from 'react';
import { SAMPLE_REACTIONS } from '../../constants';
import { Reaction, Chemical } from '../../types';
import { ArrowRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const StoichiometryModule: React.FC<{ setContext: (data: any) => void }> = ({ setContext }) => {
  const [activeReaction, setActiveReaction] = useState<Reaction>(SAMPLE_REACTIONS[0]);
  const [userCoeffs, setUserCoeffs] = useState<Record<string, number>>({});
  const [isBalanced, setIsBalanced] = useState(false);

  // Initialize coefficients when reaction changes
  useEffect(() => {
    const initial: Record<string, number> = {};
    [...activeReaction.reactants, ...activeReaction.products].forEach(c => {
      initial[c.formula] = 1;
    });
    setUserCoeffs(initial);
    setIsBalanced(false);
  }, [activeReaction]);

  // Update context for AI
  useEffect(() => {
    setContext({
      module: 'Stoichiometry',
      reaction: activeReaction,
      currentCoefficients: userCoeffs,
      isBalanced: isBalanced
    });
  }, [activeReaction, userCoeffs, isBalanced, setContext]);

  const handleCoeffChange = (formula: string, delta: number) => {
    setUserCoeffs(prev => {
      const newVal = Math.max(1, (prev[formula] || 1) + delta);
      return { ...prev, [formula]: newVal };
    });
  };

  const checkBalance = () => {
    // Simple element counting logic
    const reactantCounts: Record<string, number> = {};
    const productCounts: Record<string, number> = {};

    // Helper to parse simple formulas (very simplified for this demo)
    // Assumes formulas like H2, O2, CH4, H2O, CO2
    const countAtoms = (chem: Chemical, coeff: number, target: Record<string, number>) => {
      // Very basic parser for demo purposes
      const matches = chem.formula.match(/([A-Z][a-z]?)(\d*)/g);
      if (matches) {
        matches.forEach(part => {
          const match = part.match(/([A-Z][a-z]?)(\d*)/);
          if (match) {
            const elem = match[1];
            const count = parseInt(match[2] || '1', 10);
            target[elem] = (target[elem] || 0) + count * coeff;
          }
        });
      }
    };

    activeReaction.reactants.forEach(r => countAtoms(r, userCoeffs[r.formula], reactantCounts));
    activeReaction.products.forEach(p => countAtoms(p, userCoeffs[p.formula], productCounts));

    const elements = new Set([...Object.keys(reactantCounts), ...Object.keys(productCounts)]);
    let balanced = true;
    elements.forEach(el => {
      if (reactantCounts[el] !== productCounts[el]) balanced = false;
    });

    setIsBalanced(balanced);
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Stoichiometry Lab</h2>
        <p className="text-slate-400">Balance the chemical equations to satisfy the Law of Conservation of Mass.</p>
      </header>

      {/* Reaction Selector */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {SAMPLE_REACTIONS.map(r => (
          <button
            key={r.id}
            onClick={() => setActiveReaction(r)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeReaction.id === r.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {r.description}
          </button>
        ))}
      </div>

      {/* Main Interaction Area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-slate-800/50 rounded-3xl border border-slate-700/50 relative backdrop-blur-sm p-8">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-white text-xl md:text-3xl font-mono">
          {/* Reactants */}
          {activeReaction.reactants.map((r, i) => (
            <React.Fragment key={r.formula}>
              {i > 0 && <span className="text-slate-500">+</span>}
              <div className="flex flex-col items-center gap-2 group">
                <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-700 group-hover:border-blue-500/50 transition-colors">
                  <button 
                    onClick={() => handleCoeffChange(r.formula, -1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  >-</button>
                  <span className="w-10 text-center font-bold text-blue-400">{userCoeffs[r.formula]}</span>
                  <button 
                     onClick={() => handleCoeffChange(r.formula, 1)}
                     className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  >+</button>
                </div>
                <span className="font-bold tracking-wider">{r.formula}</span>
              </div>
            </React.Fragment>
          ))}

          <ArrowRight className="w-8 h-8 text-slate-500" />

          {/* Products */}
          {activeReaction.products.map((p, i) => (
             <React.Fragment key={p.formula}>
             {i > 0 && <span className="text-slate-500">+</span>}
             <div className="flex flex-col items-center gap-2 group">
               <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                 <button 
                   onClick={() => handleCoeffChange(p.formula, -1)}
                   className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                 >-</button>
                 <span className="w-10 text-center font-bold text-emerald-400">{userCoeffs[p.formula]}</span>
                 <button 
                    onClick={() => handleCoeffChange(p.formula, 1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                 >+</button>
               </div>
               <span className="font-bold tracking-wider">{p.formula}</span>
             </div>
           </React.Fragment>
          ))}
        </div>

        {/* Action / Feedback */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <button
            onClick={checkBalance}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
          >
            Verify Balance
          </button>
          
          {isBalanced ? (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/30 px-4 py-2 rounded-lg border border-emerald-900/50 animate-fade-in">
              <CheckCircle2 className="w-5 h-5" />
              <span>Perfectly Balanced! Mass is conserved.</span>
            </div>
          ) : (
             <div className="h-8"></div> // Spacer
          )}
        </div>

        {/* Educational Hint */}
        <div className="absolute bottom-4 right-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800">
                <Info className="w-3 h-3" />
                <span>Tip: Adjust coefficients until atoms of each element are equal on both sides.</span>
            </div>
        </div>
      </div>
    </div>
  );
};
