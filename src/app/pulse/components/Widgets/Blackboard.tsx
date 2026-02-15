
import React, { useRef, useState, useEffect } from 'react';
import { Eraser, PenTool, Trash2, Hand } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { interactionTracker } from '../../services/interaction-tracker';

interface BlackboardProps {
    data?: {
        action?: 'clear' | 'write';
        content?: string; // Markdown text
        imageData?: string; // Data URL for persistence
        timestamp?: number;
    };
    onUpdate?: (newData: any) => void;
}

const Blackboard: React.FC<BlackboardProps> = ({ data, onUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [tool, setTool] = useState<'pen' | 'eraser' | 'move'>('pen');
  const [lineWidth, setLineWidth] = useState(2);
  const [cursorPos, setCursorPos] = useState<{x: number, y: number} | null>(null);
  
  // State for the text content (Markdown)
  const [textContent, setTextContent] = useState<string>('');

  // 1. Handle incoming data (Text & Actions)
  useEffect(() => {
      if (!data) return;

      // Handle Text Content
      if (data.content !== undefined && data.content !== textContent) {
          setTextContent(data.content);
      }

      // Handle Clear Action
      if (data.action === 'clear' && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              saveState();
          }
          setTextContent('');
      }
  }, [data?.timestamp, data?.action, data?.content]);

  // 2. Handle Image Persistence (Load drawing)
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !data?.imageData) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
      };
      img.src = data.imageData;
  }, []); // Run once on mount to restore previous drawing

  // 3. Auto-Resize Canvas to match Content Height
  useEffect(() => {
    if (!wrapperRef.current || !canvasRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
        // Wrap in RAF to prevent "ResizeObserver loop completed with undelivered notifications"
        window.requestAnimationFrame(() => {
            const wrapper = wrapperRef.current;
            const canvas = canvasRef.current;
            if (!wrapper || !canvas) return;

            // Determine new size (min-height 100% of container, or height of text)
            const newHeight = Math.max(wrapper.scrollHeight, wrapper.clientHeight);
            const newWidth = wrapper.clientWidth;

            // Only resize if dimensions changed significantly
            if (canvas.width !== newWidth || Math.abs(canvas.height - newHeight) > 5) {
                // Save current drawing
                const savedData = canvas.toDataURL();
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                // Restore drawing
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const img = new Image();
                    img.onload = () => ctx.drawImage(img, 0, 0);
                    img.src = savedData;
                }
            }
        });
    });

    resizeObserver.observe(wrapperRef.current);
    return () => resizeObserver.disconnect();
  }, []);


  const saveState = () => {
      if (canvasRef.current && onUpdate) {
          const dataUrl = canvasRef.current.toDataURL();
          // We don't save 'content' here because that comes from the AI/Props.
          // We strictly save the *drawing* layer here.
          onUpdate({ imageData: dataUrl });
      }
  };

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      
      let clientX, clientY;
      
      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }

      return {
          x: (clientX - rect.left) * (canvas.width / rect.width),
          y: (clientY - rect.top) * (canvas.height / rect.height)
      };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'move') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoordinates(e);
    
    ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
    ctx.lineCap = 'round';
    
    if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  };

  const stopDrawing = () => {
    if (isDrawing) {
        setIsDrawing(false);
        saveState();
        interactionTracker.log({
            type: 'draw',
            widgetType: 'BLACKBOARD',
            details: `User drew a stroke with ${tool}`
        });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      setCursorPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
      draw(e);
  };

  const clearBoard = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setTextContent(''); // Also clear text on explicit clear
      saveState();
      
      interactionTracker.log({
          type: 'click',
          widgetType: 'BLACKBOARD',
          details: 'User cleared the blackboard'
      });
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 text-slate-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-slate-900 border-b border-white/10 shrink-0 z-20 overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-max">
            <button 
                onClick={() => setTool('move')} 
                className={`p-1.5 rounded ${tool === 'move' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                title="Scroll/Move Mode"
            >
                <Hand size={16} />
            </button>
            <button 
                onClick={() => setTool('pen')} 
                className={`p-1.5 rounded ${tool === 'pen' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                title="Pen Tool"
            >
                <PenTool size={16} />
            </button>
            <button 
                onClick={() => setTool('eraser')} 
                className={`p-1.5 rounded ${tool === 'eraser' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                title="Eraser"
            >
                <Eraser size={16} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer bg-transparent" 
            />
             <input 
                type="range" 
                min="1" max="10" 
                value={lineWidth} 
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
        </div>
        <button onClick={clearBoard} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded">
            <Trash2 size={16} />
        </button>
      </div>
      
      {/* Scrollable Container */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-auto relative group bg-[#1e293b] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent ${tool === 'move' ? 'cursor-grab active:cursor-grabbing' : 'touch-none'}`}
      >
        <div ref={wrapperRef} className="relative min-h-full w-full">
            
            {/* Layer 1: Markdown Content (Background) */}
            <div 
                className="w-full min-h-full p-8 z-0 pointer-events-none blackboard-content"
                style={{ 
                    fontFamily: '"Chalkboard SE", "Comic Sans MS", sans-serif',
                    color: '#e2e8f0',
                    lineHeight: '1.6'
                }}
            >
                 <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                        p: ({node, ...props}) => <p className="mb-4 text-xl" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-4 border-b border-white/20 pb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-2xl font-bold mb-3" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                        li: ({node, ...props}) => <li className="text-lg" {...props} />,
                        code: ({node, ...props}) => <code className="bg-white/10 px-1 rounded mx-1 font-mono text-base" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-white/30 pl-4 italic my-4" {...props} />,
                    }}
                 >
                     {textContent}
                 </ReactMarkdown>
            </div>

            {/* Layer 2: Canvas (Drawing Overlay) */}
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDrawing}
              onMouseLeave={() => { stopDrawing(); setCursorPos(null); }}
              onMouseEnter={(e) => setCursorPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })}
              
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              
              className={`absolute inset-0 z-10 ${tool === 'move' ? 'pointer-events-none' : 'cursor-none'}`}
            />
        </div>
        
        {/* Custom Cursor Rendering (Mouse Only) */}
        {cursorPos && tool === 'pen' && (
             <div 
                className="pointer-events-none absolute z-50 transition-transform duration-75 ease-out will-change-transform hidden md:block"
                style={{
                    left: 0, top: 0,
                    transform: `translate(${cursorPos.x}px, ${cursorPos.y - containerRef.current!.scrollTop}px)`, // Adjust for scroll
                }}
             >
                {/* SVG Pen Cursor */}
                <div 
                    className="relative"
                    style={{
                        transform: isDrawing ? 'translate(-2px, -78px) rotate(0deg) scale(0.95)' : 'translate(-2px, -78px) rotate(0deg)',
                        transformOrigin: '2px 78px',
                        transition: 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
                        filter: 'drop-shadow(5px 10px 15px rgba(0,0,0,0.4))'
                    }}
                >
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                             <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#e2e8f0" />
                                <stop offset="50%" stopColor="#94a3b8" />
                                <stop offset="100%" stopColor="#64748b" />
                            </linearGradient>
                            <linearGradient id="gripGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#334155" />
                                <stop offset="100%" stopColor="#0f172a" />
                            </linearGradient>
                        </defs>
                        <path d="M2 78 L14 66 L20 72 Z" fill={color} />
                        <path d="M14 66 L26 54 L32 60 L20 72 Z" fill="url(#gripGrad)" />
                        <path d="M26 54 L66 14 L72 20 L32 60 Z" fill="url(#bodyGrad)" stroke="#475569" strokeWidth="0.5"/>
                        <path d="M66 14 L74 6 L78 10 L72 20 Z" fill="#334155" />
                    </svg>
                </div>
             </div>
        )}
        {cursorPos && tool === 'eraser' && (
             <div 
                className="pointer-events-none absolute z-50 border-2 border-slate-400 bg-white/10 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.3)] backdrop-blur-sm hidden md:block"
                style={{
                    width: '32px', height: '32px', left: 0, top: 0,
                    transform: `translate(${cursorPos.x - 16}px, ${cursorPos.y - 16 - containerRef.current!.scrollTop}px)`
                }}
            />
        )}
      </div>
    </div>
  );
};

export default Blackboard;
