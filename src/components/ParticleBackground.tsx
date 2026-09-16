import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  decay: number;
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isRunningRef = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // Check if user prefers reduced motion or device is touch-only
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

    if (prefersReducedMotion || isTouchDevice) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    const spawnParticles = (x: number, y: number) => {
      const maxParticles = 50;
      if (particlesRef.current.length >= maxParticles) return;

      // Spawn 1 or 2 subtle dots along cursor motion
      const count = Math.random() > 0.4 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 8;
        particlesRef.current.push({
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4 - 0.1, // very slight upward float
          size: 1.5 + Math.random() * 1.5, // 1.5px - 3.0px
          opacity: 0.6 + Math.random() * 0.25, // 0.60 - 0.85 visible medium gray
          decay: 0.02 + Math.random() * 0.012, // disappears in ~40-60 frames
        });
      }

      if (!isRunningRef.current) {
        isRunningRef.current = true;
        render();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Avoid spawning if cursor hasn't moved significantly
      if (lastMousePos.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        if (Math.hypot(dx, dy) < 6) return;
      }
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      spawnParticles(e.clientX, e.clientY);
    };

    const render = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= p.decay;

        if (p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Medium gray (slate-600 / neutral-600) with clear smooth fade
        ctx.fillStyle = `rgba(100, 116, 139, ${p.opacity.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (particles.length > 0) {
        animId = requestAnimationFrame(render);
      } else {
        isRunningRef.current = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
      isRunningRef.current = false;
    };
  }, []);

  return (
    <div
      id="background-container"
      className="fixed inset-0 pointer-events-none z-0 bg-subtle-dots"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        id="particle-trail-canvas"
        className="block w-full h-full"
      />
    </div>
  );
};
