import type { Metadata } from "next";
import { TrackForm } from "@/components/track-order/track-form";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Look up a Maison Eko order with your order number and phone.",
  robots: { index: false, follow: false },
};

export default function TrackOrderPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 md:px-8 py-12 md:py-16">
      <h1 className="font-display text-3xl md:text-5xl text-ink mb-3">
        Track your order
      </h1>
      <p className="text-sm text-muted mb-8">
        Enter the order number from your confirmation page and the phone
        number you used at checkout.
      </p>
      <TrackForm />
    </div>
  );
}