import { useRef, useEffect, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  shape: 'circle' | 'square' | 'star';
  rotation: number;
  rotationSpeed: number;
}

interface ParticleCanvasProps {
  trigger: number; // increment to trigger burst
  type: 'confetti' | 'fire' | 'none';
}

const CONFETTI_COLORS = [
  '#00f5ff', '#ff2d75', '#ffd700', '#a855f7', '#00ff88', '#ff8800',
  '#ff4444', '#44ff44', '#4488ff', '#ffff44',
];

export function ParticleCanvas({ trigger, type }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const bgParticlesRef = useRef<{ x: number; y: number; size: number; alpha: number; speed: number; angle: number }[]>([]);

  // Init background floating particles
  useEffect(() => {
    const bgP = [];
    for (let i = 0; i < 30; i++) {
      bgP.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.15 + 0.02,
        speed: Math.random() * 0.3 + 0.1,
        angle: Math.random() * Math.PI * 2,
      });
    }
    bgParticlesRef.current = bgP;
  }, []);

  const createConfettiBurst = useCallback(() => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const particles: Particle[] = [];

    for (let i = 0; i < 80; i++) {
      const angle = (Math.PI * 2 * i) / 80 + Math.random() * 0.3;
      const speed = Math.random() * 8 + 4;
      particles.push({
        x: centerX + (Math.random() - 0.5) * 40,
        y: centerY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 3,
        size: Math.random() * 6 + 3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        alpha: 1,
        decay: Math.random() * 0.01 + 0.005,
        gravity: 0.12,
        shape: ['circle', 'square', 'star'][Math.floor(Math.random() * 3)] as Particle['shape'],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }
    particlesRef.current = [...particlesRef.current, ...particles];
  }, []);

  const createFireBurst = useCallback(() => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2 - 50;
    const particles: Particle[] = [];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: centerX + (Math.random() - 0.5) * 60,
        y: centerY + Math.random() * 30,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 5 - 2,
        size: Math.random() * 5 + 2,
        color: ['#ff4400', '#ff8800', '#ffcc00', '#ff2200'][Math.floor(Math.random() * 4)],
        alpha: 1,
        decay: Math.random() * 0.02 + 0.01,
        gravity: -0.03,
        shape: 'circle',
        rotation: 0,
        rotationSpeed: 0,
      });
    }
    particlesRef.current = [...particlesRef.current, ...particles];
  }, []);

  // Trigger effect
  useEffect(() => {
    if (trigger <= 0) return;
    if (type === 'confetti') createConfettiBurst();
    if (type === 'fire') createFireBurst();
  }, [trigger, type, createConfettiBurst, createFireBurst]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background particles
      for (const bp of bgParticlesRef.current) {
        bp.x += Math.cos(bp.angle) * bp.speed;
        bp.y += Math.sin(bp.angle) * bp.speed;
        bp.angle += 0.002;

        if (bp.x < 0) bp.x = canvas.width;
        if (bp.x > canvas.width) bp.x = 0;
        if (bp.y < 0) bp.y = canvas.height;
        if (bp.y > canvas.height) bp.y = 0;

        ctx.beginPath();
        ctx.arc(bp.x, bp.y, bp.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${bp.alpha})`;
        ctx.fill();
      }

      // Draw burst particles
      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.99;
        p.alpha -= p.decay;
        p.rotation += p.rotationSpeed;

        if (p.alpha <= 0) continue;
        alive.push(p);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'square') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          // Star
          drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
          ctx.fill();
        }
        ctx.restore();
      }
      particlesRef.current = alive;

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);

  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}
