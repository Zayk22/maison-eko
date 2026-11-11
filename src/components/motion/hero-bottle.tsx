"use client";

import dynamic from "next/dynamic";
import { m, useReducedMotion } from "motion/react";
import { Bottle } from "@/components/shop/bottle";

const Particles = dynamic(() => import("./particles"), { ssr: false });

type Props = {
  accentHex: string;
  sizeMl: number;
};

export function HeroBottle({ accentHex, sizeMl }: Props) {
  const reduce = useReducedMotion();

  const float = reduce
    ? {}
    : {
        y: [0, -10, 0] as number[],
        transition: {
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      };

  return (
    <div className="relative w-full max-w-sm mx-auto aspect-[3/4] flex items-center justify-center">
      <Particles color={accentHex} />

      {!reduce && (
        <m.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] pointer-events-none rounded-full"
          style={{
            background: `radial-gradient(circle, ${accentHex} 0%, transparent 65%)`,
          }}
          initial={{ opacity: 0.4 }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden="true"
        />
      )}

      <m.div
        className="relative z-10 flex items-center justify-center h-full"
        animate={float}
      >
        <Bottle
          accentHex={accentHex}
          sizeMl={sizeMl}
          className="h-full w-auto max-w-full"
        />
      </m.div>
    </div>
  );
}