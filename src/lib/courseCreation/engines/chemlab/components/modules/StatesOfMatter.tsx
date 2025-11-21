import React, { useRef, useEffect, useState } from 'react';
import { ThermometerSun, Gauge, Move } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export const StatesOfMatterModule: React.FC<{ setContext: (data: any) => void }> = ({ setContext }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Simulation Parameters
  const [temp, setTemp] = useState(50); // 0-100 (Controls Speed/Jitter)
  const [pressure, setPressure] = useState(30); // 0-100 (Controls Volume/Height)
  const [particles, setParticles] = useState<Particle[]>([]);

  // Physical Constants
  const GRAVITY = 0.1;
  const FRICTION_AIR = 0.995;
  const PARTICLE_COUNT = 100;
  
  // Derived State for UI
  const getPhase = () => {
    if (temp < 30) return 'Solid';
    if (temp < 70) return 'Liquid';
    return 'Gas';
  };

  useEffect(() => {
    setContext({
      module: 'States of Matter',
      temperature: temp,
      pressure: pressure,
      phase: getPhase(),
      description: `Matter is in ${getPhase()} state.`
    });
  }, [temp, pressure, setContext]);

  // Initialize Particles
  useEffect(() => {
    const newParticles: Particle[] = [];
    const colors = ['#60a5fa', '#3b82f6', '#2563eb', '#93c5fd'];
    
    for(let i=0; i<PARTICLE_COUNT; i++) {
      newParticles.push({
        x: Math.random() * 600,
        y: Math.random() * 400,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 4 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    setParticles(newParticles);
  }, []);

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    
    // Container dimensions based on pressure (Pressure compresses height)
    // Higher pressure = smaller height
    const containerHeight = Math.max(100, canvas.height - (pressure * 3)); 
    const floorY = canvas.height;
    const ceilingY = canvas.height - containerHeight;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Container
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, ceilingY, canvas.width, containerHeight);
      
      // Draw Piston
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, ceilingY - 20, canvas.width, 20);
      ctx.fillStyle = '#94a3b8'; // Handle
      ctx.fillRect(canvas.width / 2 - 10, ceilingY - 60, 20, 40);

      // Physics Update
      const speedMultiplier = (temp / 50); // 0 to 2x speed
      const jitter = (100 - temp) / 100; // High at low temp

      particles.forEach(p => {
        // Apply Temperature effects
        if (getPhase() === 'Solid') {
           // In solid, particles try to return to a grid or stick together, 
           // here simulated by high friction and random jitter
           p.x += (Math.random() - 0.5) * speedMultiplier;
           p.y += (Math.random() - 0.5) * speedMultiplier;
           
           // Strong Gravity/Attraction to bottom
           p.vy += GRAVITY * 2; 
        } else if (getPhase() === 'Liquid') {
           p.x += p.vx * speedMultiplier;
           p.y += p.vy * speedMultiplier;
           p.vy += GRAVITY * 0.5; // Weak gravity
        } else {
           // Gas
           p.x += p.vx * speedMultiplier * 2;
           p.y += p.vy * speedMultiplier * 2;
           p.vy += GRAVITY * 0.05; // Negligible gravity
        }

        // Bounds Checking (Collision with walls)
        if (p.x < p.radius) { p.x = p.radius; p.vx *= -0.8; }
        if (p.x > canvas.width - p.radius) { p.x = canvas.width - p.radius; p.vx *= -0.8; }
        
        // Floor
        if (p.y > floorY - p.radius) {
           p.y = floorY - p.radius;
           p.vy *= -0.6; // Damping
           if (getPhase() === 'Solid') p.vx *= 0.5; // High friction on floor for solid
        }

        // Ceiling (Piston)
        if (p.y < ceilingY + p.radius) {
           p.y = ceilingY + p.radius;
           p.vy *= -0.8;
           // Gas exerts pressure, we visualize by bouncing hard
        }

        // Draw Particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        
        // Glow for Gas
        if (getPhase() === 'Gas') {
           ctx.shadowBlur = 10;
           ctx.shadowColor = p.color;
        } else {
           ctx.shadowBlur = 0;
        }
      });

      animationId = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(animationId);
  }, [particles, temp, pressure]);

  return (
    <div className="h-full flex flex-col lg:flex-row p-6 gap-6 overflow-hidden">
      {/* Canvas Container */}
      <div className="flex-1 bg-slate-900/50 rounded-3xl border border-slate-800 relative overflow-hidden shadow-inner" ref={containerRef}>
         <canvas 
           ref={canvasRef}
           width={800}
           height={600}
           className="w-full h-full object-cover"
         />
         <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur p-4 rounded-xl border border-slate-700">
            <div className="text-sm text-slate-400 uppercase tracking-wider mb-1">Current State</div>
            <div className={`text-3xl font-bold ${
              getPhase() === 'Gas' ? 'text-red-400' : 
              getPhase() === 'Liquid' ? 'text-blue-400' : 'text-slate-200'
            }`}>
              {getPhase()}
            </div>
         </div>
      </div>

      {/* Controls */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
                 <ThermometerSun className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="font-bold text-white">Temperature</h3>
                 <p className="text-xs text-slate-400">Heat Energy</p>
               </div>
            </div>
            <input 
              type="range" min="0" max="100" value={temp}
              onChange={(e) => setTemp(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500 mb-4"
            />
            <div className="flex justify-between text-xs font-mono text-slate-400">
               <span>Freezing</span>
               <span>Boiling</span>
            </div>
         </div>

         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                 <Gauge className="w-6 h-6" />
               </div>
               <div>
                 <h3 className="font-bold text-white">Pressure</h3>
                 <p className="text-xs text-slate-400">Compression</p>
               </div>
            </div>
            <input 
              type="range" min="0" max="60" value={pressure}
              onChange={(e) => setPressure(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-4"
            />
            <div className="flex justify-between text-xs font-mono text-slate-400">
               <span>Low</span>
               <span>High</span>
            </div>
         </div>

         <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex-1">
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <Move className="w-4 h-4" /> Kinetic Theory
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
               {getPhase() === 'Solid' && "Particles vibrate in fixed positions. Strong intermolecular forces hold them together in a lattice."}
               {getPhase() === 'Liquid' && "Particles have more energy and can slide past one another. They take the shape of the container but maintain volume."}
               {getPhase() === 'Gas' && "Particles move rapidly in random directions. They overcome attractive forces and fill the entire container volume."}
            </p>
         </div>
      </div>
    </div>
  );
};