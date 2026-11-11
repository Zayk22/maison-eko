"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

type Props = {
  color: string;
};

export default function Particles({ color }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let visible = true;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function countFor(w: number): number {
      return w < 768 ? 24 : 40;
    }

    function seed(w: number, h: number) {
      const n = countFor(w);
      particles = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 1.4 + 0.4,
      }));
    }

    function resize() {
      if (!wrap || !canvas) return;
      const rect = wrap.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed(width, height);
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function loop() {
      raf = 0;
      if (!visible) return;
      draw();
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (raf === 0 && visible) raf = requestAnimationFrame(loop);
    }

    function stop() {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    start();

       const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(wrap);

    function onVisibility() {
      if (document.hidden) stop();
      else if (visible) start();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [color, reduce]);

  if (reduce) return null;

  return (
    <div ref={wrapRef} className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}