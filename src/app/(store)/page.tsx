import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Maison Eko",
  description: "A demo perfume house in Lagos. Portfolio project.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 md:px-8 py-16 md:py-24 space-y-6">
      <h1 className="font-display text-3xl md:text-5xl text-ink mb-8">
        About Maison Eko
      </h1>

      <p className="text-base text-muted leading-relaxed">
        Maison Eko is a fictional demo perfume house, built as a portfolio
        project. The fragrances, the store, and the order flow are
        demonstrations of a working full-stack storefront, not a real
        business.
      </p>

      <p className="text-base text-muted leading-relaxed">
        The collection is set in Lagos and draws on what the city already
        gives: the harmattan that turns the light hazy, the lagoon at first
        light, and the long evenings that start with a first cup and end
        quietly. Each fragrance is original and does not reference any real
        brand or perfume.
      </p>

      <p className="text-base text-muted leading-relaxed">
        This is a portfolio project. No real orders are fulfilled. All bank
        details on the confirmation page are demo-only and any account
        number shown there does not belong to a real account. The
        fragrances are fictional.
      </p>
    </div>
  );
}