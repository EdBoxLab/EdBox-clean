import React, { useState, useRef, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import ArtCanvas, { ArtCanvasHandle } from './components/ArtCanvas';
import AIPanel from './components/AIPanel';
import { DrawingState, BrushType } from './types';
import { MonitorPlay, Sparkles, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<DrawingState>({
    isDrawing: false,
    color: '#000000',
    brushSize: 5,
    brushType: BrushType.PENCIL
  });
  
  const [showAIPanel, setShowAIPanel] = useState(false);
  const canvasRef = useRef<ArtCanvasHandle>(null);

  const handleStateChange = (updates: Partial<DrawingState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleClear = () => {
    canvasRef.current?.clear();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'artlab-creation.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          canvasRef.current?.loadImage(url);
      }
  }

  // Callback to get current image data for AI
  const getCanvasData = useCallback(() => {
      const canvas = canvasRef.current?.getCanvas();
      return canvas ? canvas.toDataURL('image/png') : null;
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-art-bg text-white font-sans selection:bg-art-accent selection:text-white overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden h-14 shrink-0 bg-art-panel border-b border-gray-800 flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-2">
              <MonitorPlay className="text-art-accent" size={24} />
              <span className="font-bold text-lg tracking-tight">ArtLab</span>
          </div>
          <button 
            onClick={() => setShowAIPanel(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-full text-sm border border-zinc-700 text-art-accent hover:bg-zinc-700"
          >
              <Sparkles size={16} />
              <span>AI Tutor</span>
          </button>
      </div>

      {/* Desktop Logo/Sidebar Header */}
      <div className="hidden md:flex fixed top-0 left-0 w-16 h-16 items-center justify-center bg-art-panel border-r border-b border-gray-800 z-30">
         <MonitorPlay className="text-art-accent" size={28} />
      </div>

      {/* Toolbar - Left on Desktop, Bottom on Mobile */}
      <div className="order-3 md:order-1 shrink-0 w-full md:w-auto md:pt-16 z-30 bg-art-panel md:bg-transparent">
        <Toolbar 
            state={state} 
            onChange={handleStateChange} 
            onClear={handleClear}
            onDownload={handleDownload}
            onUpload={handleUpload}
        />
      </div>

      {/* Center Canvas - Flexible */}
      <main className="flex-1 order-2 relative flex flex-col overflow-hidden bg-zinc-900">
         <div className="absolute top-4 left-4 md:left-8 z-10 pointer-events-none opacity-30 hidden md:block">
            <h1 className="text-2xl font-bold tracking-tight text-white/20 uppercase">ArtLab <span className="text-xs align-top">v2.0</span></h1>
         </div>
         <ArtCanvas 
            ref={canvasRef} 
            state={state} 
            onCanvasReady={(c) => console.log("Canvas Mounted")} 
         />
      </main>

      {/* AI Panel - Right fixed on Desktop, Slide-over Modal on Mobile */}
      <div className={`
        fixed inset-0 md:inset-auto md:relative md:order-3 z-50 md:z-auto
        md:w-auto md:flex
        transform transition-transform duration-300 ease-in-out
        ${showAIPanel ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
          {/* Mobile overlay background */}
          <div 
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm md:hidden transition-opacity ${showAIPanel ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setShowAIPanel(false)} 
          />
          
          {/* Panel Content */}
          <div className="absolute right-0 top-0 bottom-0 w-[85vw] md:w-auto md:static md:h-full bg-art-panel shadow-2xl md:shadow-none h-full flex flex-col">
             <AIPanel 
                getCanvasImage={getCanvasData} 
                onClose={() => setShowAIPanel(false)}
             />
          </div>
      </div>
      
    </div>
  );
};

export default App;