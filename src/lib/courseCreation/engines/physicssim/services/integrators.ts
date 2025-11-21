
/**
 * Numerical Integration and Physics Helpers
 */

export interface StateVector {
  [key: string]: number;
}

// --- Double Pendulum (RK4) ---
export const rk4StepDoublePendulum = (
  state: number[],
  dt: number,
  m1: number,
  m2: number,
  l1: number,
  l2: number,
  g: number,
  damping: number
): number[] => {
  
  const derivatives = (st: number[]): number[] => {
    const t1 = st[0];
    const t2 = st[1];
    const w1 = st[2];
    const w2 = st[3];

    const delta = t1 - t2;
    const den1 = (m1 + m2) * l1 - m2 * l1 * Math.cos(delta) * Math.cos(delta);
    const den2 = (l2 / l1) * den1;

    const dTheta1 = w1;
    const dTheta2 = w2;

    const num1 = m2 * l1 * w1 * w1 * Math.sin(delta) * Math.cos(delta)
               + m2 * g * Math.sin(t2) * Math.cos(delta)
               + m2 * l2 * w2 * w2 * Math.sin(delta)
               - (m1 + m2) * g * Math.sin(t1);
    
    const dOmega1 = (num1 / den1) - (damping * w1); 

    const num2 = -m2 * l2 * w2 * w2 * Math.sin(delta) * Math.cos(delta)
               + (m1 + m2) * (g * Math.sin(t1) * Math.cos(delta) 
               - l1 * w1 * w1 * Math.sin(delta) 
               - g * Math.sin(t2));

    const dOmega2 = (num2 / den2) - (damping * w2);

    return [dTheta1, dTheta2, dOmega1, dOmega2];
  };

  const k1 = derivatives(state);
  const k2 = derivatives(state.map((v, i) => v + k1[i] * dt * 0.5));
  const k3 = derivatives(state.map((v, i) => v + k2[i] * dt * 0.5));
  const k4 = derivatives(state.map((v, i) => v + k3[i] * dt));

  return state.map((v, i) => v + (dt / 6.0) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
};

// --- Lorenz Attractor (Euler for simplicity in visualization, or RK4) ---
export const stepLorenz = (x: number, y: number, z: number, s: number, r: number, b: number, dt: number) => {
    const dx = s * (y - x);
    const dy = x * (r - z) - y;
    const dz = x * y - b * z;
    return [x + dx * dt, y + dy * dt, z + dz * dt];
};

// --- Electric Field Calculation ---
export const calculateEField = (px: number, py: number, charges: Array<{x: number, y: number, q: number}>) => {
    let ex = 0, ey = 0;
    const k = 9e9; // Coulomb constant scaled
    charges.forEach(c => {
        const dx = px - c.x;
        const dy = py - c.y;
        const r2 = dx*dx + dy*dy;
        const r = Math.sqrt(r2);
        if (r < 5) return; // singularity guard
        const E = (k * c.q) / r2; // simplified magnitude
        ex += E * (dx/r);
        ey += E * (dy/r);
    });
    return {ex, ey};
};

// --- Trace Field Line (Streamlines) ---
export const traceFieldLine = (
  startX: number, 
  startY: number, 
  charges: Array<{x: number, y: number, q: number}>,
  bounds: {w: number, h: number},
  stepSize: number = 5,
  maxSteps: number = 500
) => {
  const path = [{x: startX, y: startY}];
  let cx = startX;
  let cy = startY;

  for(let i=0; i<maxSteps; i++) {
    const {ex, ey} = calculateEField(cx, cy, charges);
    const mag = Math.hypot(ex, ey);
    if (mag === 0) break;

    // Normalize and step
    const dx = (ex / mag) * stepSize;
    const dy = (ey / mag) * stepSize;

    cx += dx;
    cy += dy;

    // Check if we hit a negative charge (sink)
    let absorbed = false;
    for(const c of charges) {
      if (c.q < 0 && Math.hypot(cx - c.x, cy - c.y) < 10) {
        absorbed = true;
        path.push({x: c.x, y: c.y}); // Snap to center
        break;
      }
    }
    if (absorbed) break;

    // Check bounds (roughly, center is 0,0 in sim coords)
    // Assuming passed coordinates are relative to center or canvas depending on usage.
    // Here we assume relative to center for simplicity as used in calculateEField
    if (Math.abs(cx) > bounds.w || Math.abs(cy) > bounds.h) break;

    path.push({x: cx, y: cy});
  }
  return path;
};


// --- Wave Superposition ---
export const waveHeight = (x: number, t: number, freq1: number, freq2: number, amp: number, phase: number) => {
    // Superposition of two sine waves
    return amp * Math.sin(freq1 * x - t) + amp * Math.sin(freq2 * x - t + phase);
};

// --- Projectile Path Prediction ---
export const calculateProjectilePath = (v0: number, angleDeg: number, h0: number, g: number, steps: number = 50) => {
    const theta = (angleDeg * Math.PI) / 180;
    const vx = v0 * Math.cos(theta);
    const vy = v0 * Math.sin(theta);
    const path = [];
    
    // Calculate total flight time approximation to determine sampling range
    // y = h0 + vy*t - 0.5*g*t^2 = 0
    const disc = vy*vy + 2*g*h0;
    const totalTime = (vy + Math.sqrt(disc)) / g;
    
    // Sample points along the theoretical path
    for(let i=0; i<=steps; i++) {
        const t = (totalTime * 1.1 / steps) * i; // Go slightly past ground
        const x = vx * t;
        const y = h0 + vy * t - 0.5 * g * t * t;
        if (y < 0 && i > 0) {
            // Exact ground intersection
            const t_ground = (vy + Math.sqrt(disc)) / g;
            path.push({x: vx * t_ground, y: 0});
            break;
        }
        path.push({x, y});
    }
    return path;
};

// --- 1D Elastic Collision ---
export const calculateElasticCollision1D = (m1: number, v1: number, m2: number, v2: number, e: number = 1.0) => {
    // e is coefficient of restitution
    const v1f = ((m1 - e*m2)*v1 + (1 + e)*m2*v2) / (m1 + m2);
    const v2f = ((m2 - e*m1)*v2 + (1 + e)*m1*v1) / (m1 + m2);
    return {v1: v1f, v2: v2f};
};
