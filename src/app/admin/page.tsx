import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { getAllOrders, getAllProducts } from "@/server/queries";
import { formatMoney } from "@/lib/money";

export const metadata = {
  title: "Dashboard — Admin",
  robots: { index: false, follow: false },
};

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).replace(/am|pm/, (m) => m.toUpperCase());
}

export default async function AdminDashboardPage() {
  const auth = await requireAdmin();
  if (auth.status === "unauthenticated") redirect("/sign-in");
  if (auth.status !== "ok") return null;

  const orders = await getAllOrders();
  const products = await getAllProducts();

  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const activeProducts = products.filter(p => p.active).length;
  
  // Show the 5 most recent orders
  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-surface border border-border rounded-card p-6">
          <p className="text-sm text-muted uppercase tracking-wide mb-2">Pending Orders</p>
          <p className="font-display text-4xl text-ink">{pendingOrders}</p>
          <Link href="/admin/orders?status=pending" className="text-sm text-ink hover:underline underline-offset-4 decoration-accent mt-4 inline-block">
            View pending orders &rarr;
          </Link>
        </div>
        
        <div className="bg-surface border border-border rounded-card p-6">
          <p className="text-sm text-muted uppercase tracking-wide mb-2">Active Products</p>
          <p className="font-display text-4xl text-ink">{activeProducts}</p>
          <Link href="/admin/products" className="text-sm text-ink hover:underline underline-offset-4 decoration-accent mt-4 inline-block">
            Manage products &rarr;
          </Link>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-card overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-ink hover:underline underline-offset-4 decoration-accent">
            View all
          </Link>
        </div>
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-border">
            {recentOrders.map((o) => (
              <tr key={o.id}>
                <td className="p-4">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-ink tabular-nums hover:underline underline-offset-4 decoration-accent">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="p-4 text-ink">{o.customerName}</td>
                <td className="p-4 text-muted tabular-nums">{formatDate(o.createdAt)}</td>
                <td className="p-4">
                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-border/50 text-ink capitalize">
                    {o.status}
                  </span>
                </td>
                <td className="p-4 text-right tabular-nums text-ink font-medium">
                  {formatMoney(o.totalKobo)}
                </td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr>
                <td className="p-8 text-center text-muted">No orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}