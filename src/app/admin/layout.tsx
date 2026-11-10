import { ClerkProvider } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { AdminNav } from "@/components/admin/admin-nav";

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
        <p className="text-sm text-muted">This account does not have admin access.</p>
      </div>
    );
  }

  if (result.status === "misconfigured") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-ink mb-2">Admin not configured</h1>
        <p className="text-sm text-muted">ADMIN_USER_ID is missing on the server.</p>
      </div>
    );
  }

  return (
    <ClerkProvider>
      <div className="min-h-screen bg-bg">
        <div className="mx-auto w-full max-w-5xl px-4 md:px-8 min-w-0">
          <AdminNav />
          <main id="main-content" className="pb-16 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </ClerkProvider>
  );
}