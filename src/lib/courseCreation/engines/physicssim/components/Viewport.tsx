import React, { useRef, useEffect, useCallback, useState } from 'react';
import { PhysicsConfig, SimulationStatus, SimulationType } from '../types';
import { rk4StepDoublePendulum, stepLorenz, calculateProjectilePath, traceFieldLine, calculateElasticCollision1D } from '../services/integrators';

interface ViewportProps {
  status: SimulationStatus;
  config: PhysicsConfig;
  speedMultiplier: number;
  onTick?: (t: number) => void;
}

export const Viewport: React.FC<ViewportProps> = ({ status, config, speedMultiplier, onTick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);

  // -- State Management for Simulations --
  const pendulumRef = useRef([Math.PI/2, Math.PI/2, 0, 0]);
  const projectileRef = useRef({x:0, y:0, vx:0, vy:0, grounded: false});
  const projectilePathRef = useRef<Array<{x:number, y:number}>>([]);
  const chaosRef = useRef({x:0.1, y:0, z:0, points: [] as number[][]});
  
  // Mechanics Refs
  const kinematicsRef = useRef({ x: 0, v: 0, history: [] as {t: number, v: number}[] });
  const momentumRef = useRef({ p1: 0, v1: 0, p2: 0, v2: 0 });
  const forceRef = useRef({ x: 0, v: 0, a: 0 });

  // Atomic Ref
  const atomicRef = useRef({ electronAngles: [] as number[] });

  // Viewport State (Camera Pan)
  const panRef = useRef({x: 0, y: 0});
  const isPanning = useRef(false);
  const lastMousePos = useRef({x: 0, y: 0});

  // Interactive Dragging State
  const isDragging = useRef(false);
  const dragTarget = useRef<string | null>(null);
  const dragOffset = useRef({x: 0, y: 0});
  
  // EM Charges positions (mutable for interaction)
  const chargesRef = useRef([{x: -100, y: 0, q: 0}, {x: 100, y: 0, q: 0}]);

  // Camera State for Projectile Auto-Zoom
  const cameraRef = useRef({x: 0, y: 0, zoom: 1});

  const resetSimulation = useCallback(() => {
    timeRef.current = 0;
    previousTimeRef.current = 0;
    cameraRef.current = {x: 0, y: 0, zoom: 1};
    panRef.current = {x: 0, y: 0}; // Reset pan on simulation switch/reset

    if (config.type === 'pendulum') {
      pendulumRef.current = [config.initialTheta1, config.initialTheta2, 0, 0];
    } 
    else if (config.type === 'projectile') {
      const v0 = config.velocity;
      const theta = (config.angle * Math.PI) / 180;
      projectileRef.current = {
        x: 0, y: config.height,
        vx: v0 * Math.cos(theta),
        vy: v0 * Math.sin(theta),
        grounded: false
      };
      projectilePathRef.current = [{x:0, y:config.height}];
    }
    else if (config.type === 'kinematics') {
        kinematicsRef.current = { x: 0, v: config.initialVelocity, history: [] };
    }
    else if (config.type === 'momentum') {
        // Start separated
        momentumRef.current = { p1: -150, v1: config.velocity1, p2: 150, v2: config.velocity2 };
    }
    else if (config.type === 'force') {
        forceRef.current = { x: 0, v: 0, a: 0 };
    }
    else if (config.type === 'chaos') {
      chaosRef.current = {x: 0.1, y: 0, z: 0, points: []};
    }
    else if (config.type === 'electromagnetism') {
      chargesRef.current = [
        {x: -150, y: 0, q: config.charge1},
        {x: 150, y: 0, q: config.charge2}
      ];
    }
    else if (config.type === 'atomic') {
        // Initialize random angles for electrons
        atomicRef.current.electronAngles = Array(config.atomicNumber).fill(0).map(() => Math.random() * Math.PI * 2);
    }
  }, [config]);

  useEffect(() => {
    resetSimulation();
  }, [config, resetSimulation]);

  // --- Physics Steppers ---

  const stepPendulum = (dt: number, cfg: any) => {
    if (isDragging.current) return; // Pause physics while dragging
    const subSteps = 10;
    const stepDt = dt / subSteps;
    for(let i=0; i<subSteps; i++) {
      pendulumRef.current = rk4StepDoublePendulum(
        pendulumRef.current, stepDt, cfg.m1, cfg.m2, cfg.l1, cfg.l2, 9.81, cfg.damping
      );
    }
  };

  const stepProjectile = (dt: number, cfg: any) => {
    const s = projectileRef.current;
    if (s.grounded) return;

    const subSteps = 10; 
    const subDt = dt / subSteps;
    for(let i=0; i<subSteps; i++) {
      s.vy -= cfg.gravity * subDt;
      s.x += s.vx * subDt;
      s.y += s.vy * subDt;
      if (s.y <= 0) {
        s.y = 0;
        if (Math.abs(s.vy) < 2.0) { s.grounded = true; s.vx=0; s.vy=0; }
        else { s.vy = -s.vy * cfg.bounciness; s.vx *= 0.9; }
      }
    }
    const last = projectilePathRef.current[projectilePathRef.current.length-1];
    if (!last || Math.hypot(s.x-last.x, s.y-last.y) > 1.0) {
      projectilePathRef.current.push({x: s.x, y: s.y});
    }
    
    // Auto-Camera Zoom Logic
    let maxX = Math.max(200, s.x);
    let maxY = Math.max(100, s.y);
    const padding = 50;
    const targetZoom = Math.min(
      (canvasRef.current?.width || 1920) / ((maxX + padding) * 10), 
      (canvasRef.current?.height || 1080) / ((maxY + padding) * 10)
    );
    // Smoothly interpolate zoom
    cameraRef.current.zoom = cameraRef.current.zoom * 0.95 + targetZoom * 0.05;
  };

  const stepKinematics = (dt: number, cfg: any) => {
      const k = kinematicsRef.current;
      // v = v0 + at
      k.v = cfg.initialVelocity + cfg.acceleration * timeRef.current;
      k.x += k.v * dt; // Simple Euler integration for display
      
      // Record history for graph
      if (timeRef.current < cfg.totalTime) {
          k.history.push({t: timeRef.current, v: k.v});
      }
  };

  const stepMomentum = (dt: number, cfg: any) => {
      const s = momentumRef.current;
      // Update positions
      s.p1 += s.v1 * dt * 50; // Scale speed for visual
      s.p2 += s.v2 * dt * 50;
      
      // Detect collision (approximate radius 20px)
      const radius = 20;
      if (Math.abs(s.p1 - s.p2) < radius * 2) {
          // Simple check to prevent sticking: only collide if moving towards each other
          const relativeVel = s.v1 - s.v2;
          if ((s.p1 < s.p2 && relativeVel > 0) || (s.p1 > s.p2 && relativeVel < 0)) {
              const {v1, v2} = calculateElasticCollision1D(cfg.mass1, s.v1, cfg.mass2, s.v2, cfg.restitution);
              s.v1 = v1;
              s.v2 = v2;
          }
      }
  };

  const stepForce = (dt: number, cfg: any) => {
      const f = forceRef.current;
      // F_net = F_app - F_fric
      // F_fric = mu * m * g * sign(v) (simplified model)
      // If v=0 and F_app < max static friction, no move. Simplified to kinetic model here.
      
      const weight = cfg.mass * 9.81;
      const frictionForce = cfg.frictionCoeff * weight;
      
      let netForce = cfg.appliedForce;
      
      if (f.v > 0.1) {
          netForce -= frictionForce;
      } else if (f.v < -0.1) {
          netForce += frictionForce;
      } else {
          // Static case simple check
          if (Math.abs(netForce) <= frictionForce) netForce = 0;
          else netForce -= Math.sign(netForce) * frictionForce;
      }
      
      f.a = netForce / cfg.mass;
      f.v += f.a * dt;
      f.x += f.v * dt;
  };

  const stepChaos = (dt: number, cfg: any) => {
    const s = chaosRef.current;
    const subSteps = 10; 
    const subDt = (dt * cfg.speed) / subSteps;
    for (let i=0; i<subSteps; i++) {
       const [nx, ny, nz] = stepLorenz(s.x, s.y, s.z, cfg.sigma, cfg.rho, cfg.beta, subDt);
       s.x = nx; s.y = ny; s.z = nz;
       s.points.push([nx, ny, nz]);
       if (s.points.length > 2000) s.points.shift();
    }
  };

  // --- Renderers ---

  const renderPendulum = (ctx: CanvasRenderingContext2D, w: number, h: number, cfg: any) => {
    const scale = 150;
    // Apply Pan offset
    const cx = w/2 + panRef.current.x;
    const cy = h/3 + panRef.current.y;
    
    const [t1, t2] = pendulumRef.current;
    
    const x1 = cx + cfg.l1 * Math.sin(t1) * scale;
    const y1 = cy + cfg.l1 * Math.cos(t1) * scale;
    const x2 = x1 + cfg.l2 * Math.sin(t2) * scale;
    const y2 = y1 + cfg.l2 * Math.cos(t2) * scale;

    // Draw Arm 1
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x1, y1); ctx.stroke();

    // Draw Arm 2
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    // Joint 1 (Pivot)
    ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2); ctx.fill();

    // Mass 1
    ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(x1, y1, 15, 0, Math.PI*2); ctx.fill();
    // Joint 2 (at Mass 1)
    ctx.fillStyle = '#1e40af'; ctx.beginPath(); ctx.arc(x1, y1, 4, 0, Math.PI*2); ctx.fill();

    // Mass 2
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(x2, y2, 15, 0, Math.PI*2); ctx.fill();

    // Hit areas for dragging
    if (isDragging.current && dragTarget.current === 'm1') {
       ctx.strokeStyle = 'white'; ctx.lineWidth=2; ctx.strokeRect(x1-20, y1-20, 40, 40);
    }
  };

  const renderProjectile = (ctx: CanvasRenderingContext2D, w: number, h: number, cfg: any) => {
    const zoom = cameraRef.current.zoom || 1;
    const scale = 10 * zoom; 
    // Pivot is bottom-left with padding + Pan offset
    const cx = 50 + panRef.current.x;
    const cy = h - 50 + panRef.current.y; 

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, -1); // Flip Y for math coords

    // Ground Line
    ctx.fillStyle = '#334155';
    ctx.fillRect(-1000, -50, 5000, 50); 

    // Distance Markers
    ctx.fillStyle = '#64748b';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.scale(1, -1); // Flip back for text
    for(let d=0; d<=500; d+=50) {
        const sx = d * scale;
        ctx.fillRect(sx - 1, -5, 2, 10);
        if (d > 0) ctx.fillText(`${d}m`, sx, 15);
    }
    ctx.restore();

    // Cannon (Visual)
    ctx.save();
    ctx.translate(0, cfg.height * scale);
    ctx.rotate(cfg.angle * Math.PI / 180);
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, -5, 30, 10); // Barrel
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill(); // Base
    ctx.restore();

    // Prediction Path (Ghost)
    const prediction = calculateProjectilePath(cfg.velocity, cfg.angle, cfg.height, cfg.gravity);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    prediction.forEach((p, i) => {
        if (i===0) ctx.moveTo(p.x * scale, p.y * scale);
        else ctx.lineTo(p.x * scale, p.y * scale);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Actual Trajectory
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3 / scale; 
    ctx.beginPath();
    projectilePathRef.current.forEach((p, i) => {
        if(i===0) ctx.moveTo(p.x * scale, p.y * scale);
        else ctx.lineTo(p.x * scale, p.y * scale);
    });
    ctx.stroke();

    // Ball - CONSTANT SCREEN SIZE
    const {x, y} = projectileRef.current;
    ctx.fillStyle = '#ef4444';
    // Reset transform scale for drawing the ball so it doesn't warp or scale
    ctx.save();
    ctx.translate(x * scale, y * scale);
    ctx.scale(1, -1); // Flip back to screen coords
    ctx.beginPath(); 
    // Fixed radius of 6 pixels regardless of zoom
    ctx.arc(0, 0, 6, 0, Math.PI*2); 
    ctx.fill();
    ctx.restore();

    ctx.restore();
    
    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Height: ${y.toFixed(1)}m`, 20, 40);
    ctx.fillText(`Range:  ${x.toFixed(1)}m`, 20, 60);
    ctx.fillText(`Time:   ${timeRef.current.toFixed(2)}s`, 20, 80);
  };

  const renderKinematics = (ctx: CanvasRenderingContext2D, w: number, h: number, cfg: any) => {
      const cx = 50 + panRef.current.x;
      const cy = h/2 + panRef.current.y;
      
      // Draw Track
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, cy+20); ctx.lineTo(w, cy+20); ctx.stroke();
      
      // Draw Object
      const scaleX = 10; 
      const px = cx + kinematicsRef.current.x * scaleX;
      // Wrap visual if it goes off screen just for looping visual, but graph tracks physics
      const displayX = (px % w + w) % w;
      
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(displayX, cy-10, 40, 30); // Car body
      ctx.fillStyle = '#64748b';
      ctx.beginPath(); ctx.arc(displayX+10, cy+20, 5, 0, Math.PI*2); ctx.fill(); // Wheel
      ctx.beginPath(); ctx.arc(displayX+30, cy+20, 5, 0, Math.PI*2); ctx.fill(); // Wheel
      
      // Velocity-Time Graph Overlay
      const graphW = 300;
      const graphH = 200;
      const pad = 40;
      // Anchor top-right
      const gx = w - graphW - 40;
      const gy = 40;

      // Background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(gx, gy, graphW, graphH);
      ctx.strokeStyle = '#475569'; 
      ctx.strokeRect(gx, gy, graphW, graphH);

      // Determine Ranges
      const tMax = cfg.totalTime;
      // Calculate potential max velocity based on physics for better autoscaling
      const vEnd = cfg.initialVelocity + cfg.acceleration * tMax;
      const vMin = Math.min(cfg.initialVelocity, vEnd, 0);
      const vMax = Math.max(cfg.initialVelocity, vEnd, 0);
      const vRange = (vMax - vMin) || 10;
      
      // Map functions
      const mapT = (t: number) => gx + pad + (t / tMax) * (graphW - pad * 1.5);
      const mapV = (v: number) => gy + graphH - pad - ((v - vMin) / vRange) * (graphH - pad * 2);

      // Axes
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
      ctx.beginPath();
      // Y-axis
      ctx.moveTo(gx + pad, gy + pad); 
      ctx.lineTo(gx + pad, gy + graphH - pad);
      // X-axis (draw at v=0)
      const yZero = Math.max(gy + pad, Math.min(gy + graphH - pad, mapV(0))); // Clamp to view
      ctx.moveTo(gx + pad, yZero); 
      ctx.lineTo(gx + graphW - pad/2, yZero);
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#cbd5e1'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Time (s)', gx + graphW/2, gy + graphH - 10);
      ctx.save();
      ctx.translate(gx + 15, gy + graphH/2);
      ctx.rotate(-Math.PI/2);
      ctx.fillText('Velocity (m/s)', 0, 0);
      ctx.restore();

      // Ticks
      ctx.textAlign = 'right';
      ctx.fillText(vMax.toFixed(1), gx + pad - 5, mapV(vMax) + 3);
      ctx.fillText(vMin.toFixed(1), gx + pad - 5, mapV(vMin) + 3);
      if (vMax > 0 && vMin < 0) ctx.fillText("0", gx + pad - 5, mapV(0) + 3);

      // Plot History
      if (kinematicsRef.current.history.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2;
        kinematicsRef.current.history.forEach((pt, i) => {
            const x = mapT(pt.t);
            const y = mapV(pt.v);
            if (i===0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // Current Value Indicator
      const currentV = kinematicsRef.current.v;
      const cxV = mapT(timeRef.current);
      const cyV = mapV(currentV);
      if (cxV < gx + graphW) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(cxV, cyV, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign='left';
        ctx.fillText(currentV.toFixed(1), cxV + 8, cyV - 8);
      }
  };

  const renderMomentum = (ctx: CanvasRenderingContext2D, w: number, h: number, cfg: any) => {
      const cx = w/2 + panRef.current.x;
      const cy = h/2 + panRef.current.y;
      
      // Track
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, cy+20, w, 10);
      
      // Masses
      const p1 = cx + momentumRef.current.p1;
      const p2 = cx + momentumRef.current.p2;
      
      // Ball 1
      const r1 = 20 + cfg.mass1; // Visual size
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath(); ctx.arc(p1, cy + 20 - r1, r1, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'white'; ctx.textAlign='center'; ctx.font='12px sans-serif';
      ctx.fillText(`${cfg.mass1}kg`, p1, cy+20-r1);
      ctx.fillText(`${momentumRef.current.v1.toFixed(1)} m/s`, p1, cy - r1*2 - 10);

      // Ball 2
      const r2 = 20 + cfg.mass2;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(p2, cy + 20 - r2, r2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'white';
      ctx.fillText(`${cfg.mass2}kg`, p2, cy+20-r2);
      ctx.fillText(`${momentumRef.current.v2.toFixed(1)} m/s`, p2, cy - r2*2 - 10);
  };

  const renderForce = (ctx: CanvasRenderingContext2D, w: number, h: number, cfg: any) => {
      const cx = 100 + panRef.current.x;
      const cy = h/2 + panRef.current.y;
      
      // Ground
      ctx.strokeStyle = '#334155'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(0, cy+30); ctx.lineTo(w, cy+30); ctx.stroke();
      
      // Object
      const pos = cx + forceRef.current.x * 5; // Scale for view
      // Wrap visual
      const displayX = (pos % (w + 200)) - 100;
      
      const boxW = 80; const boxH = 50;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(displayX, cy-boxH, boxW, boxH);
      
      // Info
      ctx.fillStyle = 'white'; ctx.textAlign='center';
      ctx.fillText(`${cfg.mass}kg`, displayX + boxW/2, cy - boxH/2);
      
      // Force Vector
      if (cfg.appliedForce > 0) {
          const arrowLen = Math.min(100, cfg.appliedForce / 20);
          ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(displayX + boxW, cy - boxH/2); ctx.lineTo(displayX + boxW + arrowLen, cy - boxH/2); ctx.stroke();
          // Arrowhead
          ctx.beginPath(); ctx.moveTo(displayX + boxW + arrowLen, cy - boxH/2); ctx.lineTo(displayX + boxW + arrowLen - 10, cy - boxH/2 - 5); ctx.stroke();
          ctx.fillStyle = '#22c55e'; ctx.fillText(`F=${cfg.appliedForce}N`, displayX + boxW + arrowLen/2, cy - boxH/2 - 10);
      }
      
      // Acceleration Vector
      if (forceRef.current.a !== 0) {
          const aLen = forceRef.current.a * 20;
          ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(displayX + boxW/2, cy - boxH - 20); ctx.lineTo(displayX + boxW/2 + aLen, cy - boxH - 20); ctx.stroke();
          ctx.fillStyle = '#ef4444'; ctx.fillText(`a=${forceRef.current.a.toFixed(2)} m/s²`, displayX + boxW/2, cy - boxH - 30);
      }

      // Speedometer
      ctx.fillStyle = '#fff'; ctx.textAlign='left';
      ctx.fillText(`Velocity: ${forceRef.current.v.toFixed(1)} m/s`, 20, 40);
  };

  const renderChaos = (ctx: CanvasRenderingContext2D, w: number, h: number, cfg: any) => {
    const cx = w/2 + panRef.current.x;
    const cy = h/2 + 100 + panRef.current.y;
    const scale = 12;

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    chaosRef.current.points.forEach((p, i) => {
        // Project 3D (x, z) to 2D for butterfly shape
        const px = cx + p[0] * scale;
        const py = cy - p[2] * scale; // Using Z as up
        if (i===0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.stroke();
    
    // Head
    const head = chaosRef.current;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx + head.x * scale, cy - head.z * scale, 4, 0, Math.PI*2); ctx.fill();
  };

  const renderEM = (ctx: CanvasRenderingContext2D, w: number, h: number, cfg: any) => {
    const cx = w/2 + panRef.current.x;
    const cy = h/2 + panRef.current.y;
    const charges = chargesRef.current;

    // Field Lines (Streamlines)
    if (cfg.showVectors) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.lineWidth = 1.5;

        // For each positive charge, emit lines
        charges.filter(c => c.q > 0).forEach(c => {
            const lines = 12; // Lines per charge
            for(let i=0; i<lines; i++) {
                const angle = (i / lines) * Math.PI * 2;
                const startX = cx + c.x + Math.cos(angle) * 10;
                const startY = cy + c.y + Math.sin(angle) * 10;
                
                // Trace line
                const path = traceFieldLine(
                    startX - cx, // relative logic for field calc
                    startY - cy, 
                    charges, 
                    {w: w, h: h} // bounds
                );

                ctx.beginPath();
                path.forEach((p, idx) => {
                    const px = cx + p.x;
                    const py = cy + p.y;
                    if (idx === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                });
                ctx.stroke();
            }
        });

        // If no positive charges, visualize grid direction faintly
        if (!charges.some(c => c.q > 0)) {
           // Fallback to grid for purely negative or neutral setup
           ctx.globalAlpha = 0.2;
           for(let x=0; x<w; x+=50) {
               for(let y=0; y<h; y+=50) {
                   const path = traceFieldLine(x-cx, y-cy, charges, {w:w, h:h}, 10, 10);
                    ctx.beginPath();
                    path.forEach((p, idx) => {
                        if(idx===0) ctx.moveTo(cx+p.x, cy+p.y);
                        else ctx.lineTo(cx+p.x, cy+p.y);
                    });
                    ctx.stroke();
               }
           }
           ctx.globalAlpha = 1.0;
        }
    }

    // Charges
    charges.forEach((c, i) => {
        const px = cx + c.x;
        const py = cy + c.y;
        ctx.fillStyle = c.q > 0 ? '#ef4444' : '#3b82f6';
        ctx.beginPath(); ctx.arc(px, py, 20, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'white'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(c.q > 0 ? '+' : '-', px, py);
        
        // Interactive ring
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.arc(px, py, 25, 0, Math.PI*2); ctx.stroke();
    });
  };

  const renderOptics = (ctx: CanvasRenderingContext2D, w: number, h: number, cfg: any) => {
    const cx = w/2 + panRef.current.x;
    const cy = h/2 + panRef.current.y;
    const scale = 5; // px per cm

    // Draw Optical Bench
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, cy, w, 10);

    // Principal Axis
    ctx.strokeStyle = '#475569'; ctx.setLineDash([5,5]); 
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke(); ctx.setLineDash([]);

    // Lens
    ctx.fillStyle = 'rgba(147, 197, 253, 0.2)';
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 10, 100, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    
    // Focal Points
    const fx = cx + cfg.lensFocalLength * scale;
    const f_x = cx - cfg.lensFocalLength * scale;
    ctx.fillStyle = '#fff'; 
    ctx.beginPath(); ctx.arc(fx, cy, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(f_x, cy, 3, 0, Math.PI*2); ctx.fill();
    ctx.font = '10px sans-serif'; ctx.fillText('F', fx-3, cy+15); ctx.fillText("F'", f_x-3, cy+15);

    // Helper to draw candle
    const drawCandle = (x: number, y: number, height: number, opacity: number = 1) => {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(x, y);
        // Wax
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-5, -height, 10, height);
        // Wick
        ctx.strokeStyle = '#78350f';
        ctx.beginPath(); ctx.moveTo(0, -height); ctx.lineTo(0, -height-5); ctx.stroke();
        // Flame
        ctx.fillStyle = '#f97316';
        ctx.beginPath(); 
        ctx.ellipse(0, -height-10, 3, 6, 0, 0, Math.PI*2); 
        ctx.fill();
        ctx.restore();
    };

    // Object (Candle)
    const ox = cx - cfg.objectDistance * scale;
    const oh = Math.abs(cfg.objectHeight) * scale;
    drawCandle(ox, cy, oh);

    // Ray Tracing Logic
    // Ray 1: Parallel to axis, then through F
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; // Red
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, cy - oh);
    ctx.lineTo(cx, cy - oh);
    ctx.lineTo(w, cy - oh + (w-cx) * (oh / (fx-cx))); // Slope calculation
    ctx.stroke();

    // Ray 2: Through Center (undeflected)
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'; // Green
    ctx.beginPath();
    ctx.moveTo(ox, cy - oh);
    ctx.lineTo(w, cy - oh + (w-ox) * (oh / (cx-ox)));
    ctx.stroke();

    // Image Calculation
    const do_ = cfg.objectDistance;
    const f = cfg.lensFocalLength;
    if (do_ !== f) {
        const di = 1 / (1/f - 1/do_);
        const m = -di / do_;
        const ih = m * oh; // Visual height (can be negative)
        const ix = cx + di * scale;
        
        // Draw Ghost Candle (Image)
        if (ix > -1000 && ix < w + 1000) {
            ctx.save();
            ctx.translate(ix, cy);
            // If m is negative, image is inverted. We scale Y by sign of m.
            ctx.scale(1, Math.sign(m)); 
            // Visual height is absolute because we used scale
            drawCandle(0, 0, Math.abs(ih), 0.5);
            ctx.restore();
            
            // Label
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillText(m < 0 ? 'Real, Inverted' : 'Virtual, Upright', ix, cy + (m<0 ? Math.abs(ih)+20 : -Math.abs(ih)-20));
        }
    }
  };

  const renderWaves = (ctx: CanvasRenderingContext2D, w: number, h: number, cfg: any) => {
     const cy = h/2 + panRef.current.y;
     const panX = panRef.current.x;

     ctx.strokeStyle = '#06b6d4';
     ctx.lineWidth = 2;
     ctx.beginPath();
     // Optimize: only draw visible width
     for(let x=0; x<w; x++) {
         const t = timeRef.current;
         // Logic x is shifted by panX
         const logicalX = x - panX;
         // Superposition
         const y = cfg.amplitude * Math.sin(cfg.frequency1 * logicalX * 0.05 - t) + 
                   cfg.amplitude * Math.sin(cfg.frequency2 * logicalX * 0.05 - t + cfg.phaseShift);
         const py = cy + y * 5; // Scale up
         if (x===0) ctx.moveTo(x, py);
         else ctx.lineTo(x, py);
     }
     ctx.stroke();
     
     // Labels
     ctx.fillStyle = 'white';
     ctx.fillText(`Interference Pattern`, 20, 40);
  };

  const renderQuantum = (ctx: CanvasRenderingContext2D, w: number, h: number, cfg: any) => {
      const cy = h/2 + panRef.current.y;
      const cx = w/2 + panRef.current.x;

      ctx.beginPath();
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2;
      const scale = 100; 
      // Gaussian Wave Packet
      for (let x = -10; x < 10; x += 0.1) {
          const px = cx + x * 50;
          const val = Math.exp(-(x*x)/(2*cfg.packetWidth)) * Math.cos(cfg.momentum * x - timeRef.current * 5);
          const py = cy - val * scale;
          if (x===-10) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      
      // Envelope
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      for (let x = -10; x < 10; x += 0.1) {
          const px = cx + x * 50;
          const val = Math.exp(-(x*x)/(2*cfg.packetWidth));
          const py = cy - val * scale;
          if (x===-10) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
  };

  const renderAtomic = (ctx: CanvasRenderingContext2D, w: number, h: number, cfg: any) => {
    const cx = w/2 + panRef.current.x;
    const cy = h/2 + panRef.current.y;
    
    // Nucleus
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(cx, cy, 10 + cfg.atomicNumber, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'white'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='10px sans-serif';
    ctx.fillText(`${cfg.atomicNumber}p`, cx, cy);

    // Electrons (Bohr Model rings)
    const maxShells = Math.ceil(cfg.atomicNumber / 2); // Simple shell approximation
    const electrons = atomicRef.current.electronAngles;
    
    for (let i = 0; i < electrons.length; i++) {
        const shell = Math.floor(i / 8) + 1; // 8 per shell simplified
        const radius = 40 * shell;
        const speed = 2 / shell;
        
        // Draw Orbit
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI*2); ctx.stroke();
        
        // Update angle
        if (status === SimulationStatus.RUNNING) {
            electrons[i] += speed * 0.02; // Animate
        }
        
        // Draw Electron
        const ex = cx + Math.cos(electrons[i]) * radius;
        const ey = cy + Math.sin(electrons[i]) * radius;
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI*2); ctx.fill();
    }
  };

  const renderPressure = (ctx: CanvasRenderingContext2D, width: number, height: number, cfg: any) => {
    const cx = width / 2 + panRef.current.x;
    const cy = height / 2 + 100 + panRef.current.y;
    const scale = 40; // pixels per meter

    // Container Dimensions
    const w = 300;
    const h = 400;
    const topY = cy - h;

    // Atmosphere
    const gradientSky = ctx.createLinearGradient(0, 0, 0, topY);
    gradientSky.addColorStop(0, '#0f172a');
    gradientSky.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradientSky;
    ctx.fillRect(0, 0, width, topY);

    // Water Gradient (Pressure Visual)
    const gradientWater = ctx.createLinearGradient(0, topY, 0, cy);
    gradientWater.addColorStop(0, 'rgba(6, 182, 212, 0.4)'); // Light Cyan
    gradientWater.addColorStop(1, 'rgba(22, 78, 99, 0.9)'); // Deep Blue
    ctx.fillStyle = gradientWater;
    ctx.fillRect(cx - w/2, topY, w, h);

    // Surface Line
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - w/2 - 20, topY); ctx.lineTo(cx + w/2 + 20, topY); ctx.stroke();
    ctx.fillStyle = '#22d3ee'; ctx.font='12px sans-serif'; ctx.fillText("Surface", cx - w/2 - 60, topY + 4);

    // Glass Container Walls
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx - w/2, topY - 20);
    ctx.lineTo(cx - w/2, cy);
    ctx.lineTo(cx + w/2, cy);
    ctx.lineTo(cx + w/2, topY - 20);
    ctx.stroke();

    // Sensor / Gauge
    const sensorY = topY + cfg.depth * scale;
    
    if (sensorY < cy && sensorY > topY) {
        // Pressure Calculation P = rho * g * h
        const pressure = (cfg.fluidDensity * cfg.gravity * cfg.depth) / 1000; // kPa
        
        // Draw Gauge Tool
        const gaugeX = cx + w/2 + 60;
        const gaugeR = 40;

        // Connecting Line
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.setLineDash([2,2]);
        ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(cx, sensorY); ctx.lineTo(gaugeX, sensorY); ctx.stroke(); ctx.setLineDash([]);

        // Sensor Head
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(cx, sensorY, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.arc(cx, sensorY, 15, 0, Math.PI*2); ctx.fill();

        // Gauge Body
        ctx.save();
        ctx.translate(gaugeX, sensorY);
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, gaugeR, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        
        // Ticks
        ctx.strokeStyle = '#475569'; ctx.lineWidth=2;
        for(let i=0; i<=180; i+=30) {
            ctx.save();
            ctx.rotate((i+180) * Math.PI/180);
            ctx.beginPath(); ctx.moveTo(gaugeR-5, 0); ctx.lineTo(gaugeR-10, 0); ctx.stroke();
            ctx.restore();
        }

        // Needle (0 to 100 kPa approx range mapping for visual)
        const angle = Math.min(180, (pressure / 100) * 180); 
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth=3;
        ctx.save();
        ctx.rotate((angle + 180) * Math.PI/180);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(gaugeR-8, 0); ctx.stroke();
        ctx.restore();

        // Text value
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`${pressure.toFixed(1)}`, 0, 10);
        ctx.font = '10px monospace';
        ctx.fillText(`kPa`, 0, 22);

        ctx.restore();
    }
  };

  const renderLever = (ctx: CanvasRenderingContext2D, width: number, height: number, cfg: any) => {
    const cx = width / 2 + panRef.current.x;
    const cy = height / 2 + 50 + panRef.current.y;
    const scale = 60; // pixels per meter

    // Ground
    ctx.strokeStyle = '#334155'; ctx.beginPath(); ctx.moveTo(cx - 1000, cy + 20); ctx.lineTo(cx + 1000, cy + 20); ctx.stroke();

    // Fulcrum (Triangle)
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - 20, cy + 20);
    ctx.lineTo(cx + 20, cy + 20);
    ctx.fill();

    // Calculate Physics (Torque)
    const torqueL = cfg.loadMass * 9.81 * cfg.loadDist;
    const torqueR = cfg.effortForce * cfg.effortDist;
    const netTorque = torqueR - torqueL;
    
    // Rotation angle (visual only, clamped)
    let angle = 0;
    if (Math.abs(netTorque) > 1) {
        angle = netTorque > 0 ? 15 : -15; // Tilted
    }
    const rad = (angle * Math.PI) / 180;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rad);

    // Beam
    ctx.fillStyle = '#475569';
    const beamLen = 350;
    ctx.fillRect(-beamLen, -5, beamLen * 2, 10);

    // Load (Left)
    const lx = -cfg.loadDist * scale;
    const boxSize = 20 + cfg.loadMass; 
    ctx.fillStyle = '#f43f5e'; // Rose
    ctx.fillRect(lx - boxSize/2, -5 - boxSize, boxSize, boxSize);
    ctx.fillStyle = 'white'; ctx.font = '10px monospace'; ctx.textAlign='center';
    ctx.fillText(`${cfg.loadMass}kg`, lx, -10 - boxSize);

    // Effort (Right)
    const ex = cfg.effortDist * scale;
    ctx.fillStyle = '#22c55e'; // Green arrow
    ctx.beginPath();
    ctx.moveTo(ex, -5);
    ctx.lineTo(ex - 10, -25);
    ctx.lineTo(ex + 10, -25);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`${cfg.effortForce}N`, ex, -30);

    ctx.restore();

    // HUD (Fixed Position)
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#f43f5e';
    ctx.fillText(`Torque (Load): ${torqueL.toFixed(1)} Nm`, 20, 40);
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`Torque (Effort): ${torqueR.toFixed(1)} Nm`, 20, 60);
    
    ctx.fillStyle = Math.abs(netTorque) < 1 ? '#22d3ee' : '#f59e0b';
    const statusText = Math.abs(netTorque) < 1 ? "BALANCED" : (netTorque > 0 ? "ROTATING RIGHT (CW)" : "ROTATING LEFT (CCW)");
    ctx.fillText(`Status: ${statusText}`, 20, 90);
  };

  // --- Event Handlers ---

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      // Hit Test logic based on Config
      let hit = false;

      if (config.type === 'electromagnetism') {
          const cx = rect.width/2 + panRef.current.x;
          const cy = rect.height/2 + panRef.current.y;
          // Check charges
          chargesRef.current.forEach((c, i) => {
              const px = cx + c.x;
              const py = cy + c.y;
              if (Math.hypot(x-px, y-py) < 30) {
                  dragTarget.current = `charge-${i}`;
                  dragOffset.current = {x: px - x, y: py - y};
                  isDragging.current = true;
                  hit = true;
              }
          });
      }
      
      // If no specific object was hit, initiate Pan
      if (!hit) {
          isPanning.current = true;
          lastMousePos.current = {x: clientX, y: clientY};
      }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      // Handle Panning
      if (isPanning.current) {
          const dx = clientX - lastMousePos.current.x;
          const dy = clientY - lastMousePos.current.y;
          panRef.current.x += dx;
          panRef.current.y += dy;
          lastMousePos.current = {x: clientX, y: clientY};
          return;
      }

      // Handle Object Dragging
      if (!isDragging.current || !dragTarget.current) return;
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (config.type === 'electromagnetism' && dragTarget.current.startsWith('charge-')) {
          const idx = parseInt(dragTarget.current.split('-')[1]);
          const cx = rect.width/2 + panRef.current.x;
          const cy = rect.height/2 + panRef.current.y;
          // Update physics position (relative to center)
          chargesRef.current[idx].x = (x + dragOffset.current.x) - cx;
          chargesRef.current[idx].y = (y + dragOffset.current.y) - cy;
      }
  };

  const handleMouseUp = () => {
      isDragging.current = false;
      isPanning.current = false;
      dragTarget.current = null;
  };

  // --- Animation ---

  const animate = (time: number) => {
    if (previousTimeRef.current === 0) previousTimeRef.current = time;
    const dt = Math.min(0.1, (time - previousTimeRef.current) / 1000) * speedMultiplier;
    previousTimeRef.current = time;

    if (status === SimulationStatus.RUNNING) {
       if (config.type === 'pendulum') stepPendulum(dt, config);
       else if (config.type === 'projectile') stepProjectile(dt, config);
       else if (config.type === 'kinematics') stepKinematics(dt, config);
       else if (config.type === 'momentum') stepMomentum(dt, config);
       else if (config.type === 'force') stepForce(dt, config);
       else if (config.type === 'chaos') stepChaos(dt, config);
       
       // Update time for everyone
       timeRef.current += dt;
    }

    if (onTick) onTick(timeRef.current);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (config.type === 'pendulum') renderPendulum(ctx, canvas.width, canvas.height, config);
        else if (config.type === 'projectile') renderProjectile(ctx, canvas.width, canvas.height, config);
        else if (config.type === 'kinematics') renderKinematics(ctx, canvas.width, canvas.height, config);
        else if (config.type === 'momentum') renderMomentum(ctx, canvas.width, canvas.height, config);
        else if (config.type === 'force') renderForce(ctx, canvas.width, canvas.height, config);
        else if (config.type === 'chaos') renderChaos(ctx, canvas.width, canvas.height, config);
        else if (config.type === 'electromagnetism') renderEM(ctx, canvas.width, canvas.height, config);
        else if (config.type === 'optics') renderOptics(ctx, canvas.width, canvas.height, config);
        else if (config.type === 'waves') renderWaves(ctx, canvas.width, canvas.height, config);
        else if (config.type === 'quantum') renderQuantum(ctx, canvas.width, canvas.height, config);
        else if (config.type === 'atomic') renderAtomic(ctx, canvas.width, canvas.height, config);
        else if (config.type === 'pressure') renderPressure(ctx, canvas.width, canvas.height, config);
        else if (config.type === 'lever') renderLever(ctx, canvas.width, canvas.height, config);
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [status, config, speedMultiplier]);

  // Resize Listener with ResizeObserver for Sidebar collapse handling
  useEffect(() => {
      if (!containerRef.current) return;
      const resizeObserver = new ResizeObserver(() => {
          if (containerRef.current && canvasRef.current) {
              canvasRef.current.width = containerRef.current.clientWidth;
              canvasRef.current.height = containerRef.current.clientHeight;
          }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`flex-1 relative bg-slate-950 overflow-hidden touch-none ${isPanning.current ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full block" />
    </div>
  );
};