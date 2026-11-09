import { CheckoutForm } from "@/components/checkout/checkout-form";

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 md:px-8 py-12 md:py-16">
      <h1 className="font-display text-3xl md:text-5xl text-ink mb-2">
        Checkout
      </h1>
      <p className="text-sm text-muted mb-8">
        Enter your details. Prices are calculated on the server.
      </p>
      <CheckoutForm />
    </div>
  );
}