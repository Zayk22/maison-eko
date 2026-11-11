"use client";

import { useEffect, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { useCart } from "@/components/cart/cart-context";

export function CartToast() {
  const { lastAnnouncement } = useCart();
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!lastAnnouncement) return;
    setMessage(lastAnnouncement.message);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(t);
  }, [lastAnnouncement]);

  if (!visible || !message) return null;

  return (
    <m.div
      className="fixed top-20 right-4 z-50 bg-ink text-bg rounded-control px-4 py-2 text-sm shadow-lg pointer-events-none"
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
    >
      {message}
    </m.div>
  );
}