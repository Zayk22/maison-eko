"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { SignOutButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
];

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between py-4 border-b border-border">
        <Link href="/admin" className="font-display text-xl text-ink">
          Admin
        </Link>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center min-h-11 min-w-11 -mr-2 rounded-control text-ink hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Open admin menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
            <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-4/5 max-w-xs bg-surface shadow-xl flex flex-col focus:outline-none">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <Dialog.Title className="font-display text-lg text-ink">Menu</Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-control text-ink hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>
              <nav className="flex flex-col p-2 gap-1 flex-1">
                {links.map((link) => (
                  <Dialog.Close asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={`flex items-center min-h-11 px-3 rounded-control text-base font-medium ${
                        isActive(link.href) ? "bg-ink text-bg" : "text-ink hover:bg-bg"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </Dialog.Close>
                ))}
              </nav>
              <div className="p-4 border-t border-border space-y-3">
                <Link
                  href="/"
                  className="flex items-center min-h-11 px-3 rounded-control text-sm text-muted hover:bg-bg"
                >
                  View store
                </Link>
                <SignOutButton redirectUrl="/">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center min-h-11 rounded-control border border-border px-4 text-sm font-medium text-ink hover:border-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Sign out
                  </button>
                </SignOutButton>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Desktop top bar */}
      <header className="hidden md:flex items-center justify-between py-6 border-b border-border mb-8">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="font-display text-2xl text-ink">
            Admin
          </Link>
          <nav className="flex items-center gap-6">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-sm font-medium transition-colors hover:text-ink ${
                    active ? "text-ink underline underline-offset-4 decoration-accent decoration-2" : "text-muted"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-muted hover:text-ink transition-colors"
          >
            View store
          </Link>
          <div className="h-4 w-px bg-border" />
          <SignOutButton redirectUrl="/">
            <button
              type="button"
              className="inline-flex items-center justify-center min-h-11 rounded-control border border-border px-4 text-sm font-medium text-ink hover:border-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Sign out
            </button>
          </SignOutButton>
        </div>
      </header>
    </>
  );
}