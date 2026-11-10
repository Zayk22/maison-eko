import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { getAllProducts } from "@/server/queries";

export const metadata = {
  title: "Products — Admin",
  robots: { index: false, follow: false },
};

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${active ? "bg-success/10 text-success" : "bg-border/50 text-muted"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default async function AdminProductsPage() {
  const auth = await requireAdmin();
  if (auth.status === "unauthenticated") redirect("/sign-in");
  if (auth.status !== "ok") return null;

  const products = await getAllProducts();

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Products</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center min-h-11 rounded-control bg-ink px-6 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
        >
          New Product
        </Link>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/admin/products/${p.id}`}
            className="block bg-surface border border-border rounded-card p-4 hover:border-ink transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="font-medium text-ink truncate">{p.name}</p>
                <p className="text-xs text-muted truncate">{p.slug}</p>
              </div>
              <StatusBadge active={p.active} />
            </div>
            <p className="text-xs text-muted">{p.variants.length} size(s)</p>
          </Link>
        ))}
        {products.length === 0 && (
          <p className="text-center py-8 text-muted">No products found.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-surface border border-border rounded-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg border-b border-border text-muted">
            <tr>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Variants</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="p-4">
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-muted">{p.slug}</p>
                </td>
                <td className="p-4"><StatusBadge active={p.active} /></td>
                <td className="p-4 text-muted">{p.variants.length} size(s)</td>
                <td className="p-4 text-right">
                  <Link href={`/admin/products/${p.id}`} className="text-ink hover:underline underline-offset-4 decoration-accent">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}