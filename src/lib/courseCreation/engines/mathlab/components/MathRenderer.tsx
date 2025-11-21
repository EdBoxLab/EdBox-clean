import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
  AreaChart, Area
} from 'recharts';
import { MathSolution, GeometryElement, ToolType } from '../types';
import { generateVoiceGuidance, playAudioBuffer } from '../services/geminiService';
import { 
  Volume2, Loader2, RefreshCw, BrainCircuit, 
  Calculator, Grid, Plus, Trash2, Sigma, Percent,
  BarChart2, Activity, TrendingUp, PieChart
} from 'lucide-react';

interface MathRendererProps {
  solution: MathSolution | null;
  isStreaming?: boolean;
  currentTool?: ToolType;
  onSolve?: (prompt: string) => void;
}

// --- UTILS & SHARED COMPONENTS ---

const GenerationStatus = ({ count, target, label }: { count: number, target: number, label: string }) => {
  const percent = Math.min(100, Math.max(5, Math.round((count / target) * 100)));
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-studio-panel/90 backdrop-blur-md px-5 py-2 rounded-full border border-indigo-500/30 shadow-2xl animate-in fade-in slide-in-from-top-2">
        <div className="relative w-6 h-6 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                <path className="text-indigo-500 transition-all duration-300 ease-out" strokeDasharray={`${percent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
            </div>
        </div>
        <div className="flex flex-col min-w-[120px]">
            <span className="text-xs font-bold text-white tracking-wide uppercase">{label}</span>
            <span className="text-[10px] text-indigo-300 font-mono">{percent}% Ready • {count} items</span>
        </div>
    </div>
  );
}

const SolutionDetails = ({ solution, isStreaming, onSpeak }: { solution: MathSolution, isStreaming: boolean, onSpeak: () => void }) => {
  const stepsEndRef = useRef<HTMLDivElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (isStreaming && stepsEndRef.current) {
        stepsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [solution.steps?.length, isStreaming]);

  const handleSpeakClick = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    await onSpeak();
    setIsSpeaking(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Summary Card */}
      <div className="bg-studio-panel p-6 rounded-xl border border-white/5 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
               <h2 className="text-xl font-bold text-white">Solution Analysis</h2>
               {isStreaming && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />}
            </div>
            <p className="text-sm text-studio-muted font-mono mb-2 opacity-75">{solution.originalProblem}</p>
          </div>
          <button 
            onClick={handleSpeakClick}
            disabled={isSpeaking}
            className={`p-2 rounded-full bg-indigo-500/20 hover:bg-indigo-500/40 transition-colors ${isSpeaking ? 'animate-pulse' : ''}`}
            title="Narrate Solution"
          >
            {isSpeaking ? <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /> : <Volume2 className="w-5 h-5 text-indigo-400" />}
          </button>
        </div>
        <p className="text-lg text-indigo-100 leading-relaxed whitespace-pre-wrap">{solution.summary}</p>
      </div>

      {/* Steps Breakdown */}
      <div className="flex flex-col gap-4">
        {(solution.steps || []).map((step, idx) => {
            const isLast = idx === (solution.steps || []).length - 1;
            const activeStyle = isStreaming && isLast ? "border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.15)]" : "border-white/5";
            
            return (
                <div 
                    key={idx} 
                    className={`bg-studio-panel p-5 rounded-xl border ${activeStyle} transition-all duration-300 flex gap-4`}
                >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm font-bold ${isStreaming && isLast ? 'bg-indigo-500 text-white animate-pulse' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    {idx + 1}
                </div>
                <div className="flex-1">
                    <p className="text-studio-text leading-relaxed">{step}</p>
                </div>
                </div>
            );
        })}
        <div ref={stepsEndRef} />
      </div>
    </div>
  );
};

// --- SPECIFIC TOOL VIEWS ---

