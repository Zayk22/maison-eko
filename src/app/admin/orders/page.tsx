import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { getAllOrders } from "@/server/queries";
import { formatMoney } from "@/lib/money";
import type { OrderStatus } from "@/lib/types";

export const metadata = {
  title: "Orders — Admin",
  robots: { index: false, follow: false },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "paid", label: "Paid" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type FilterKey = typeof FILTERS[number]["key"];
type SearchParams = Promise<{ status?: string }>;

function parseStatus(raw: string | undefined): OrderStatus | undefined {
  if (!raw) return undefined;
  const valid = ["pending", "confirmed", "paid", "shipped", "delivered", "cancelled"];
  if (valid.includes(raw)) return raw as OrderStatus;
  return undefined;
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).replace(/am|pm/, (m) => m.toUpperCase());
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-border/50 text-ink capitalize">
      {status}
    </span>
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const auth = await requireAdmin();
  if (auth.status === "unauthenticated") redirect("/sign-in");
  if (auth.status !== "ok") return null;

  const { status: rawStatus } = await searchParams;
  const statusFilter = parseStatus(rawStatus);
  const orders = await getAllOrders(statusFilter);

  return (
    <div className="min-w-0">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink mb-4">Orders</h1>
        <div className="flex overflow-x-auto snap-x snap-mandatory md:flex-wrap gap-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => {
            const isActive = (f.key === "all" && !statusFilter) || statusFilter === f.key;
            return (
              <Link
                key={f.key}
                href={f.key === "all" ? "/admin/orders" : `/admin/orders?status=${f.key}`}
                aria-current={isActive ? "page" : undefined}
                className={`snap-start shrink-0 inline-flex items-center min-h-11 px-4 rounded-full border text-sm ${
                  isActive
                    ? "bg-ink text-bg border-ink"
                    : "bg-transparent text-ink border-border hover:border-ink"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/admin/orders/${o.id}`}
            className="block bg-surface border border-border rounded-card p-4 hover:border-ink transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-ink tabular-nums">{o.orderNumber}</span>
              <StatusBadge status={o.status} />
            </div>
            <p className="text-sm text-ink mb-2">{o.customerName}</p>
            <div className="flex items-center justify-between text-xs text-muted tabular-nums">
              <span>{formatDate(o.createdAt)}</span>
              <span className="font-medium text-ink text-sm">{formatMoney(o.totalKobo)}</span>
            </div>
          </Link>
        ))}
        {orders.length === 0 && (
          <p className="text-center py-8 text-muted">No orders found.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-surface border border-border rounded-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg border-b border-border text-muted">
            <tr>
              <th className="p-4 font-medium">Order</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="p-4">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-ink hover:underline underline-offset-4 decoration-accent tabular-nums">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="p-4 text-ink">{o.customerName}</td>
                <td className="p-4 text-muted tabular-nums">{formatDate(o.createdAt)}</td>
                <td className="p-4"><StatusBadge status={o.status} /></td>
                <td className="p-4 text-right tabular-nums text-ink font-medium">{formatMoney(o.totalKobo)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}