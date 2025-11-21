import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { FlaskConical, Droplets, RotateCcw } from 'lucide-react';
import { TitrationState } from '../../types';

export const TitrationModule: React.FC<{ setContext: (data: any) => void }> = ({ setContext }) => {
  const [simState, setSimState] = useState<TitrationState>({
    analyteVolume: 50,
    analyteConcentration: 0.1,
    titrantConcentration: 0.1,
    addedTitrantVolume: 0,
    analyteType: 'strong_acid',
    titrantType: 'strong_base',
    pKa: 4.75 // Acetic acid
  });

  const [isPlaying, setIsPlaying] = useState(false);

  // Simulation Data Generator
  const data = useMemo(() => {
    const points = [];
    // Generate curve points up to 100ml added
    for (let v = 0; v <= 100; v += 0.5) {
      let pH = 7;
      const Va = simState.analyteVolume; // mL
      const Ca = simState.analyteConcentration; // M
      const Cb = simState.titrantConcentration; // M
      const Vb = v; // mL added

      // Moles
      const molesA = Ca * Va / 1000;
      const molesB = Cb * Vb / 1000;
      const totalVolL = (Va + Vb) / 1000;

      if (simState.analyteType === 'strong_acid') {
        if (molesA > molesB) {
          const concH = (molesA - molesB) / totalVolL;
          pH = -Math.log10(concH);
        } else if (molesB > molesA) {
          const concOH = (molesB - molesA) / totalVolL;
          const pOH = -Math.log10(concOH);
          pH = 14 - pOH;
        } else {
          pH = 7;
        }
      } else {
        // Weak Acid (Simplified Henderson-Hasselbalch)
        const Ka = Math.pow(10, -(simState.pKa || 4.75));
        if (Vb === 0) {
           pH = 0.5 * (simState.pKa || 4.75) - 0.5 * Math.log10(Ca);
        } else if (molesA > molesB) {
           // Buffer region
           pH = (simState.pKa || 4.75) + Math.log10(molesB / (molesA - molesB));
        } else if (Math.abs(molesA - molesB) < 0.000001) {
           // Equivalence point (hydrolysis of salt)
           const saltConc = molesA / totalVolL;
           const Kb = 1e-14 / Ka;
           const pOH = 0.5 * (-Math.log10(Kb)) - 0.5 * Math.log10(saltConc);
           pH = 14 - pOH;
        } else {
           // Excess base
           const concOH = (molesB - molesA) / totalVolL;
           const pOH = -Math.log10(concOH);
           pH = 14 - pOH;
        }
      }
      
      // Clamp for display
      pH = Math.max(0, Math.min(14, pH));
      points.push({ vol: v, pH: parseFloat(pH.toFixed(2)) });
    }
    return points;
  }, [simState]);

  const currentPH = useMemo(() => {
     const point = data.find(p => p.vol >= simState.addedTitrantVolume);
     return point ? point.pH : 7;
  }, [data, simState.addedTitrantVolume]);

  // Context for AI
  useEffect(() => {
    setContext({
      module: 'Titration',
      state: simState,
      currentPH,
      equivalencePointVol: (simState.analyteVolume * simState.analyteConcentration) / simState.titrantConcentration
    });
  }, [simState, currentPH, setContext]);

  // Animation loop
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setSimState(prev => {
          if (prev.addedTitrantVolume >= 100) {
            setIsPlaying(false);
            return prev;
          }
          return { ...prev, addedTitrantVolume: prev.addedTitrantVolume + 0.5 };
        });
      }, 50);
    }
    return () => window.clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="h-full flex flex-col lg:flex-row p-6 gap-6 overflow-y-auto">
      
      {/* Controls Column */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm">
           <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
             <FlaskConical className="w-5 h-5 text-pink-500" /> Setup
           </h3>
           
           <div className="space-y-4">
             <div>
               <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Analyte Type</label>
               <div className="flex bg-slate-900 rounded-lg p-1">
                 <button 
                   onClick={() => setSimState(s => ({...s, analyteType: 'strong_acid'}))}
                   className={`flex-1 py-2 text-sm rounded-md transition ${simState.analyteType === 'strong_acid' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                 >Strong Acid (HCl)</button>
                 <button 
                    onClick={() => setSimState(s => ({...s, analyteType: 'weak_acid'}))}
                    className={`flex-1 py-2 text-sm rounded-md transition ${simState.analyteType === 'weak_acid' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                 >Weak Acid (CH₃COOH)</button>
               </div>
             </div>

             <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Initial Volume (mL)</label>
                <input 
                  type="range" min="20" max="100" value={simState.analyteVolume}
                  onChange={(e) => setSimState(s => ({...s, analyteVolume: parseInt(e.target.value)}))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="text-right text-slate-300 font-mono text-sm">{simState.analyteVolume} mL</div>
             </div>

             <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Analyte Concentration (M)</label>
                <input 
                  type="range" min="0.05" max="0.5" step="0.05" value={simState.analyteConcentration}
                  onChange={(e) => setSimState(s => ({...s, analyteConcentration: parseFloat(e.target.value)}))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                 <div className="text-right text-slate-300 font-mono text-sm">{simState.analyteConcentration} M</div>
             </div>
           </div>
        </div>

        {/* Simulation Control */}
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm flex-1 flex flex-col justify-center items-center">
           <div className="relative w-32 h-48 bg-slate-900 rounded-xl border border-slate-700 mb-6 overflow-hidden">
               {/* Liquid Level Animation */}
               <div 
                 className="absolute bottom-0 left-0 right-0 bg-pink-500/20 border-t border-pink-400/50 transition-all duration-100"
                 style={{ height: `${(simState.addedTitrantVolume / 100) * 100}%` }}
               />
               <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-2xl font-bold text-white">{simState.addedTitrantVolume.toFixed(1)}</span>
                 <span className="text-xs text-slate-400 ml-1 mt-2">mL</span>
               </div>
           </div>

           <div className="flex gap-3 w-full">
             <button 
               onClick={() => setIsPlaying(!isPlaying)}
               className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isPlaying ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
             >
               <Droplets className="w-5 h-5" />
               {isPlaying ? 'Pause Titration' : 'Start Titration'}
             </button>
             <button 
               onClick={() => { setIsPlaying(false); setSimState(s => ({...s, addedTitrantVolume: 0})); }}
               className="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl"
             >
               <RotateCcw className="w-5 h-5" />
             </button>
           </div>
        </div>
      </div>

      {/* Chart Column */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
        <div className="flex justify-between items-end mb-6">
           <div>
              <h2 className="text-2xl font-bold text-white">Titration Curve</h2>
              <p className="text-slate-400 text-sm">pH vs. Volume of NaOH added</p>
           </div>
           <div className="text-right">
             <div className="text-sm text-slate-400">Current pH</div>
             <div className={`text-4xl font-mono font-bold ${currentPH < 7 ? 'text-red-400' : 'text-blue-400'}`}>
               {currentPH.toFixed(2)}
             </div>
           </div>
        </div>

        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="vol" 
                stroke="#94a3b8" 
                label={{ value: 'Volume Added (mL)', position: 'insideBottomRight', offset: -5, fill: '#94a3b8' }} 
              />
              <YAxis 
                domain={[0, 14]} 
                stroke="#94a3b8" 
                label={{ value: 'pH', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                itemStyle={{ color: '#f8fafc' }}
              />
              <ReferenceLine y={7} stroke="#475569" strokeDasharray="5 5" />
              <ReferenceLine x={simState.addedTitrantVolume} stroke="#f472b6" />
              <Line 
                type="monotone" 
                dataKey="pH" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={false} 
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