const StatsToolView = ({ solution, onSolve, isStreaming }: any) => {
  // Editable table state
  const [dataPoints, setDataPoints] = useState<string[]>(["12", "15", "19", "22", "25", "29", "31", "15", "22", "24"]);

  const updatePoint = (idx: number, val: string) => {
    const newPoints = [...dataPoints];
    newPoints[idx] = val;
    setDataPoints(newPoints);
  };

  const addPoint = () => setDataPoints([...dataPoints, "0"]);
  const removePoint = (idx: number) => setDataPoints(dataPoints.filter((_, i) => i !== idx));

  const handleAction = (actionType: string) => {
    const cleanData = dataPoints.filter(d => !isNaN(parseFloat(d))).join(", ");
    let prompt = "";
    
    switch(actionType) {
        case 'mean': prompt = `Calculate the Mean of this dataset: [${cleanData}]`; break;
        case 'median': prompt = `Calculate the Median of this dataset: [${cleanData}]`; break;
        case 'mode': prompt = `Calculate the Mode of this dataset: [${cleanData}]`; break;
        case 'stdDev': prompt = `Calculate the Standard Deviation of this dataset: [${cleanData}]`; break;
        case 'variance': prompt = `Calculate the Variance of this dataset: [${cleanData}]`; break;
        
        case 'histogram': prompt = `Plot a Histogram for this dataset: [${cleanData}]. Return plotData suitable for a bar chart.`; break;
        case 'curve': prompt = `Plot a Normal Distribution Curve for this dataset: [${cleanData}]. Return plotData as a smooth line.`; break;
        case 'bar': prompt = `Plot a Bar Chart for this dataset: [${cleanData}].`; break;
        case 'line': prompt = `Plot a Line Chart for this dataset: [${cleanData}].`; break;
        case 'scatter': prompt = `Plot a Scatter Plot for this dataset: [${cleanData}].`; break;
        default: prompt = `Analyze this dataset: [${cleanData}]`;
    }
    
    if (onSolve) onSolve(prompt);
  };

  const renderChart = () => {
      if (!solution?.plotData || solution.plotData.length === 0) {
          // Default Empty State
          return (
              <div className="flex h-full items-center justify-center text-studio-muted/30 flex-col gap-4 animate-in fade-in">
                  <div className="p-6 bg-white/5 rounded-full">
                    <BarChart2 size={64} strokeWidth={1} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-studio-muted">Statistics Visualizer</h3>
                    <span className="text-sm opacity-60">Enter data in the table and select a visualization</span>
                  </div>
              </div>
          );
      }

      const commonProps = {
          data: solution.plotData,
          margin: {top: 20, right: 30, left: 0, bottom: 0}
      };

      const type = solution.plotType || 'bar';

      // Disable animation during streaming for instant feedback
      const animProps = isStreaming ? { isAnimationActive: false } : { isAnimationActive: true, animationDuration: 800 };

      switch(type) {
          case 'line':
              return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="x" stroke="#666" tick={{fontSize: 12}} />
                        <YAxis stroke="#666" tick={{fontSize: 12}} />
                        <Tooltip contentStyle={{ backgroundColor: '#2A2A30', borderColor: '#4f46e5', color: '#fff' }} />
                        <Line type="monotone" dataKey="y" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5'}} {...animProps} />
                    </LineChart>
                </ResponsiveContainer>
              );
          case 'scatter':
               return (
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="x" type="number" stroke="#666" />
                        <YAxis dataKey="y" type="number" stroke="#666" />
                        <Tooltip contentStyle={{ backgroundColor: '#2A2A30', borderColor: '#4f46e5' }} cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Data" data={solution.plotData} fill="#4f46e5" {...animProps} />
                    </ScatterChart>
                </ResponsiveContainer>
               );
          default: // bar
              return (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="x" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip contentStyle={{ backgroundColor: '#2A2A30', borderColor: '#4f46e5', color: '#fff' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                        <Bar dataKey="y" fill="#4f46e5" radius={[4, 4, 0, 0]} {...animProps} />
                    </BarChart>
                </ResponsiveContainer>
              );
      }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6 h-[600px]">
        {/* Data Editor & Controls */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
           
           {/* Action Dashboard */}
           <div className="bg-studio-panel border border-white/10 rounded-xl p-4 shadow-lg">
              <h3 className="text-xs font-bold text-studio-muted uppercase tracking-wider mb-3">Calculations</h3>
              <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleAction('mean')} className="p-2 bg-white/5 hover:bg-indigo-600/20 text-studio-text hover:text-indigo-400 rounded border border-white/5 text-xs font-mono flex items-center justify-center gap-2 transition-colors">
                    <Sigma size={14} /> Mean
                  </button>
                  <button onClick={() => handleAction('median')} className="p-2 bg-white/5 hover:bg-indigo-600/20 text-studio-text hover:text-indigo-400 rounded border border-white/5 text-xs font-mono flex items-center justify-center gap-2 transition-colors">
                    <Activity size={14} /> Median
                  </button>
                  <button onClick={() => handleAction('mode')} className="p-2 bg-white/5 hover:bg-indigo-600/20 text-studio-text hover:text-indigo-400 rounded border border-white/5 text-xs font-mono flex items-center justify-center gap-2 transition-colors">
                    <Calculator size={14} /> Mode
                  </button>
                  <button onClick={() => handleAction('stdDev')} className="p-2 bg-white/5 hover:bg-indigo-600/20 text-studio-text hover:text-indigo-400 rounded border border-white/5 text-xs font-mono flex items-center justify-center gap-2 transition-colors">
                    <Percent size={14} /> Std Dev
                  </button>
              </div>

              <h3 className="text-xs font-bold text-studio-muted uppercase tracking-wider mt-4 mb-3">Visualizations</h3>
              <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleAction('histogram')} className="p-2 bg-white/5 hover:bg-emerald-600/20 text-studio-text hover:text-emerald-400 rounded border border-white/5 text-xs font-mono flex items-center justify-center gap-2 transition-colors">
                     <BarChart2 size={14} /> Histogram
                  </button>
                  <button onClick={() => handleAction('curve')} className="p-2 bg-white/5 hover:bg-emerald-600/20 text-studio-text hover:text-emerald-400 rounded border border-white/5 text-xs font-mono flex items-center justify-center gap-2 transition-colors">
                     <TrendingUp size={14} /> Curve
                  </button>
                  <button onClick={() => handleAction('bar')} className="p-2 bg-white/5 hover:bg-emerald-600/20 text-studio-text hover:text-emerald-400 rounded border border-white/5 text-xs font-mono flex items-center justify-center gap-2 transition-colors">
                     <BarChart2 size={14} className="rotate-90" /> Bar Chart
                  </button>
                  <button onClick={() => handleAction('line')} className="p-2 bg-white/5 hover:bg-emerald-600/20 text-studio-text hover:text-emerald-400 rounded border border-white/5 text-xs font-mono flex items-center justify-center gap-2 transition-colors">
                     <Activity size={14} /> Line Chart
                  </button>
              </div>
           </div>

           {/* Data Table */}
           <div className="flex-1 bg-studio-panel border border-white/10 rounded-xl p-4 shadow-lg flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                        <Grid size={16} />
                        <h3>Dataset</h3>
                    </div>
                    <button onClick={addPoint} className="p-1 hover:bg-white/10 rounded text-green-400 transition-colors"><Plus size={16}/></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                    <table className="w-full text-sm text-left">
                        <thead>
                        <tr className="text-studio-muted border-b border-white/5">
                            <th className="pb-2 pl-2 text-xs font-mono">i</th>
                            <th className="pb-2 text-xs font-mono">Val</th>
                            <th className="pb-2"></th>
                        </tr>
                        </thead>
                        <tbody>
                        {dataPoints.map((val, idx) => (
                            <tr key={idx} className="group hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                            <td className="py-1 pl-2 text-studio-muted font-mono w-8 text-xs">{idx + 1}</td>
                            <td className="py-1">
                                <input 
                                type="number" 
                                value={val} 
                                onChange={(e) => updatePoint(idx, e.target.value)}
                                className="bg-transparent text-white w-full outline-none focus:text-indigo-400 font-mono text-sm"
                                />
                            </td>
                            <td className="py-1 text-right">
                                <button onClick={() => removePoint(idx)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                                <Trash2 size={12} />
                                </button>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
           </div>
        </div>

        {/* Visualization Area */}
        <div className="w-full md:w-2/3 bg-[#1e1e24] border border-white/10 rounded-xl p-4 relative overflow-hidden shadow-inner flex flex-col">
            {isStreaming && <GenerationStatus count={solution?.plotData?.length || 0} target={20} label="Analyzing Data" />}
            {renderChart()}
        </div>
      </div>

      {solution && <SolutionDetails solution={solution} isStreaming={isStreaming} onSpeak={() => {}} />}
    </div>
  );
};

const GeometryToolView = ({ solution, onSolve, isStreaming }: any) => {
  // Render logic for blueprint
  const renderElements = (elements: GeometryElement[]) => {
    // Blueprint Mapping: -10..10 coordinate system to 0..300 svg space
    // Center is 150, 150. Scale factor 15.
    const scale = (val: number) => (val * 15) + 150; 
    const scaleY = (val: number) => 150 - (val * 15); 
    const scaleDist = (val: number) => val * 15;

    return elements.map((el, idx) => {
       switch(el.type) {
         case 'circle':
           // params: [cx, cy, r]
           return <circle key={idx} cx={scale(el.params[0])} cy={scaleY(el.params[1])} r={scaleDist(el.params[2])} stroke={el.color || '#4f46e5'} fill="none" strokeWidth="2"/>;
         case 'line':
           // params: [x1, y1, x2, y2]
           return <line key={idx} x1={scale(el.params[0])} y1={scaleY(el.params[1])} x2={scale(el.params[2])} y2={scaleY(el.params[3])} stroke={el.color || '#ef4444'} strokeWidth="2" strokeLinecap="round"/>;
         case 'polygon':
           // params: [x1, y1, ... xn, yn]
           const pts = [];
           for(let i=0; i<el.params.length; i+=2) pts.push(`${scale(el.params[i])},${scaleY(el.params[i+1])}`);
           return <polygon key={idx} points={pts.join(" ")} fill={el.color ? el.color + '40' : '#4f46e540'} stroke={el.color || '#4f46e5'} strokeWidth="2"/>;
         case 'point':
           // params: [x, y]
           return <circle key={idx} cx={scale(el.params[0])} cy={scaleY(el.params[1])} r={4} fill={el.color || '#fff'} />;
         default: return null;
       }
    });
  };

  const handleShape = (shape: string) => {
    if(onSolve) onSolve(`Construct a ${shape} and calculate its properties.`);
  };

  const elementCount = solution?.geometryElements?.length || 0;

  return (
    <div className="flex flex-col gap-6">
       <div className="w-full h-[500px] bg-[#1e1e24] border border-white/10 rounded-xl relative overflow-hidden shadow-inner">
          
          {isStreaming && <GenerationStatus count={elementCount} target={5} label="Drafting Shapes" />}

          {/* Persistent Toolbar */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-studio-panel/90 backdrop-blur border border-white/10 p-2 rounded-lg shadow-xl">
             <button onClick={() => handleShape("triangle")} className="p-2 hover:bg-indigo-500/20 text-studio-muted hover:text-indigo-400 rounded transition-colors" title="Triangle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18L12 4z"/></svg>
             </button>
             <button onClick={() => handleShape("circle")} className="p-2 hover:bg-indigo-500/20 text-studio-muted hover:text-indigo-400 rounded transition-colors" title="Circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
             </button>
             <button onClick={() => handleShape("square")} className="p-2 hover:bg-indigo-500/20 text-studio-muted hover:text-indigo-400 rounded transition-colors" title="Square">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
             </button>
          </div>

          {/* Canvas */}
          <svg viewBox="0 0 300 300" className="w-full h-full">
            {/* Blueprint Grid */}
             <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                   <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#2A2A30" strokeWidth="1"/>
                </pattern>
                <pattern id="gridSmall" width="6" height="6" patternUnits="userSpaceOnUse">
                   <path d="M 6 0 L 0 0 0 6" fill="none" stroke="#232328" strokeWidth="0.5"/>
                </pattern>
             </defs>
             <rect width="100%" height="100%" fill="url(#gridSmall)" />
             <rect width="100%" height="100%" fill="url(#grid)" />
             
             {/* Axis Lines */}
             <line x1="0" y1="150" x2="300" y2="150" stroke="#4f46e5" strokeWidth="1" strokeOpacity="0.3" />
             <line x1="150" y1="0" x2="150" y2="300" stroke="#4f46e5" strokeWidth="1" strokeOpacity="0.3" />
             
             {solution?.geometryElements && renderElements(solution.geometryElements)}
          </svg>
          
          {elementCount === 0 && !isStreaming && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="text-center opacity-30">
                  <BrainCircuit size={48} className="mx-auto mb-2" />
                  <span className="text-sm font-mono">Geometry Workspace</span>
               </div>
             </div>
          )}
       </div>

       {solution && <SolutionDetails solution={solution} isStreaming={isStreaming} onSpeak={() => {}} />}
    </div>
  );
};

const GraphToolView = ({ solution, onSolve, isStreaming }: any) => {
  // Graph View State
  const [left, setLeft] = useState<number | string>('dataMin');
  const [right, setRight] = useState<number | string>('dataMax');
  const [top, setTop] = useState<number | string>('dataMax+1');
  const [bottom, setBottom] = useState<number | string>('dataMin-1');
  
  const [refAreaLeft, setRefAreaLeft] = useState<string | number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | number | null>(null);

  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === null || refAreaLeft === null) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }
    let lower = refAreaLeft;
    let upper = refAreaRight;
    if (typeof lower === 'number' && typeof upper === 'number' && lower > upper) {
        [lower, upper] = [upper, lower];
    }
    setRefAreaLeft(null);
    setRefAreaRight(null);
    setLeft(lower);
    setRight(upper);
  };

  const zoomOut = () => {
     setLeft('dataMin');
     setRight('dataMax');
     setTop('auto');
     setBottom('auto');
  };

  // Use solution data or fallback to a dummy grid for "Empty State"
  const chartData = solution?.plotData && solution.plotData.length > 0 
     ? solution.plotData 
     : [{x: -10, y: 0}, {x: 10, y: 0}]; 

  return (
    <div className="flex flex-col gap-6">
      <div className="w-full h-[500px] bg-[#1e1e24] border border-white/10 rounded-xl relative overflow-hidden shadow-inner select-none">
         
         {isStreaming && <GenerationStatus count={solution?.plotData?.length || 0} target={100} label="Plotting Function" />}

         {/* Floating Quick Actions */}
         <div className="absolute top-4 right-4 flex gap-2 z-20">
            <div className="flex gap-1 bg-studio-panel/90 backdrop-blur p-1 rounded-lg border border-white/10 shadow-xl">
              {["y=x^2", "y=sin(x)", "y=tan(x)"].map(fn => (
                 <button 
                   key={fn} 
                   onClick={() => onSolve && onSolve(`Plot ${fn}`)} 
                   className="px-3 py-1.5 hover:bg-indigo-500/20 text-xs font-mono text-studio-text hover:text-indigo-400 rounded transition-colors"
                 >
                   {fn}
                 </button>
              ))}
            </div>
            <button onClick={zoomOut} className="p-2 bg-studio-panel/90 backdrop-blur border border-white/10 rounded-lg hover:bg-white/10 text-studio-text shadow-xl" title="Reset View">
               <RefreshCw size={16} />
            </button>
         </div>

         <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                onMouseDown={(e: any) => e && setRefAreaLeft(e.activeLabel)}
                onMouseMove={(e: any) => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
                onMouseUp={zoom}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="x" type="number" allowDataOverflow domain={[left, right]} stroke="#666" tick={{fontSize: 12}} />
                <YAxis allowDataOverflow domain={[bottom, top]} stroke="#666" tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ backgroundColor: '#2A2A30', borderColor: '#4f46e5', color: '#fff' }} labelStyle={{color: '#aaa'}} />
                <ReferenceLine y={0} stroke="#555" />
                <ReferenceLine x={0} stroke="#555" />
                {solution?.plotData && solution.plotData.length > 0 && (
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    dot={false} 
                    activeDot={{ r: 6 }} 
                    isAnimationActive={!isStreaming} // Critical for real-time performance
                    animationDuration={500}
                  />
                )}
                {refAreaLeft && refAreaRight ? (
                  <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#4f46e5" fillOpacity={0.1} />
                ) : null}
            </LineChart>
         </ResponsiveContainer>
      </div>

      {solution && <SolutionDetails solution={solution} isStreaming={isStreaming} onSpeak={() => {}} />}
    </div>
  );
};

