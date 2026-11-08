import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-10">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-display text-lg text-ink">Maison Eko</span>
            <span className="text-xs text-muted">
              Maison Eko is a fictional demo project.
            </span>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted"
          >
            <Link
              href="/shop"
              className="inline-flex items-center min-h-11 px-2 hover:text-ink transition-colors"
            >
              Shop
            </Link>
            <Link
              href="/track-order"
              className="inline-flex items-center min-h-11 px-2 hover:text-ink transition-colors"
            >
              Track Order
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center min-h-11 px-2 hover:text-ink transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center min-h-11 px-2 hover:text-ink transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}