import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { VisualizationMode, ChartDataPoint } from '../types';

interface VisualizerProps {
  mode: VisualizationMode;
  data: ChartDataPoint[];
  htmlContent?: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({ mode, data, htmlContent }) => {
  
  if (mode === VisualizationMode.None) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-950/50">
        <div className="w-16 h-16 border-2 border-slate-800 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p>No active visualization</p>
        <p className="text-xs opacity-50 mt-2">Run code to see results</p>
      </div>
    );
  }

  if (mode === VisualizationMode.DOM && htmlContent) {
    return (
      <div className="w-full h-full bg-white overflow-auto relative">
        {/* Sandbox the HTML content loosely for demo purposes */}
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="w-full h-full" />
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          Preview Mode
        </div>
      </div>
    );
  }

  if (mode === VisualizationMode.Chart) {
    return (
      <div className="w-full h-full p-4 flex flex-col bg-slate-900">
        <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-bold">Live Data Stream</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', color: '#f1f5f9' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={300}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value > 80 ? '#f43f5e' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return <div className="p-4 text-red-500">Unknown Mode</div>;
};