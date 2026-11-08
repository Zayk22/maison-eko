import Link from "next/link";

const footerLink =
  "inline-flex items-center min-h-11 px-2 rounded-control text-sm font-medium text-ink " +
  "hover:underline hover:underline-offset-4 hover:decoration-accent hover:decoration-2 " +
  "focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4 focus-visible:decoration-accent focus-visible:decoration-2 " +
  "transition-colors";

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
            className="flex flex-wrap items-center justify-center gap-1 text-sm"
          >
            <Link href="/shop" className={footerLink}>
              Shop
            </Link>
            <Link href="/track-order" className={footerLink}>
              Track Order
            </Link>
            <Link href="/about" className={footerLink}>
              About
            </Link>
            <Link href="/contact" className={footerLink}>
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}