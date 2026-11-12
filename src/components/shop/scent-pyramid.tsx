"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Bottle } from "./bottle";
import { tintWash, BONE, WASH_PERCENT_STORY } from "@/lib/color";
import type { Pyramid } from "@/lib/pyramid";

type Props = {
  accentHex: string;
  pyramid: Pyramid;
};

function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

function ramp(p: number, from: number, to: number): number {
  if (p <= from) return 0;
  if (p >= to) return 1;
  return (p - from) / (to - from);
}

function NoteBlock({
  label,
  notes,
}: {
  label: string;
  notes: readonly string[];
}) {
  return (
    <div className="py-3 md:py-8">
      <p className="text-[13px] uppercase tracking-widest text-ink/70 mb-1 md:mb-3">
        {label}
      </p>
      <p className="font-display text-xl md:text-4xl leading-tight text-ink">
        {notes.join(", ")}
      </p>
    </div>
  );
}

function StaticStory({ accentHex, pyramid }: Props) {
  const wash = tintWash(accentHex, BONE, WASH_PERCENT_STORY);
  return (
    <section className="relative w-full" style={{ backgroundColor: wash }}>
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-start">
          <div className="flex justify-center md:justify-start min-w-0">
            <div className="w-40 md:w-60 aspect-[1/2]">
              <Bottle
                accentHex={accentHex}
                sizeMl={100}
                className="w-full h-auto"
              />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="text-[13px] uppercase tracking-widest text-ink/70 mb-4">
              Scent notes
            </div>
            <NoteBlock label="Top" notes={pyramid.top} />
            <NoteBlock label="Heart" notes={pyramid.heart} />
            <NoteBlock label="Base" notes={pyramid.base} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PinnedStory({ accentHex, pyramid }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<HTMLDivElement>(null);
  const bottleRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;

    let raf = 0;

    function apply(p: number) {
      if (washRef.current) {
        washRef.current.style.opacity = String(ramp(p, 0, 0.2));
      }
      if (bottleRef.current) {
        bottleRef.current.style.transform = `translate3d(0, ${-20 * p}px, 0)`;
      }
      const groups: Array<[HTMLDivElement | null, number, number]> = [
        [topRef.current, 0.05, 0.2],
        [heartRef.current, 0.35, 0.5],
        [baseRef.current, 0.65, 0.8],
      ];
      for (const [el, from, to] of groups) {
        if (!el) continue;
        const t = ramp(p, from, to);
        el.style.opacity = String(t);
        el.style.transform = `translate3d(0, ${(1 - t) * 24}px, 0)`;
      }
    }

    function measure() {
      raf = 0;
      if (!section || !sticky) return;
      // Distance the sticky panel can travel inside the section. Using the
      // panel height (not window.innerHeight) keeps progress stable when the
      // mobile browser URL bar collapses or expands.
      const total = section.offsetHeight - sticky.offsetHeight;
      const top = section.getBoundingClientRect().top;
      const p = total <= 0 ? 0 : Math.max(0, Math.min(1, -top / total));
      apply(p);
    }

    function schedule() {
      if (raf === 0) raf = requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const wash = tintWash(accentHex, BONE, WASH_PERCENT_STORY);

  return (
    <section ref={sectionRef} className="relative w-full h-[250svh] md:h-[300svh]">
      <div ref={stickyRef} className="sticky top-0 h-svh w-full">
        <div
          ref={washRef}
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: wash, opacity: 0 }}
          aria-hidden="true"
        />
        <div className="relative z-10 h-full w-full mx-auto max-w-6xl px-4 md:px-8 pt-6 pb-24 md:py-0 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-20 content-center items-center">
          <div
            ref={bottleRef}
            className="flex justify-center md:justify-start min-w-0"
          >
            <div className="w-24 md:w-60 aspect-[1/2]">
              <Bottle
                accentHex={accentHex}
                sizeMl={100}
                className="w-full h-auto"
              />
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="text-[13px] uppercase tracking-widest text-ink/70 mb-1 md:mb-4">
              Scent notes
            </div>
            <div ref={topRef} style={{ opacity: 0 }}>
              <NoteBlock label="Top" notes={pyramid.top} />
            </div>
            <div ref={heartRef} style={{ opacity: 0 }}>
              <NoteBlock label="Heart" notes={pyramid.heart} />
            </div>
            <div ref={baseRef} style={{ opacity: 0 }}>
              <NoteBlock label="Base" notes={pyramid.base} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ScentPyramid({ accentHex, pyramid }: Props) {
  const mounted = useMounted();
  const reduce = useReducedMotion();

  if (!mounted || reduce) {
    return <StaticStory accentHex={accentHex} pyramid={pyramid} />;
  }
  return <PinnedStory accentHex={accentHex} pyramid={pyramid} />;
}