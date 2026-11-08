import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export function Nav() {
  return (
    <header className="border-b border-border bg-bg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8 md:py-6">
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-xl font-medium tracking-tight text-ink md:text-2xl"
        >
          Maison Eko
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-8">
          <Link href="/shop" className="text-sm font-medium text-ink hover:text-accent transition-colors">
            Shop
          </Link>
          <Link href="/scent-finder" className="text-sm font-medium text-ink hover:text-accent transition-colors">
            Scent Finder
          </Link>
          <Link href="/about" className="text-sm font-medium text-ink hover:text-accent transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-sm font-medium text-ink hover:text-accent transition-colors">
            Contact
          </Link>
        </nav>

        {/* Cart Icon */}
        <Link
          href="/cart"
          className="flex items-center gap-2 text-sm font-medium text-ink hover:text-accent transition-colors"
          aria-label="Open cart"
        >
          <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Cart</span>
        </Link>
      </div>
    </header>
  );
}