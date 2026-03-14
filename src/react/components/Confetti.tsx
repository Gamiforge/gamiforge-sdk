import { useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// Lightweight canvas-based confetti burst — one-shot, auto-disposes.
// No external dependencies. Renders to a fixed-position overlay canvas.
// ---------------------------------------------------------------------------

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  opacity: number;
  decay: number;
  shape: 'rect' | 'circle' | 'star';
}

const COLORS_IMPORTANT = [
  '#FDCB6E', '#E17055', '#6C5CE7', '#00B894', '#0984E3', '#FD79A8',
];

const COLORS_LEGENDARY = [
  '#FFD700', '#FF6B6B', '#C56CF0', '#7BED9F', '#70A1FF', '#FF4757',
  '#FFA502', '#2ED573', '#1E90FF', '#FF6348',
];

function createParticles(
  count: number,
  originX: number,
  originY: number,
  colors: string[]
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const speed = 4 + Math.random() * 8;
    const shapes: Particle['shape'][] = ['rect', 'circle', 'star'];
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3, // bias upward
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      gravity: 0.12 + Math.random() * 0.06,
      opacity: 1,
      decay: 0.012 + Math.random() * 0.008,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    });
  }
  return particles;
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(
      cx + Math.cos(rot) * outerRadius,
      cy + Math.sin(rot) * outerRadius
    );
    rot += step;
    ctx.lineTo(
      cx + Math.cos(rot) * innerRadius,
      cy + Math.sin(rot) * innerRadius
    );
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ConfettiBurstProps {
  /** Trigger key — change to fire a new burst */
  triggerKey: string | number;
  /** Importance level determines particle count & palette */
  level: 'important' | 'legendary';
  /** Origin X in viewport pixels (default: center) */
  originX?: number;
  /** Origin Y in viewport pixels (default: 40% from top) */
  originY?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConfettiBurst({
  triggerKey,
  level,
  originX,
  originY,
}: ConfettiBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const prevTrigger = useRef<string | number>('');

  useEffect(() => {
    if (triggerKey === '' || triggerKey === prevTrigger.current) return;
    prevTrigger.current = triggerKey;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ox = originX ?? canvas.width / 2;
    const oy = originY ?? canvas.height * 0.4;

    const count = level === 'legendary' ? 100 : 55;
    const colors = level === 'legendary' ? COLORS_LEGENDARY : COLORS_IMPORTANT;
    const particles = createParticles(count, ox, oy, colors);

    // Cancel previous animation if overlapping
    if (animRef.current) cancelAnimationFrame(animRef.current);

    let alive = true;

    function tick() {
      if (!alive || !ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let anyVisible = false;

      for (const p of particles) {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        if (p.opacity <= 0) continue;
        anyVisible = true;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, 0, 0, p.size / 2);
        }

        ctx.restore();
      }

      if (anyVisible) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        // Final cleanup
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    animRef.current = requestAnimationFrame(tick);

    return () => {
      alive = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [triggerKey, level, originX, originY]);

  return (
    <canvas
      ref={canvasRef}
      className="gf-confetti-canvas"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10001,
        pointerEvents: 'none',
        width: '100vw',
        height: '100vh',
      }}
    />
  );
}
