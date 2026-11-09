"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { createOrder } from "@/server/order-actions";

const inputBase =
  "w-full min-h-11 rounded-control border border-border-strong bg-surface px-3 text-base text-ink " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const labelBase = "block text-sm font-medium text-ink mb-1";

const errorBase = "text-sm text-danger mt-1";

export function CheckoutForm() {
  const { lines, clear } = useCart();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (generalError && summaryRef.current) {
      summaryRef.current.focus();
    }
  }, [generalError]);

  if (lines.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted mb-4">Your cart is empty.</p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center min-h-11 rounded-control bg-ink px-6 text-sm font-medium text-bg hover:opacity-90 transition-opacity"
        >
          Browse the collection
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setErrors({});
    setGeneralError(null);

    const formData = new FormData(e.currentTarget);
    const fields = {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      streetAddress: String(formData.get("streetAddress") ?? ""),
      area: String(formData.get("area") ?? ""),
      state: String(formData.get("state") ?? "Lagos"),
      note: String(formData.get("note") ?? ""),
    };

    try {
      const result = await createOrder({ fields, lines });
      if (result.ok) {
        clear();
        router.push(`/checkout/confirmation/${result.orderNumber}`);
        return;
      }
      if (result.reason === "invalid_input") {
        setErrors(result.fieldErrors);
        setGeneralError("Please correct the errors below.");
      } else if (result.reason === "insufficient_stock") {
        const detail = result.conflicts
          .map(
            (c) =>
              `${c.variantId}: requested ${c.requested}, available ${c.available}`,
          )
          .join("; ");
        setGeneralError(
          `Some items are no longer available in the requested quantity. ${detail}`,
        );
      } else if (result.reason === "rate_limited") {
        setGeneralError(
          "Too many attempts. Please wait a few minutes and try again.",
        );
      } else if (result.reason === "retry_exhausted") {
        setGeneralError(
          "We could not complete your order. Please try again.",
        );
      } else {
        setGeneralError("An unexpected error occurred. Please try again.");
      }
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {generalError && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="bg-danger/10 border border-danger text-danger p-4 rounded-control mb-6 outline-none"
        >
          <p className="font-medium">{generalError}</p>
          {Object.keys(errors).length > 0 && (
            <ul className="mt-2 text-sm list-disc list-inside">
              {Object.entries(errors).flatMap(([field, msgs]) =>
                msgs.map((msg, i) => (
                  <li key={`${field}-${i}`}>
                    {field}: {msg}
                  </li>
                )),
              )}
            </ul>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className={labelBase}>
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className={inputBase}
          />
          {errors.name && <p className={errorBase}>{errors.name[0]}</p>}
        </div>

        <div>
          <label htmlFor="phone" className={labelBase}>
            Phone
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
          {errors.phone && <p className={errorBase}>{errors.phone[0]}</p>}
        </div>

        <div>
          <label htmlFor="streetAddress" className={labelBase}>
            Street address
          </label>
          <input
            id="streetAddress"
            name="streetAddress"
            type="text"
            autoComplete="street-address"
            required
            className={inputBase}
          />
          {errors.streetAddress && (
            <p className={errorBase}>{errors.streetAddress[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="area" className={labelBase}>
              Area or city
            </label>
            <input
              id="area"
              name="area"
              type="text"
              autoComplete="address-level2"
              required
              className={inputBase}
            />
            {errors.area && <p className={errorBase}>{errors.area[0]}</p>}
          </div>
          <div>
            <label htmlFor="state" className={labelBase}>
              State
            </label>
            <input
              id="state"
              name="state"
              type="text"
              autoComplete="address-level1"
              defaultValue="Lagos"
              required
              className={inputBase}
            />
            {errors.state && <p className={errorBase}>{errors.state[0]}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="note" className={labelBase}>
            Delivery note (optional)
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            maxLength={500}
            className={inputBase + " min-h-[88px] py-2 resize-y"}
          />
          {errors.note && <p className={errorBase}>{errors.note[0]}</p>}
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 min-h-11 rounded-control bg-ink px-6 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Placing order...
            </>
          ) : (
            "Place order"
          )}
        </button>
      </div>

      <p className="mt-4 text-xs text-muted">
        Demo store. No real orders are fulfilled. The bank details on the
        confirmation page are for demonstration only.
      </p>
    </form>
  );
}