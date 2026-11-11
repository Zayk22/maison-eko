"use client";

import { useEffect, useState } from "react";

/**
 * Returns true only when the device reports (hover: hover) and
 * (pointer: fine) — that is, a real pointer device like a mouse or
 * trackpad, not a touch screen. Initial state is false so SSR and the
 * first client render agree; the value updates in an effect and on
 * media-query change.
 */
export function useHoverCapable(): boolean {
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCapable(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setCapable(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return capable;
}