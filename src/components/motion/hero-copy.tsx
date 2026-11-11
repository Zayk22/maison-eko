"use client";

import { m, useReducedMotion } from "motion/react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item = {
  hidden: { y: 12, opacity: 0.85 },
  show: { y: 0, opacity: 1, transition: { duration: 0.45, ease: "easeOut" as const } },
};

export function HeroCopy({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <m.div variants={container} initial="hidden" animate="show">
      {children}
    </m.div>
  );
}

export function HeroItem({ children }: { children: React.ReactNode }) {
  return <m.div variants={item}>{children}</m.div>;
}