
import React, { useRef, useEffect, useState } from 'react';
import { SAMPLE_MOLECULES, ELEMENT_COLORS, ELEMENT_RADII } from '../../constants';
import { Molecule } from '../../types';
import { Info } from 'lucide-react';

interface MoleculeViewerProps {
  setContext: (data: any) => void;
  targetMoleculeId?: string | null;
}

export const MoleculeViewer: React.FC<MoleculeViewerProps> = ({ setContext, targetMoleculeId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeMolecule, setActiveMolecule] = useState<Molecule>(SAMPLE_MOLECULES[0]);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (targetMoleculeId) {
      const found = SAMPLE_MOLECULES.find(m => m.id === targetMoleculeId);
      if (found) {
        setActiveMolecule(found);
      }
    }
  }, [targetMoleculeId]);

  useEffect(() => {
    setContext({
      module: 'Molecular Viewer',
      molecule: activeMolecule
    });
  }, [activeMolecule, setContext]);

  // Animation loop
  useEffect(() => {
    let animationId: number;
    
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Center
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const scale = 2.5;

      // Sort atoms by Z (simplified pseudo-3D for demo)
      // We will just rotate around Y axis
      const angle = rotation * Math.PI / 180;
      
      // Project atoms
      const projectedAtoms = activeMolecule.atoms.map((atom, idx) => {
        // Rotate around Y
        const x = atom.x * Math.cos(angle) - atom.z * Math.sin(angle);
        const z = atom.z * Math.cos(angle) + atom.x * Math.sin(angle);
        const y = atom.y;

        return { ...atom, rx: x, ry: y, rz: z, originalIndex: idx };
      });

      // Sort for painter's algorithm (draw far atoms first)
      projectedAtoms.sort((a, b) => a.rz - b.rz);

      // Draw Bonds (iterate original bonds, find projected points)
      ctx.lineWidth = 4;
      activeMolecule.bonds.forEach(bond => {
         const source = projectedAtoms.find(p => p.originalIndex === bond.source);
         const target = projectedAtoms.find(p => p.originalIndex === bond.target);

         if (source && target) {
           // Gradient bond
           const grad = ctx.createLinearGradient(cx + source.rx * scale, cy + source.ry * scale, cx + target.rx * scale, cy + target.ry * scale);
           grad.addColorStop(0, ELEMENT_COLORS[source.element] || '#fff');
           grad.addColorStop(1, ELEMENT_COLORS[target.element] || '#fff');
           
           ctx.strokeStyle = grad;
           ctx.beginPath();
           ctx.moveTo(cx + source.rx * scale, cy + source.ry * scale);
           ctx.lineTo(cx + target.rx * scale, cy + target.ry * scale);
           ctx.stroke();
         }
      });

      // Draw Atoms
      projectedAtoms.forEach(atom => {
        const radius = (ELEMENT_RADII[atom.element] || 10) * (1 + atom.rz / 200); // Perspective scaling
        const screenX = cx + atom.rx * scale;
        const screenY = cy + atom.ry * scale;
        
        ctx.fillStyle = ELEMENT_COLORS[atom.element] || '#ccc';
        
        // Shadow
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(screenX - radius*0.3, screenY - radius*0.3, radius*0.3, 0, Math.PI * 2);
        ctx.fill();

        // Symbol
        ctx.fillStyle = '#000';
        ctx.font = `bold ${Math.max(8, radius)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(atom.element, screenX, screenY);
      });

      // Auto rotate
      setRotation(prev => (prev + 0.5) % 360);
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [activeMolecule, rotation]);

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">{activeMolecule.name}</h2>
          <p className="text-slate-400 font-mono text-sm">{activeMolecule.formula}</p>
        </div>
        
        <div className="flex gap-2 overflow-x-auto">
          {SAMPLE_MOLECULES.map(m => (
            <button
              key={m.id}
              onClick={() => setActiveMolecule(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all whitespace-nowrap ${activeMolecule.id === m.id ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'}`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative bg-black/20 rounded-3xl border border-slate-800 overflow-hidden flex items-center justify-center">
         <canvas 
           ref={canvasRef} 
           width={800} 
           height={600} 
           className="w-full h-full object-contain"
         />
         <div className="absolute bottom-6 left-6 max-w-md bg-slate-900/90 border border-slate-700 p-4 rounded-xl backdrop-blur-md">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
              <p className="text-slate-300 text-sm leading-relaxed">{activeMolecule.description}</p>
            </div>
         </div>
      </div>
    </div>
  );
};
