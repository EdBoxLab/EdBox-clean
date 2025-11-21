import React from 'react';
import { BrushType, DrawingState } from '../types';
import { Pencil, PenTool, Highlighter, Eraser, Trash2, Download, Upload } from 'lucide-react';

interface ToolbarProps {
  state: DrawingState;
  onChange: (updates: Partial<DrawingState>) => void;
  onClear: () => void;
  onDownload: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ state, onChange, onClear, onDownload, onUpload }) => {
  const tools = [
    { type: BrushType.PENCIL, icon: <Pencil size={20} />, label: 'Pencil' },
    { type: BrushType.INK, icon: <PenTool size={20} />, label: 'Ink' },
    { type: BrushType.MARKER, icon: <Highlighter size={20} />, label: 'Marker' },
    { type: BrushType.ERASER, icon: <Eraser size={20} />, label: 'Eraser' },
  ];

  const colors = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', 
    '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'
  ];

  return (
    <div className="flex flex-row md:flex-col items-center md:h-full w-full md:w-16 bg-art-panel md:border-r border-t md:border-t-0 border-gray-800 p-2 md:py-4 gap-4 md:gap-6 z-10 overflow-x-auto md:overflow-visible no-scrollbar justify-between md:justify-start">
      
      {/* Tools */}
      <div className="flex flex-row md:flex-col gap-2 shrink-0">
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => onChange({ brushType: tool.type })}
            className={`p-2 md:p-3 rounded-xl transition-all ${
              state.brushType === tool.type
                ? 'bg-art-accent text-white shadow-lg shadow-blue-900/50'
                : 'text-art-secondary hover:bg-gray-700 hover:text-white'
            }`}
            title={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div className="w-px h-8 md:w-8 md:h-px bg-gray-700 shrink-0" />

      {/* Colors */}
      <div className="flex flex-row md:flex-col gap-2 shrink-0">
        {colors.slice(0, 5).map((color) => (
          <button
            key={color}
            onClick={() => onChange({ color })}
            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
              state.color === color ? 'border-white ring-2 ring-art-accent' : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
        {/* Show extra colors on desktop only to save space on mobile, or use a scroll */}
        <div className="hidden md:contents">
             {colors.slice(5).map((color) => (
                <button
                    key={color}
                    onClick={() => onChange({ color })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    state.color === color ? 'border-white ring-2 ring-art-accent' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                />
            ))}
        </div>
        
        <input 
            type="color" 
            value={state.color}
            onChange={(e) => onChange({color: e.target.value})}
            className="w-6 h-6 rounded-full overflow-hidden p-0 border-0 shrink-0"
        />
      </div>

      <div className="w-px h-8 md:w-8 md:h-px bg-gray-700 shrink-0 hidden md:block" />

      {/* Actions */}
      <div className="flex flex-row md:flex-col gap-3 md:mt-auto shrink-0 ml-auto md:ml-0">
        <label className="cursor-pointer p-2 md:p-3 rounded-xl text-art-secondary hover:bg-gray-700 hover:text-white transition-all" title="Upload Image">
           <Upload size={20} />
           <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </label>

        <button
          onClick={onDownload}
          className="p-2 md:p-3 rounded-xl text-art-secondary hover:bg-gray-700 hover:text-white transition-all"
          title="Download Art"
        >
          <Download size={20} />
        </button>

        <button
          onClick={onClear}
          className="p-2 md:p-3 rounded-xl text-red-400 hover:bg-red-900/30 transition-all"
          title="Clear Canvas"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;