import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg px-4 py-12 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="font-display text-lg text-ink">Maison Eko</span>
          <span className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Maison Eko. All rights reserved.
          </span>
        </div>

        <nav className="flex gap-6 text-sm text-muted">
          <Link href="/shop" className="hover:text-ink transition-colors">
            Shop
          </Link>
          <Link href="/track-order" className="hover:text-ink transition-colors">
            Track Order
          </Link>
          <Link href="/about" className="hover:text-ink transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-ink transition-colors">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}