import { useEffect, useRef } from "react";

/**
 * Point-cloud sphere + starfield on a 2D canvas.
 *
 * Deliberately not three.js: r3f + three is ~600KB gzipped and risks the
 * frame rate on whatever machine drives the demo. A Fibonacci-lattice sphere
 * with a perspective divide gets most of the look for no dependency.
 *
 * Guards matter here — without them this eats a laptop battery:
 *   - cancelAnimationFrame on unmount
 *   - pause when the tab is hidden
 *   - render a single static frame under prefers-reduced-motion
 */

interface Point {
  x: number;
  y: number;
  z: number;
}

function fibonacciSphere(count: number): Point[] {
  const points: Point[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    points.push({ x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius });
  }
  return points;
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmall = window.innerWidth < 768;
    const count = isSmall ? 1200 : 3500;
    const starCount = isSmall ? 90 : 220;

    const sphere = fibonacciSphere(count);
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.1 + 0.2,
      a: Math.random() * 0.5 + 0.15,
    }));

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let raf = 0;
    let running = true;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.36;

      // starfield
      for (const s of stars) {
        ctx.globalAlpha = s.a;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(s.x * width, s.y * height, s.r, s.r);
      }

      const t = frame * 0.0008;
      const cos = Math.cos(t);
      const sin = Math.sin(t);

      for (const p of sphere) {
        // rotate around Y
        const rx = p.x * cos - p.z * sin;
        const rz = p.x * sin + p.z * cos;

        // radial wobble so the sphere breathes rather than spinning rigidly
        const wobble = 1 + Math.sin(t * 2 + p.y * 3 + rx * 2) * 0.12;

        const depth = 2.4 / (2.4 + rz * wobble);
        const px = cx + rx * wobble * scale * depth;
        const py = cy + p.y * wobble * scale * depth;

        const alpha = Math.max(0, Math.min(1, (depth - 0.55) * 1.5));
        const size = depth * 1.7;

        // violet core shading to magenta at the rim
        const mix = (p.y + 1) / 2;
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = mix > 0.55 ? "#c026d3" : mix > 0.3 ? "#9333ea" : "#7c3aed";
        ctx.fillRect(px, py, size, size);
      }

      ctx.globalAlpha = 1;
      frame += 1;
      if (running && !reduced) raf = requestAnimationFrame(draw);
    }

    draw();

    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        raf = requestAnimationFrame(draw);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
