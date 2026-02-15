import React from 'react';
import { WindowType } from '../../types';
import { Atom, Activity, Calculator, Code, BookOpen, Clock, Globe, Zap, Database, Music } from 'lucide-react';

interface UniversalWidgetProps {
  type: WindowType;
  data?: any;
}

const UniversalWidget: React.FC<UniversalWidgetProps> = ({ type, data }) => {
  
  const renderContent = () => {
    if (type.startsWith('STEM_PERIODIC')) {
        return (
            <div className="grid grid-cols-10 gap-1 p-4 overflow-y-auto h-full">
                {Array.from({length: 118}).map((_, i) => (
                    <div key={i} className="aspect-square bg-slate-800/50 border border-white/10 rounded flex flex-col items-center justify-center hover:bg-cyan-900/50 cursor-pointer transition-colors">
                        <span className="text-[8px] opacity-50">{i+1}</span>
                        <span className="text-xs font-bold text-cyan-200">El</span>
                    </div>
                ))}
            </div>
        );
    }
    
    if (type.startsWith('STEM_SOLAR')) {
        return (
            <div className="relative w-full h-full min-h-[300px] flex items-center justify-center bg-black overflow-hidden">
                <div className="w-16 h-16 bg-yellow-500 rounded-full shadow-[0_0_50px_rgba(234,179,8,0.5)] animate-pulse" />
                <div className="absolute w-32 h-32 border border-white/10 rounded-full animate-spin" style={{ animationDuration: '3s' }}>
                   <div className="absolute top-0 left-1/2 w-3 h-3 bg-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
                </div>
                <div className="absolute w-52 h-52 border border-white/10 rounded-full animate-spin" style={{ animationDuration: '5s' }}>
                   <div className="absolute top-0 left-1/2 w-4 h-4 bg-orange-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
                </div>
            </div>
        );
    }

    if (type.startsWith('MATH_CALC')) {
        return (
             <div className="p-4 flex flex-col items-center justify-center h-full space-y-4 min-h-[400px]">
                <div className="text-4xl font-mono text-cyan-400">f(x) = x² + 2x</div>
                <div className="w-full h-40 bg-slate-800/50 rounded border border-white/10 relative overflow-hidden">
                     <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                         <path d="M0,100 Q50,0 100,100" stroke="#22d3ee" strokeWidth="2" fill="none" />
                         <line x1="0" y1="50" x2="100" y2="50" stroke="white" strokeOpacity="0.1" />
                         <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeOpacity="0.1" />
                     </svg>
                </div>
                <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
                    {['sin', 'cos', 'tan', 'log', '(', ')', '^', '√'].map(b => (
                        <button key={b} className="p-2 bg-slate-700/50 rounded text-xs hover:bg-cyan-600/50 transition-colors">{b}</button>
                    ))}
                </div>
             </div>
        );
    }
    
    if (type.startsWith('WRITING_POMODORO')) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                <div className="w-40 h-40 rounded-full border-4 border-cyan-500/30 flex items-center justify-center text-4xl font-mono text-white relative">
                   25:00
                   <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin" style={{ animationDuration: '1s' }}/>
                </div>
                <div className="mt-6 flex space-x-4">
                    <button className="px-6 py-2 bg-cyan-600 rounded-full font-bold hover:bg-cyan-500">Start</button>
                    <button className="px-6 py-2 bg-slate-700 rounded-full hover:bg-slate-600">Reset</button>
                </div>
            </div>
        );
    }

    // Default Fallback
    let Icon = Activity;
    let label = "Widget";
    let color = "text-slate-400";
    
    if (type.startsWith('MATH')) { Icon = Calculator; label = "Math Tool"; color = "text-purple-400"; }
    else if (type.startsWith('CODE')) { Icon = Code; label = "Developer Tool"; color = "text-green-400"; }
    else if (type.startsWith('WRITING')) { Icon = BookOpen; label = "Writing Aid"; color = "text-yellow-400"; }
    else if (type.startsWith('STEM')) { Icon = Atom; label = "STEM Module"; color = "text-blue-400"; }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-70 min-h-[300px]">
         <div className={`p-6 rounded-full bg-slate-800/50 mb-4 ${color}`}>
            <Icon size={48} />
         </div>
         <h3 className="text-xl font-bold text-slate-200 mb-2">{type.replace(/_/g, ' ')}</h3>
         <p className="text-sm text-slate-400 max-w-xs mx-auto">
            This high-performance {label} is ready for interaction. <br/>
            (Simulated Interface)
         </p>
         <div className="mt-6 w-full max-w-md h-2 bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-cyan-500/50 w-2/3 animate-pulse" />
         </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-slate-900/50 overflow-auto relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
        />
        {renderContent()}
    </div>
  );
};

export default UniversalWidget;