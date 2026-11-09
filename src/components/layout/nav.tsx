"use client";

import Link from "next/link";
import { ShoppingBag, Menu, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useCart } from "@/components/cart/cart-context";
import { useEffect, useState } from "react";

const navLink =
  "inline-flex items-center min-h-11 px-2 rounded-control text-sm font-medium text-ink " +
  "hover:underline hover:underline-offset-4 hover:decoration-accent hover:decoration-2 " +
  "focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4 focus-visible:decoration-accent focus-visible:decoration-2 " +
  "transition-colors";

const mobileNavLink =
  "flex items-center min-h-11 px-4 py-2 text-lg font-medium text-ink " +
  "hover:bg-bg hover:underline hover:underline-offset-4 hover:decoration-accent hover:decoration-2 " +
  "focus-visible:outline-none focus-visible:bg-bg focus-visible:underline focus-visible:underline-offset-4 focus-visible:decoration-accent focus-visible:decoration-2";

export function Nav() {
  const {
    itemCount,
    hydrated,
    openDrawer,
    lastAnnouncement,
    clearAnnouncement,
  } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!lastAnnouncement) return;
    const t = setTimeout(() => clearAnnouncement(), 3000);
    return () => clearTimeout(t);
  }, [lastAnnouncement, clearAnnouncement]);

  const badgeCount = hydrated && itemCount > 0 ? itemCount : 0;
  const badgeLabel = badgeCount > 9 ? "9+" : String(badgeCount);
  const cartAriaLabel =
    hydrated && itemCount > 0
      ? `Open cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`
      : "Open cart";

  return (
    <header className="border-b border-border bg-bg relative z-40">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center min-h-11 min-w-11 -ml-2 rounded-control text-ink hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="me-mobile-nav-overlay fixed inset-0 z-50 bg-ink/40" />
              <Dialog.Content className="me-mobile-nav-content fixed inset-y-0 left-0 z-50 w-4/5 max-w-sm bg-surface shadow-xl focus:outline-none">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <Dialog.Title className="font-display text-xl text-ink">
                    Menu
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-control text-ink hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      aria-label="Close menu"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </Dialog.Close>
                </div>
                <nav aria-label="Mobile" className="flex flex-col py-2">
                  <Dialog.Close asChild>
                    <Link href="/shop" className={mobileNavLink}>Shop</Link>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <Link href="/scent-finder" className={mobileNavLink}>Scent Finder</Link>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <Link href="/about" className={mobileNavLink}>About</Link>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <Link href="/contact" className={mobileNavLink}>Contact</Link>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <Link href="/track-order" className={mobileNavLink}>Track Order</Link>
                  </Dialog.Close>
                </nav>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <Link
            href="/"
            className="font-display text-xl font-medium tracking-tight text-ink md:text-2xl inline-flex items-center min-h-11"
          >
            Maison Eko
          </Link>

          <nav
            aria-label="Primary"
            className="hidden md:flex md:items-center md:gap-4"
          >
            <Link href="/shop" className={navLink}>Shop</Link>
            <Link href="/scent-finder" className={navLink}>Scent Finder</Link>
            <Link href="/about" className={navLink}>About</Link>
            <Link href="/contact" className={navLink}>Contact</Link>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openDrawer}
              className="inline-flex items-center gap-2 min-h-11 px-2 rounded-control text-sm font-medium text-ink hover:underline hover:underline-offset-4 hover:decoration-accent hover:decoration-2 focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4 focus-visible:decoration-accent focus-visible:decoration-2 transition-colors -mr-2 md:mr-0"
              aria-label={cartAriaLabel}
            >
              <span className="relative inline-flex items-center justify-center">
                <ShoppingBag className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
                {badgeCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold leading-none text-bg tabular-nums ring-1 ring-accent"
                    aria-hidden="true"
                  >
                    {badgeLabel}
                  </span>
                )}
              </span>
              <span className="hidden sm:inline">Cart</span>
            </button>

            <span className="sr-only" aria-live="polite" aria-atomic="true">
              {lastAnnouncement?.message}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}