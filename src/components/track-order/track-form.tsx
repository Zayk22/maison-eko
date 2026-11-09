"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/money";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

type TrackingResponse = {
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  totalKobo: number;
  items: { productName: string; sizeMl: number; quantity: number }[];
  events: { status: OrderStatus; createdAt: string; note: string | null }[];
};

const inputBase =
  "w-full min-h-11 rounded-control border border-border-strong bg-surface px-3 text-base text-ink " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const labelBase = "block text-sm font-medium text-ink mb-1";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function TrackForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackingResponse | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    setOrder(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      orderNumber: String(fd.get("orderNumber") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
    };

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 429) {
        setError("Too many attempts. Try again in a few minutes.");
      } else if (res.status === 404 || !res.ok) {
        setError(
          "We could not find an order with those details. Check the order number and the phone number you used.",
        );
      } else {
        const data = (await res.json()) as TrackingResponse;
        setOrder(data);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setPending(false);
      if (summaryRef.current) summaryRef.current.focus();
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="orderNumber" className={labelBase}>
            Order number
          </label>
          <input
            id="orderNumber"
            name="orderNumber"
            type="text"
            autoComplete="off"
            required
            placeholder="ME-ABCDEF"
            className={inputBase}
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelBase}>
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            className={inputBase}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 min-h-11 rounded-control bg-ink px-6 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Looking up...
            </>
          ) : (
            "Look up order"
          )}
        </button>
      </form>

      <div
        ref={summaryRef}
        tabIndex={-1}
        aria-live="polite"
        className="outline-none"
      >
        {error && (
          <div role="alert" className="bg-danger/10 border border-danger text-danger p-4 rounded-control">
            {error}
          </div>
        )}

        {order && (
          <div className="bg-surface border border-border rounded-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-1">
                  Order
                </p>
                <p className="font-display text-xl text-ink tabular-nums">
                  {order.orderNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted uppercase tracking-wide mb-1">
                  Current status
                </p>
                <p className="text-sm font-medium text-ink">
                  {STATUS_LABEL[order.status]}
                </p>
              </div>
            </div>

            <ol className="relative border-l border-border ml-3 space-y-6">
              {order.events.map((ev, idx) => (
                <li key={idx} className="pl-6 relative">
                  <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-accent" />
                  <p className="text-sm font-medium text-ink">
                    {STATUS_LABEL[ev.status]}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(ev.createdAt).toLocaleString("en-NG")}
                  </p>
                  {ev.note && (
                    <p className="text-xs text-muted mt-1">{ev.note}</p>
                  )}
                </li>
              ))}
            </ol>

            <div className="border-t border-border mt-6 pt-4">
              <p className="text-xs text-muted uppercase tracking-wide mb-2">
                Items
              </p>
              <ul className="space-y-1 text-sm">
                {order.items.map((it, idx) => (
                  <li key={idx} className="flex justify-between gap-4">
                    <span className="text-ink">
                      {it.productName}{" "}
                      <span className="text-muted">
                        ({it.sizeMl} ml &times; {it.quantity})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between text-sm font-medium mt-3 pt-3 border-t border-border">
                <span className="text-ink">Total</span>
                <span className="text-ink tabular-nums">
                  {formatMoney(order.totalKobo)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}