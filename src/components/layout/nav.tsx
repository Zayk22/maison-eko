import Link from "next/link";
import { ShoppingBag } from "lucide-react";

const navLink =
  "inline-flex items-center min-h-11 px-2 rounded-control text-sm font-medium text-ink " +
  "hover:underline hover:underline-offset-4 hover:decoration-accent hover:decoration-2 " +
  "focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4 focus-visible:decoration-accent focus-visible:decoration-2 " +
  "transition-colors";

export function Nav() {
  return (
    <header className="border-b border-border bg-bg">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-center justify-between">
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
            <Link href="/shop" className={navLink}>
              Shop
            </Link>
            <Link href="/scent-finder" className={navLink}>
              Scent Finder
            </Link>
            <Link href="/about" className={navLink}>
              About
            </Link>
            <Link href="/contact" className={navLink}>
              Contact
            </Link>
          </nav>

          <Link
            href="/cart"
            aria-label="Open cart"
            className={
              "inline-flex items-center gap-2 min-h-11 px-2 rounded-control text-sm font-medium text-ink " +
              "hover:underline hover:underline-offset-4 hover:decoration-accent hover:decoration-2 " +
              "focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4 focus-visible:decoration-accent focus-visible:decoration-2 " +
              "transition-colors"
            }
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            <span className="hidden sm:inline">Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}