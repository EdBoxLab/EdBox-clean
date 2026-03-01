'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Eraser, PenTool, Trash2, Hand, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { interactionTracker } from '../../services/interaction-tracker';
import { widgetTelemetry } from '../../services/widget-telemetry';
import mermaid from 'mermaid';

// --- Mermaid Support ---
const Mermaid = ({ chart }: { chart: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (ref.current && chart) {
            mermaid.initialize({ startOnLoad: true, theme: 'dark' });
            mermaid.contentLoaded();
            // Use a timeout to ensure DOM is ready
            setTimeout(() => {
                if (ref.current) {
                    try {
                        mermaid.render('mermaid-' + Date.now(), chart).then(({ svg }) => {
                            if (ref.current) ref.current.innerHTML = svg;
                        });
                    } catch (e) { console.error('Mermaid render error', e); }
                }
            }, 0);
        }
    }, [chart]);
    return <div ref={ref} className="flex justify-center my-6 bg-slate-900/50 p-4 rounded-xl border border-white/5 overflow-x-auto" />;
};

interface SmartBoardProps {
    data?: {
        action?: 'clear' | 'write';
        content?: string; // Markdown text
        imageData?: string; // Data URL for persistence
        timestamp?: number;
        mode?: 'tutor' | 'collaboration';
    };
    onUpdate?: (newData: any) => void;
}

const SmartBoard: React.FC<SmartBoardProps> = ({ data, onUpdate }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#ffffff');
    const [tool, setTool] = useState<'pen' | 'eraser' | 'move'>('pen');
    const [lineWidth, setLineWidth] = useState(2);
    const [textContent, setTextContent] = useState<string>('');
    const [isFullscreenContent, setIsFullscreenContent] = useState(false);

    useEffect(() => {
        if (!data) return;
        if (data.content !== undefined && data.content !== textContent) {
            setTextContent(data.content);
            widgetTelemetry.fire({ event_type: 'blackboard_read', widget_type: 'BLACKBOARD', event_data: { content_length: data.content.length } });
        }
        if (data.action === 'clear' && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            setTextContent('');
        }
    }, [data?.timestamp, data?.action, data?.content]);

    // Canvas Drawing Logic (Same as original but refined)
    const saveState = () => {
        if (canvasRef.current && onUpdate) {
            onUpdate({ imageData: canvasRef.current.toDataURL() });
            widgetTelemetry.fire({ event_type: 'blackboard_drawn', widget_type: 'BLACKBOARD' });
        }
    };

    const startDrawing = (e: any) => {
        if (tool === 'move') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX || e.touches[0].clientX) - rect.left) * (canvas.width / rect.width);
        const y = ((e.clientY || e.touches[0].clientY) - rect.top) * (canvas.height / rect.height);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX || e.touches[0].clientX) - rect.left) * (canvas.width / rect.width);
        const y = ((e.clientY || e.touches[0].clientY) - rect.top) * (canvas.height / rect.height);
        ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
        ctx.lineCap = 'round';
        ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = color;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    return (
        <div className="flex flex-col h-full bg-[#0f172a] text-slate-200 relative overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-20 shrink-0">
                <div className="flex items-center space-x-2">
                    <button onClick={() => setTool('move')} className={`p-2 rounded-lg transition ${tool === 'move' ? 'bg-cyan-600' : 'hover:bg-white/5'}`}><Hand size={14} /></button>
                    <button onClick={() => setTool('pen')} className={`p-2 rounded-lg transition ${tool === 'pen' ? 'bg-cyan-600' : 'hover:bg-white/5'}`}><PenTool size={14} /></button>
                    <button onClick={() => setTool('eraser')} className={`p-2 rounded-lg transition ${tool === 'eraser' ? 'bg-cyan-600' : 'hover:bg-white/5'}`}><Eraser size={14} /></button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-5 h-5 bg-transparent cursor-pointer" />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsFullscreenContent(!isFullscreenContent)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
                        {isFullscreenContent ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                    <button onClick={() => { setTextContent(''); if (canvasRef.current) canvasRef.current.getContext('2d')?.clearRect(0, 0, 9999, 9999); }} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={14} /></button>
                </div>
            </div>

            <div className="flex-1 overflow-auto relative scrollbar-hide" ref={containerRef}>
                <div ref={wrapperRef} className="relative min-h-full w-full p-8 md:p-12 transition-all duration-500">
                    <div className={`transition-all duration-500 ${isFullscreenContent ? 'max-w-none' : 'max-w-4xl mx-auto'}`}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                                code({ node, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    if (match && match[1] === 'mermaid') {
                                        return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                                    }
                                    return <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-sm" {...props}>{children}</code>;
                                },
                                h1: ({ node, ...props }) => <h1 className="text-4xl font-bold text-white mb-8 border-b border-white/10 pb-4 tracking-tight" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-cyan-200 mt-12 mb-4" {...props} />,
                                p: ({ node, ...props }) => <p className="text-xl leading-relaxed text-slate-300 mb-6" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-6 space-y-3" {...props} />,
                                li: ({ node, ...props }) => <li className="text-lg text-slate-300" {...props} />,
                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-500 bg-indigo-500/5 p-6 rounded-r-xl my-8 italic text-indigo-100" {...props} />,
                            }}
                        >
                            {textContent}
                        </ReactMarkdown>
                    </div>
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={() => { setIsDrawing(false); saveState(); }}
                        className={`absolute inset-0 z-10 ${tool === 'move' ? 'pointer-events-none' : 'cursor-crosshair'}`}
                        width={2000} height={4000} // Oversized for scrolling 
                    />
                </div>
            </div>

            {data?.mode === 'tutor' && (
                <div className="absolute top-4 right-4 bg-indigo-600/20 backdrop-blur-xl border border-indigo-500/30 px-3 py-1.5 rounded-full flex items-center gap-2 z-30">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Tutor Mode Active</span>
                </div>
            )}
        </div>
    );
};

export default SmartBoard;
