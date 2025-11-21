import React, { useState, useEffect, useRef } from 'react';
import { MIXER_CHEMICALS } from '../../constants';
import { MixerChemical, MixerRecipe, ModuleType } from '../../types';
import { Eraser, FlaskConical, Zap, CheckCircle2, Plus, Atom, ThermometerSun, Gauge, AlertTriangle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { analyzeReaction } from '../../services/geminiService';

interface ChemicalMixerProps {
  setContext: (data: any) => void;
  onNavigate?: (module: ModuleType) => void;
  onInspectMolecule?: (id: string) => void;
}

export const ChemicalMixerModule: React.FC<ChemicalMixerProps> = ({ setContext, onNavigate, onInspectMolecule }) => {
  const [contents, setContents] = useState<MixerChemical[]>([]);
  const [reactionResult, setReactionResult] = useState<MixerRecipe | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [animateId, setAnimateId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Sidebar State
  const [isChemicalsCollapsed, setIsChemicalsCollapsed] = useState(false);

  // Environmental State
  const [temperature, setTemperature] = useState(25); // Celsius
  const [pressure, setPressure] = useState(1); // atm

  // Animation Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setContext({
      module: 'Reaction Mixer',
      contents: contents.map(c => c.name),
      conditions: { temperature, pressure },
      lastReaction: reactionResult?.resultText || 'None'
    });
  }, [contents, reactionResult, temperature, pressure, setContext]);

  // Particle Animation System
  const triggerAIAnimation = (animationData: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { style, colors, intensity } = animationData;
    const particleCount = Math.floor(50 + (intensity * 100));
    
    let particles: any[] = [];

    // Initialize particles based on style
    for(let i=0; i<particleCount; i++) {
        const color = colors.length > 0 ? colors[Math.floor(Math.random() * colors.length)] : '#ffffff';
        
        let p: any = {
            color,
            life: 1.0,
            size: Math.random() * 4 + 2,
        };

        if (style === 'bubbles') {
            // Start at bottom, move up
            p.x = canvas.width / 2 + (Math.random() - 0.5) * 100;
            p.y = canvas.height - 20;
            p.vx = (Math.random() - 0.5) * 1;
            p.vy = -(Math.random() * 2 + 1); // Upward
            p.drag = 0.99;
        } else if (style === 'precipitate') {
            // Start at top/middle, fall down
            p.x = canvas.width / 2 + (Math.random() - 0.5) * 120;
            p.y = canvas.height / 2 + (Math.random() - 0.5) * 50;
            p.vx = (Math.random() - 0.5) * 0.5;
            p.vy = (Math.random() * 1 + 0.5); // Downward
            p.drag = 0.98;
            p.size = Math.random() * 3 + 1; // Smaller
        } else if (style === 'smoke') {
            // Start middle, drift up slowly and expand
            p.x = canvas.width / 2 + (Math.random() - 0.5) * 40;
            p.y = canvas.height / 2 + 50;
            p.vx = (Math.random() - 0.5) * 1;
            p.vy = -(Math.random() * 1 + 0.5);
            p.drag = 0.98;
        } else {
            // Explosion / Splash / Glow (Default radial)
            p.x = canvas.width / 2;
            p.y = canvas.height / 2 + 50;
            p.vx = (Math.random() - 0.5) * 15 * intensity;
            p.vy = (Math.random() - 1) * 15 * intensity;
            p.drag = 0.95;
        }
        particles.push(p);
    }

    let animId: number;
    const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;

        particles.forEach(p => {
            if (p.life > 0) {
                active = true;
                
                // Physics Update
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= p.drag;
                p.vy *= p.drag;

                // Style specific updates
                if (style === 'bubbles') {
                   p.x += Math.sin(p.y * 0.05) * 0.5; // Wiggle
                   p.size *= 0.99; // Bubbles pop eventually or get smaller
                } else if (style === 'smoke') {
                   p.size *= 1.02; // Smoke expands
                   p.life -= 0.005; // Fades slowly
                } else if (style === 'explosion') {
                   p.vy += 0.2; // Gravity affects debris
                   p.life -= 0.02;
                } else if (style === 'precipitate') {
                   if (p.y > canvas.height - 10) {
                       p.y = canvas.height - 10;
                       p.vy = 0; // Pile up
                   }
                   p.life -= 0.005;
                } else {
                   p.life -= 0.01;
                }

                // Draw
                ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        if (active) {
            animId = requestAnimationFrame(render);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };
    render();
  };

  const addChemical = (chem: MixerChemical) => {
    setContents(prev => {
        if (prev.find(c => c.id === chem.id)) return prev; 
        return [...prev, chem];
    });
    setReactionResult(null);
    setErrorMsg(null);
  };

  const clearBeaker = () => {
    setContents([]);
    setReactionResult(null);
    setErrorMsg(null);
  };

  // Helper to generate visual props for unknown chemicals returned by AI
  const getChemicalStyle = (chemName: string, type: string, colorHint?: string) => {
    const safeType = ['solid', 'liquid', 'gas'].includes(type) ? type as 'solid'|'liquid'|'gas' : 'solid';
    
    // Map some common color hints to tailwind classes or hex
    let bgClass = 'bg-slate-400';
    if (colorHint) {
      const lower = colorHint.toLowerCase();
      if (lower.includes('white') || lower.includes('colorless')) bgClass = 'bg-slate-100';
      else if (lower.includes('blue')) bgClass = 'bg-blue-500';
      else if (lower.includes('red')) bgClass = 'bg-red-500';
      else if (lower.includes('green')) bgClass = 'bg-green-500';
      else if (lower.includes('yellow')) bgClass = 'bg-yellow-400';
      else if (lower.includes('black') || lower.includes('dark')) bgClass = 'bg-slate-900 text-white';
      else if (lower.includes('orange')) bgClass = 'bg-orange-500';
      else if (lower.includes('purple')) bgClass = 'bg-purple-500';
    }

    return {
      id: `dynamic-${chemName}-${Date.now()}`,
      name: chemName,
      formula: chemName, // AI might give formula, we use it if available
      type: safeType,
      color: bgClass
    };
  };

  const mixChemicals = async () => {
    setErrorMsg(null);
    setIsAnalyzing(true);
    
    const reactantNames = contents.map(c => c.name);
    
    try {
      // Call AI to simulate
      const analysis = await analyzeReaction(reactantNames, { temperature, pressure });
      setIsAnalyzing(false);

      if (!analysis) {
        setErrorMsg("Simulation connection failed. Try again.");
        return;
      }

      if (analysis.occurred) {
        // 1. Trigger Visuals with AI data
        setAnimateId('reaction');
        if (analysis.animation) {
           triggerAIAnimation(analysis.animation);
        }

        setTimeout(() => {
          // 2. Update Data
          setReactionResult({
            reactants: contents.map(c => c.id),
            products: [], // Dynamic products don't track IDs the same way, but fine for display
            resultText: `${analysis.equation} (${analysis.reactionType})`,
            type: analysis.reactionType as any
          });

          // 3. Replace Contents
          // Generate chemical objects for new products
          const newProducts: MixerChemical[] = analysis.products.map((p: any) => {
             // Check if we have this in constants first
             const existing = MIXER_CHEMICALS.find(mc => mc.formula === p.formula || mc.name === p.name);
             if (existing) return existing;
             
             // Create dynamic
             return {
               ...getChemicalStyle(p.name, p.phase, p.color),
               formula: p.formula || p.name
             };
          });

          setContents(newProducts);
          setAnimateId(null);

        }, 1200); // Wait for animation to peak

      } else {
        // Reaction failed (conditions not met, or inert)
        setAnimateId('shake');
        setErrorMsg(analysis.reasoning || "No reaction occurred.");
        setTimeout(() => setAnimateId(null), 500);
      }

    } catch (e) {
      setIsAnalyzing(false);
      setErrorMsg("An error occurred during simulation.");
    }
  };

  const handleInspect = () => {
    if (onNavigate && onInspectMolecule && contents.length > 0) {
       const target = contents[0];
       onInspectMolecule(target.id.startsWith('dynamic') ? target.formula : target.id);
       onNavigate(ModuleType.MOLECULAR_VIEWER);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row p-6 gap-6 overflow-hidden relative">
      
      {/* Inventory Sidebar - Fixed Scroll Container */}
      <div className={`flex-shrink-0 flex flex-col gap-4 transition-all duration-300 max-h-full overflow-hidden ${isChemicalsCollapsed ? 'w-16' : 'w-full lg:w-64'}`}>
          
          {/* Chemicals Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col flex-1 overflow-hidden">
            <button 
              onClick={() => setIsChemicalsCollapsed(!isChemicalsCollapsed)}
              className="p-4 bg-slate-800/50 border-b border-slate-800 font-bold text-white flex items-center justify-between hover:bg-slate-800 transition-colors shrink-0"
            >
              {!isChemicalsCollapsed && <div className="flex items-center gap-2"><FlaskConical className="w-5 h-5 text-blue-400" /> Chemicals</div>}
              {isChemicalsCollapsed ? <ChevronDown className="w-5 h-5 mx-auto" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
            </button>
            
            {!isChemicalsCollapsed && (
              <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
                {['solid', 'liquid', 'gas'].map(type => {
                    const visibleChems = MIXER_CHEMICALS.filter(c => c.type === type);
                    if (visibleChems.length === 0) return null;
                    return (
                    <div key={type}>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 sticky top-0 bg-slate-900 py-2 z-10">{type}s</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {visibleChems.map(chem => (
                        <button
                            key={chem.id}
                            onClick={() => addChemical(chem)}
                            className="flex flex-col items-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 transition-all group relative"
                        >
                            <div className={`w-8 h-8 rounded-full mb-2 shadow-sm ${chem.color} flex items-center justify-center text-slate-900 font-bold text-[10px] opacity-90 group-hover:scale-110 transition-transform`}>
                            {chem.formula.replace(/(\d+)/g, '')}
                            </div>
                            <span className="text-[10px] text-slate-300 text-center font-medium leading-tight">{chem.name}</span>
                        </button>
                        ))}
                    </div>
                    </div>
                )})}
              </div>
            )}
          </div>
          
          {/* Environment Controls */}
          {!isChemicalsCollapsed && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shrink-0">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ThermometerSun className="w-4 h-4" /> Conditions
              </h3>
              
              <div className="space-y-4">
                  <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>Temp</span>
                          <span className="font-mono text-blue-400">{temperature}°C</span>
                      </div>
                      <input 
                        type="range" min="-20" max="500" step="5" 
                        value={temperature} 
                        onChange={(e) => setTemperature(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                      />
                  </div>
                  <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>Pressure</span>
                          <span className="font-mono text-blue-400">{pressure} atm</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="10" step="0.1" 
                        value={pressure} 
                        onChange={(e) => setPressure(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                  </div>
              </div>
            </div>
          )}
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col items-center justify-center relative bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm min-h-[400px] overflow-hidden">
         
         {/* Analyzing Overlay */}
         {isAnalyzing && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/50 backdrop-blur-sm">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <span className="text-blue-400 font-medium animate-pulse">AI Analyzing Reaction...</span>
            </div>
         )}

         {/* Result Notification */}
         {reactionResult && !animateId && !isAnalyzing && (
           <div className="absolute top-6 left-0 right-0 flex flex-col items-center justify-center z-20 animate-in slide-in-from-top duration-500 px-4 pointer-events-none">
             <div className="bg-emerald-900/90 border border-emerald-700 text-emerald-100 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur flex flex-col md:flex-row items-center gap-4 max-w-xl w-full pointer-events-auto">
               <div className="flex items-center gap-3 flex-1">
                   <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                   <div>
                     <div className="font-bold text-lg">Reaction Successful!</div>
                     <div className="font-mono text-sm opacity-90">{reactionResult.resultText}</div>
                   </div>
               </div>
               
               <button 
                 onClick={handleInspect}
                 className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
               >
                 <Atom className="w-4 h-4" /> View Structure
               </button>
             </div>
           </div>
         )}

         {/* Error/Warning Notification */}
         {errorMsg && !isAnalyzing && (
             <div className="absolute top-6 z-20 animate-in slide-in-from-top duration-300 px-4 w-full max-w-lg">
                 <div className="bg-red-900/90 border border-red-700 text-red-100 px-4 py-3 rounded-xl flex items-start gap-3 shadow-lg backdrop-blur">
                     <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                     <span className="text-sm font-medium leading-relaxed">{errorMsg}</span>
                 </div>
             </div>
         )}

         {/* Beaker Area */}
         <div className="relative w-full max-w-lg h-[500px] flex flex-col items-center justify-center z-10">
            
            {/* Animation Layer */}
            <canvas 
                ref={canvasRef} 
                width={400} 
                height={500} 
                className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none z-30"
            />

            {/* The Beaker Visual */}
            <div className={`
                relative w-64 h-80 border-b-4 border-x-4 border-slate-400/30 rounded-b-[3rem] rounded-t-sm backdrop-blur-sm bg-gradient-to-b from-white/5 to-white/10 flex flex-col justify-end overflow-hidden transition-all
                ${animateId === 'shake' ? 'animate-shake' : ''}
            `}>
               {/* Liquid/Contents Level */}
               <div className={`w-full transition-all duration-700 ease-in-out ${contents.length > 0 ? 'h-3/4' : 'h-0'} bg-blue-500/10 relative`}>
                   
                   {/* Floating Items */}
                   <div className="absolute inset-0 p-4 flex flex-wrap content-end justify-center gap-2 overflow-hidden">
                      {contents.map((chem, idx) => (
                        <div key={`${chem.id}-${idx}`} className="animate-in zoom-in duration-300">
                           <div className={`px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-lg flex items-center gap-1 ${chem.color}`}>
                             {chem.formula}
                           </div>
                        </div>
                      ))}
                   </div>
               </div>
               
               {/* Glass Reflection */}
               <div className="absolute top-0 left-4 w-4 h-full bg-gradient-to-r from-white/20 to-transparent rounded-full blur-sm pointer-events-none"></div>
            </div>

            {/* Controls */}
            <div className="mt-10 flex gap-4 z-40">
              <button 
                onClick={clearBeaker}
                disabled={contents.length === 0 || isAnalyzing}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Eraser className="w-4 h-4" /> Clear
              </button>
              <button 
                onClick={mixChemicals}
                disabled={contents.length < 2 || isAnalyzing}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
              >
                <Zap className="w-4 h-4 fill-current" /> Mix
              </button>
            </div>

            {/* Empty State Hint */}
            {contents.length === 0 && !isAnalyzing && (
               <div className="absolute top-10 text-slate-500 text-sm flex items-center gap-2 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                 <Plus className="w-4 h-4" /> Add chemicals from the shelf
               </div>
            )}
         </div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-5deg); }
          75% { transform: translateX(5px) rotate(5deg); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};