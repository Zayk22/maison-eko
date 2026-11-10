import { ClerkProvider, SignOutButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";

export const metadata = {
  title: "Admin — Maison Eko",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireAdmin();

  if (result.status === "unauthenticated") {
    redirect("/sign-in");
  }

  if (result.status === "forbidden") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-ink mb-2">Not authorized</h1>
        <p className="text-sm text-muted">
          This account does not have admin access.
        </p>
      </div>
    );
  }

  if (result.status === "misconfigured") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-ink mb-2">
          Admin not configured
        </h1>
        <p className="text-sm text-muted">
          ADMIN_USER_ID is missing on the server.
        </p>
      </div>
    );
  }

  return (
    <ClerkProvider>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="flex items-center justify-between mb-10 pb-6 border-b border-border">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="font-display text-2xl text-ink hover:underline hover:underline-offset-4 hover:decoration-accent"
            >
              Admin
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-ink">
              <Link href="/admin/products" className="hover:underline underline-offset-4 decoration-accent">
                Products
              </Link>
            </nav>
            <Link
              href="/"
              className="text-sm text-muted hover:text-ink transition-colors ml-2 border-l border-border pl-4"
            >
              View store
            </Link>
          </div>
          <SignOutButton redirectUrl="/">
            <button
              type="button"
              className="inline-flex items-center justify-center min-h-11 rounded-control border border-border px-4 text-sm font-medium text-ink hover:border-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Sign out
            </button>
          </SignOutButton>
        </header>
        <main id="main-content">{children}</main>
      </div>
    </ClerkProvider>
  );
}