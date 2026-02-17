
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { interactionTracker } from '../../services/interaction-tracker';

// Activation functions
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

interface NeuronVisualizerProps {
    data?: {
        inputs?: number[];
        weights?: number[];
        bias?: number;
    },
    onUpdate?: (newData: any) => void;
}

const NeuronVisualizer: React.FC<NeuronVisualizerProps> = ({ data, onUpdate }) => {
  const [inputs, setInputs] = useState<number[]>([0.5, 0.8]);
  const [weights, setWeights] = useState<number[]>([1.0, 0.5]);
  const [bias, setBias] = useState<number>(0);
  const [output, setOutput] = useState<number>(0);
  const [graphData, setGraphData] = useState<any[]>([]);

  // Sync with external control (Genie)
  useEffect(() => {
      if (data) {
          if (data.inputs && JSON.stringify(data.inputs) !== JSON.stringify(inputs)) setInputs(data.inputs);
          if (data.weights && JSON.stringify(data.weights) !== JSON.stringify(weights)) setWeights(data.weights);
          if (data.bias !== undefined && data.bias !== bias) setBias(data.bias);
      }
  }, [data]);

  // Sync TO external state
  const syncState = (newInputs: number[], newWeights: number[], newBias: number, label: string) => {
      if (onUpdate) {
          onUpdate({ inputs: newInputs, weights: newWeights, bias: newBias });
      }
      interactionTracker.log({
          type: 'update',
          widgetType: 'NEURON_VISUALIZER',
          details: `User changed ${label}`
      });
  };

  useEffect(() => {
    // Calculate Neuron Output
    const z = (inputs[0] * weights[0]) + (inputs[1] * weights[1]) + bias;
    const a = sigmoid(z);
    setOutput(a);

    // Generate graph data for the Sigmoid curve visualization shifted by bias
    const d = [];
    for (let i = -6; i <= 6; i += 0.5) {
      d.push({
        x: i,
        y: sigmoid(i + bias), // Visualizing how bias shifts the curve
      });
    }
    setGraphData(d);
  }, [inputs, weights, bias]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 p-4 select-none overflow-y-auto">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left: Interactive Controls */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 relative group">
             <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title="Live Sync Active" />

            <h4 className="text-xs font-bold text-cyan-400 uppercase mb-3">Inputs (X)</h4>
            {inputs.map((val, idx) => (
              <div key={`input-${idx}`} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Input x<sub>{idx}</sub></span>
                  <span className="text-cyan-300">{val.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={val}
                  onChange={(e) => {
                    const newInputs = [...inputs];
                    newInputs[idx] = parseFloat(e.target.value);
                    setInputs(newInputs);
                    syncState(newInputs, weights, bias, `Input[${idx}] to ${newInputs[idx]}`);
                  }}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            ))}
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 relative group">
            <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <h4 className="text-xs font-bold text-purple-400 uppercase mb-3">Parameters</h4>
            <div className="mb-3">
               <div className="flex justify-between text-xs mb-1">
                  <span>Weight w<sub>0</sub></span>
                  <span className="text-purple-300">{weights[0].toFixed(2)}</span>
                </div>
                <input type="range" min="-2" max="2" step="0.1" value={weights[0]}
                  onChange={(e) => { 
                      const w = [...weights]; 
                      w[0] = parseFloat(e.target.value); 
                      setWeights(w); 
                      syncState(inputs, w, bias, `Weight[0] to ${w[0]}`);
                  }}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
            </div>
            
            <div className="mb-3">
               <div className="flex justify-between text-xs mb-1">
                  <span>Bias (b)</span>
                  <span className="text-yellow-300">{bias.toFixed(2)}</span>
                </div>
                <input type="range" min="-5" max="5" step="0.1" value={bias}
                  onChange={(e) => {
                      const b = parseFloat(e.target.value);
                      setBias(b);
                      syncState(inputs, weights, b, `Bias to ${b}`);
                  }}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
            </div>
          </div>
        </div>

        {/* Right: Visualization */}
        <div className="flex flex-col space-y-4">
          {/* Neuron Diagram */}
          <div className="flex-1 bg-black/40 rounded-xl relative flex items-center justify-center border border-white/5 overflow-hidden min-h-[200px]">
             <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
                <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="white" strokeWidth={Math.abs(weights[0]) + 1} />
                <line x1="20%" y1="70%" x2="50%" y2="50%" stroke="white" strokeWidth={Math.abs(weights[1]) + 1} />
                <line x1="50%" y1="50%" x2="80%" y2="50%" stroke={output > 0.5 ? '#22d3ee' : '#94a3b8'} strokeWidth="2" />
             </svg>

             <div className="absolute left-[15%] top-[25%] text-xs text-center">
                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center mb-1">x0</div>
             </div>
             <div className="absolute left-[15%] top-[65%] text-xs text-center">
                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center mb-1">x1</div>
             </div>

             <motion.div 
                className="w-20 h-20 rounded-full border-2 flex items-center justify-center z-10 shadow-xl relative"
                style={{
                    backgroundColor: `rgba(34, 211, 238, ${output})`,
                    borderColor: output > 0.5 ? '#67e8f9' : '#475569',
                    boxShadow: `0 0 ${output * 30}px rgba(34, 211, 238, 0.6)`
                }}
             >
                <div className="text-center text-white font-bold drop-shadow-md">
                   <div className="text-[10px] opacity-70">Output</div>
                   {output.toFixed(2)}
                </div>
             </motion.div>
          </div>

          <div className="h-32 bg-slate-900/50 rounded-xl border border-white/5 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData}>
                <defs>
                  <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="x" hide />
                <YAxis hide domain={[0, 1]} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="y" stroke="#8884d8" fillOpacity={1} fill="url(#colorY)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeuronVisualizer;
