"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateOrderStatusAction } from "@/server/admin-order-actions";
import { allowedTransitionsFrom } from "@/lib/order";
import type { OrderStatus } from "@/lib/types";

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
};

export function OrderStatusForm({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = allowedTransitionsFrom(currentStatus);

  async function handleUpdate(nextStatus: OrderStatus) {
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await updateOrderStatusAction({ orderId, nextStatus });
    setPending(false);

    if (result.ok) {
      router.refresh();
    } else {
      if (result.error === "stale") {
        setError("This order was updated by another admin. Refresh the page.");
      } else if (result.error === "invalid_transition") {
        setError("This status transition is not allowed.");
      } else {
        setError(`Error: ${result.error}`);
      }
    }
  }

  if (allowed.length === 0) {
    return (
      <p className="text-sm text-muted italic">
        No further status changes are available from <strong className="text-ink">{currentStatus}</strong>.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="bg-danger/10 border border-danger text-danger p-3 rounded-control text-sm">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {allowed.map((nextStatus) => (
          <button
            key={nextStatus}
            type="button"
            onClick={() => handleUpdate(nextStatus)}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 min-h-11 rounded-control bg-ink px-4 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-50 capitalize"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Mark as {nextStatus}
          </button>
        ))}
      </div>
    </div>
  );
}