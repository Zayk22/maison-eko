import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { getOrderById } from "@/server/queries";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { formatMoney } from "@/lib/money";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "Order Details — Admin",
  robots: { index: false, follow: false },
};

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).replace(/am|pm/, (m) => m.toUpperCase());
}

export default async function AdminOrderDetailPage({ params }: { params: Params }) {
  const auth = await requireAdmin();
  if (auth.status === "unauthenticated") redirect("/sign-in");
  if (auth.status !== "ok") return null;

  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) notFound();

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/orders" className="text-sm text-muted hover:text-ink mb-4 inline-block">
          &larr; Back to orders
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="font-display text-3xl text-ink tabular-nums">{order.orderNumber}</h1>
          <span className="inline-flex px-3 py-1.5 rounded-full text-sm font-medium bg-ink text-bg capitalize w-fit">
            {order.status}
          </span>
        </div>
        <p className="text-sm text-muted mt-2">Placed on {formatDate(order.createdAt)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-card p-6">
            <h2 className="text-sm font-medium text-ink mb-4">Items</h2>
            <ul className="space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 text-sm">
                  <div>
                    <p className="text-ink">{item.productName}</p>
                    <p className="text-xs text-muted">
                      {item.sizeMl} ml &times; {item.quantity} &middot; {formatMoney(item.unitPriceKobo)} each
                    </p>
                  </div>
                  <p className="text-ink tabular-nums shrink-0">
                    {formatMoney(item.lineTotalKobo)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="text-ink tabular-nums">{formatMoney(order.subtotalKobo)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Shipping</span>
                <span className="text-ink tabular-nums">{formatMoney(order.shippingKobo)}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t border-border">
                <span className="text-ink">Total</span>
                <span className="text-ink tabular-nums">{formatMoney(order.totalKobo)}</span>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-card p-6">
            <h2 className="text-sm font-medium text-ink mb-4">Timeline</h2>
            <ol className="relative border-l border-border ml-3 space-y-4">
              {order.events.map((ev, idx) => (
                <li key={idx} className="pl-6 relative">
                  <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-accent" />
                  <p className="text-sm font-medium text-ink capitalize">{ev.status}</p>
                  <p className="text-xs text-muted">{formatDate(ev.createdAt)}</p>
                  {ev.note && <p className="text-xs text-muted mt-1">{ev.note}</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-card p-6">
            <h2 className="text-sm font-medium text-ink mb-4">Customer</h2>
            <div className="text-sm space-y-3">
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-1">Name</p>
                <p className="text-ink">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-1">Phone</p>
                <p className="text-ink tabular-nums">{order.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-1">Address</p>
                <p className="text-ink">{order.address}</p>
              </div>
              {order.note && (
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide mb-1">Note</p>
                  <p className="text-ink">{order.note}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-card p-6">
            <h2 className="text-sm font-medium text-ink mb-4">Update Status</h2>
            <OrderStatusForm orderId={order.id} currentStatus={order.status} />
          </div>
        </div>
      </div>
    </div>
  );
}