import React, { useEffect, useRef } from 'react';

interface ConfettiCanvasProps {
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  alpha: number;
}

const CONFETTI_COLORS = [
  '#FF8A7A',
  '#56B8FF',
  '#FFD166',
  '#5CE0A8',
  '#C78BFF',
  '#FF8FC8',
];

export const ConfettiCanvas: React.FC<ConfettiCanvasProps> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || 400;
    const height = canvas.clientHeight || 700;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = Array.from({ length: 64 }, (_, idx) => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      const speed = 260 + Math.random() * 340;
      return {
        x: width * (0.25 + (idx % 2) * 0.5) + (Math.random() - 0.5) * 40,
        y: height * 0.42,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        size: 5 + Math.random() * 5,
        color: CONFETTI_COLORS[idx % CONFETTI_COLORS.length],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 10,
        alpha: 1,
      };
    });

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      let anyVisible = false;
      for (const p of particles) {
        p.vy += 620 * dt;
        p.vx *= 0.992;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.vRot * dt;
        if (p.y > height * 0.78) {
          p.alpha = Math.max(0, p.alpha - dt * 1.6);
        }

        if (p.alpha > 0.02 && p.y < height + 40) {
          anyVisible = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size * 0.35, p.size, p.size * 0.7);
          ctx.restore();
        }
      }

      if (anyVisible) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 w-full h-full z-40"
    />
  );
};
