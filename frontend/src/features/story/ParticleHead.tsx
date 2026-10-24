import { useEffect, useRef } from "react";

/**
 * Abstract human bust rendered as a luminous point cloud.
 *
 * The silhouette is defined here as a bezier path, rasterised to an offscreen
 * canvas, and sampled where alpha > threshold. Nothing is downloaded and no
 * external image is referenced — the distribution is deterministic because
 * point selection and jitter both come from a seeded PRNG.
 *
 * Edge pixels (any neighbour outside the shape) are flagged and drawn
 * brighter, which is what produces the rim glow without a blur pass.
 *
 * Canvas 2D rather than WebGL: ~4k points is nowhere near needing a GPU, and
 * this keeps the dependency count at zero.
 */

interface Particle {
  x: number;
  y: number;
  /** 0..1 pseudo-depth, drives parallax, size and alpha */
  z: number;
  edge: boolean;
  /** phase offset so points don't breathe in unison */
  phase: number;
}

/** Deterministic PRNG — same scene on every load. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DESIGN_W = 220;
const DESIGN_H = 262;

/** Side-profile bust facing left, drawn in DESIGN_W x DESIGN_H space. */
function traceBust(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(108, 14);
  ctx.bezierCurveTo(152, 14, 170, 50, 167, 88); // back of skull
  ctx.bezierCurveTo(165, 116, 159, 128, 152, 140); // occiput → nape
  ctx.bezierCurveTo(150, 154, 152, 162, 154, 174); // neck, back edge
  ctx.bezierCurveTo(180, 188, 189, 202, 193, 252); // right shoulder
  ctx.lineTo(31, 252); // bust base
  ctx.bezierCurveTo(35, 202, 44, 188, 70, 174); // left shoulder
  ctx.bezierCurveTo(73, 165, 73, 158, 70, 152); // neck, front edge
  ctx.bezierCurveTo(59, 152, 48, 147, 43, 137); // jaw → chin
  ctx.bezierCurveTo(37, 131, 42, 127, 36, 123); // lower lip / chin notch
  ctx.bezierCurveTo(30, 120, 38, 116, 34, 113); // upper lip, philtrum
  ctx.bezierCurveTo(22, 110, 14, 104, 20, 97); // nose tip (pronounced)
  ctx.bezierCurveTo(32, 94, 44, 92, 48, 83); // nose bridge
  ctx.bezierCurveTo(46, 74, 44, 66, 47, 56); // brow ridge
  ctx.bezierCurveTo(52, 34, 78, 14, 108, 14); // forehead → crown
  ctx.closePath();
}

function buildParticles(target: number): Particle[] {
  const scale = 3; // rasterise above design size for a finer sample grid
  const w = DESIGN_W * scale;
  const h = DESIGN_H * scale;

  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d", { willReadFrequently: true });
  if (!octx) return [];

  octx.scale(scale, scale);
  octx.fillStyle = "#fff";
  traceBust(octx);
  octx.fill();

  const { data } = octx.getImageData(0, 0, w, h);
  const alphaAt = (x: number, y: number) =>
    x < 0 || y < 0 || x >= w || y >= h ? 0 : data[(y * w + x) * 4 + 3];

  // Collect candidates on a regular grid, flagging shape edges.
  const step = 4;
  const candidates: { x: number; y: number; edge: boolean }[] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (alphaAt(x, y) < 128) continue;
      const edge =
        alphaAt(x - step, y) < 128 ||
        alphaAt(x + step, y) < 128 ||
        alphaAt(x, y - step) < 128 ||
        alphaAt(x, y + step) < 128;
      candidates.push({ x: x / w, y: y / h, edge });
    }
  }

  const rand = mulberry32(20261024);
  // Keep every edge point (they carry the silhouette), thin the interior.
  const edges = candidates.filter((c) => c.edge);
  const inner = candidates.filter((c) => !c.edge);
  const innerWanted = Math.max(0, target - edges.length);
  const keepRatio = inner.length ? Math.min(1, innerWanted / inner.length) : 0;

  const chosen = [
    ...edges,
    ...inner.filter(() => rand() < keepRatio),
  ];

  return chosen.map((c) => ({
    x: c.x + (rand() - 0.5) * 0.004,
    y: c.y + (rand() - 0.5) * 0.004,
    z: rand(),
    edge: c.edge,
    phase: rand() * Math.PI * 2,
  }));
}

export default function ParticleHead({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmall = window.innerWidth < 768;

    const particles = buildParticles(isSmall ? 1100 : 3200);
    const starCount = isSmall ? 70 : 190;
    const starRand = mulberry32(99);
    const stars = Array.from({ length: starCount }, () => ({
      x: starRand(),
      y: starRand(),
      r: starRand() * 1.1 + 0.25,
      a: starRand() * 0.45 + 0.12,
    }));

    let width = 0;
    let height = 0;
    // Pointer parallax target vs. eased current value.
    let pointerX = 0;
    let pointerY = 0;
    let easedX = 0;
    let easedY = 0;

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function onPointer(e: PointerEvent) {
      pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
    }
    // Parallax is a desktop nicety; skip the listener entirely otherwise.
    const wantsParallax = !reduced && !isSmall;
    if (wantsParallax) window.addEventListener("pointermove", onPointer);

    let frame = 0;
    let raf = 0;
    let running = true;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      easedX += (pointerX - easedX) * 0.04;
      easedY += (pointerY - easedY) * 0.04;

      for (const s of stars) {
        ctx.globalAlpha = s.a;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(s.x * width, s.y * height, s.r, s.r);
      }

      // Fit the bust to the viewport, biased slightly above centre.
      const scale = Math.min(width / DESIGN_W, height / DESIGN_H) * 0.95;
      const drawW = DESIGN_W * scale;
      const drawH = DESIGN_H * scale;
      const originX = (width - drawW) / 2;
      // Bias upward so the face sits above the centred copy rather than
      // behind it — the profile is the point of the image.
      const originY = (height - drawH) * 0.18;

      const t = frame * 0.006;

      for (const p of particles) {
        const depth = 0.6 + p.z * 0.4;
        const drift = reduced ? 0 : Math.sin(t + p.phase) * 1.6 * depth;
        const sway = reduced ? 0 : Math.cos(t * 0.7 + p.phase) * 1.1 * depth;

        const px = originX + p.x * drawW + drift + easedX * 14 * depth;
        const py = originY + p.y * drawH + sway + easedY * 10 * depth;

        if (p.edge) {
          ctx.globalAlpha = 0.5 + p.z * 0.45;
          ctx.fillStyle = p.z > 0.72 ? "#f0a6ff" : "#c026d3";
          ctx.fillRect(px, py, 1.5 + p.z * 0.9, 1.5 + p.z * 0.9);
        } else {
          ctx.globalAlpha = 0.18 + p.z * 0.4;
          ctx.fillStyle = p.z > 0.6 ? "#9333ea" : "#6d28d9";
          ctx.fillRect(px, py, 1.1 + p.z * 0.7, 1.1 + p.z * 0.7);
        }
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
      if (wantsParallax) window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    />
  );
}