// --- MAIN RENDERER ---

export const MathRenderer: React.FC<MathRendererProps> = ({ solution, isStreaming = false, currentTool = ToolType.SOLVER, onSolve }) => {
  
  const handleSpeak = async () => {
    if (!solution) return;
    const steps = solution.steps || [];
    const narration = `${solution.summary}. ${steps.slice(0, 3).join(". ")}`;
    const audioBuffer = await generateVoiceGuidance(narration);
    if (audioBuffer) playAudioBuffer(audioBuffer);
  };

  // Persistent Layout Switching based on Tool
  if (currentTool === ToolType.GRAPH) {
    return <GraphToolView solution={solution} isStreaming={isStreaming} onSolve={onSolve} />;
  }

  if (currentTool === ToolType.STATISTICS) {
    return <StatsToolView solution={solution} isStreaming={isStreaming} onSolve={onSolve} />;
  }

  if (currentTool === ToolType.GEOMETRY) {
    return <GeometryToolView solution={solution} isStreaming={isStreaming} onSolve={onSolve} />;
  }

  // Default / Solver View
  return (
     <div className="space-y-6">
        {!solution ? (
           <div className="h-[60vh] flex flex-col items-center justify-center text-center opacity-50 animate-in fade-in zoom-in duration-500">
              <div className="relative">
                 <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"></div>
                 <BrainCircuit size={80} className="mb-6 text-indigo-500 relative z-10" strokeWidth={1} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">MathStudio Solver</h2>
              <p className="max-w-md text-studio-muted text-lg">Ask any math problem to get a step-by-step breakdown.</p>
           </div>
        ) : (
           <SolutionDetails solution={solution} isStreaming={isStreaming} onSpeak={handleSpeak} />
        )}
     </div>
  );
};