import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { DrawingState, BrushType } from '../types';

interface ArtCanvasProps {
  state: DrawingState;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

export interface ArtCanvasHandle {
  clear: () => void;
  loadImage: (url: string) => void;
  getCanvas: () => HTMLCanvasElement | null;
}

const ArtCanvas = forwardRef<ArtCanvasHandle, ArtCanvasProps>(({ state, onCanvasReady }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (canvas && ctx) {
        ctx.fillStyle = '#ffffff'; // Clear to white for cleaner AI analysis
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    },
    loadImage: (url: string) => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        const img = new Image();
        img.src = url;
        img.onload = () => {
            if (canvas && ctx) {
                // Center and fit
                const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width / 2) - (img.width / 2) * scale;
                const y = (canvas.height / 2) - (img.height / 2) * scale;
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            }
        }
    },
    getCanvas: () => canvasRef.current
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    
    const initializeCanvas = () => {
       const rect = canvas.parentElement?.getBoundingClientRect();
       if (!rect) return;
       
       canvas.width = rect.width * dpr;
       canvas.height = rect.height * dpr;
       
       const ctx = canvas.getContext('2d', { willReadFrequently: true });
       if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          // If it's the first init (no contextRef), fill white. 
          // Otherwise we might be resizing, but we handle that in handleResize logic below usually.
          // However, for simplicity in this demo, we re-fill white only if empty.
          if (!contextRef.current) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, rect.width, rect.height);
          }
          contextRef.current = ctx;
          onCanvasReady(canvas);
       }
    };

    initializeCanvas();

    const handleResize = () => {
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;

        // Snapshot current canvas content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCanvas.getContext('2d')?.drawImage(canvas, 0, 0);

        // Resize
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Restore content
            // We draw the old canvas onto the new one. 
            // If new is smaller, it crops. If bigger, it has empty space.
            // Ideally we might want to scale, but for drawing apps, usually preserving pixel 1:1 is better or scaling content.
            // Let's scale content to fit if the aspect ratio drastically changed, or just center.
            // For this simple implementation: draw back at 0,0 (crop/expand) but fill background white first
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, rect.width, rect.height);
            
            // Draw the temp canvas scaled down by dpr because drawImage takes CSS pixels source? 
            // No, tempCanvas is actual pixels. Context is scaled.
            // We need to reset transform to draw pixel-for-pixel copy, then re-apply scale?
            // Or just drawImage with the tempCanvas.
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to draw raw pixels
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.restore();
            
            // Re-apply current brush settings
            // The effect hook below will re-apply them because state dependency, 
            // but that runs after render. We might need to force it or just rely on next stroke.
        }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update context style when state changes
  useEffect(() => {
    if (!contextRef.current) return;
    contextRef.current.strokeStyle = state.brushType === BrushType.ERASER ? '#ffffff' : state.color;
    contextRef.current.lineWidth = state.brushType === BrushType.MARKER ? 20 : state.brushType === BrushType.PENCIL ? 2 : 5;
    
    if (state.brushType === BrushType.MARKER) {
        contextRef.current.globalAlpha = 0.5;
    } else {
        contextRef.current.globalAlpha = 1.0;
    }
  }, [state]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling on touch
    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsPressed(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isPressed) return;
    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
  };

  const stopDrawing = () => {
    contextRef.current?.closePath();
    setIsPressed(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
      if ('touches' in e) {
          const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
          const touch = e.touches[0];
          return {
              offsetX: touch.clientX - rect.left,
              offsetY: touch.clientY - rect.top
          };
      } else {
          return {
              offsetX: (e as React.MouseEvent).nativeEvent.offsetX,
              offsetY: (e as React.MouseEvent).nativeEvent.offsetY
          };
      }
  };

  return (
    <div className="flex-1 relative bg-zinc-800 overflow-hidden flex items-center justify-center md:p-8 shadow-inner h-full w-full">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="bg-white shadow-2xl cursor-crosshair max-w-full max-h-full object-contain touch-none"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
});

export default ArtCanvas;