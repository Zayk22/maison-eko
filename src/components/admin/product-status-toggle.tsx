"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setProductActiveAction } from "@/server/admin-product-actions";

type Props = {
  productId: string;
  active: boolean;
};

export function ProductStatusToggle({ productId, active }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setPending(true);
    setError(null);
    const result = await setProductActiveAction(productId, !active);
    setPending(false);

    if (result.ok) {
      router.refresh();
    } else {
      if (result.error === "no_variants") {
        setError("Cannot activate: Add at least one variant first.");
      } else {
        setError(`Error: ${result.error}`);
      }
    }
  }

  return (
    <div className="flex items-center gap-4">
      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${active ? "bg-success/10 text-success" : "bg-border/50 text-muted"}`}>
        {active ? "Active" : "Inactive"}
      </span>
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:underline underline-offset-4 decoration-accent disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {active ? "Deactivate" : "Activate"}
      </button>
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
}