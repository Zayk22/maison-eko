import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Maison Eko",
  description: "A demo perfume house in Lagos. Portfolio project.",
};

export default function ContactPage() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const hasWhatsApp = whatsapp && whatsapp.trim().length > 0;
  const url = hasWhatsApp
    ? `https://wa.me/${whatsapp.trim()}`
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-8 py-16 md:py-24 space-y-6">
      <h1 className="font-display text-3xl md:text-5xl text-ink mb-8">
        Contact
      </h1>

      <p className="text-base text-muted leading-relaxed">
        This is a demo store. There is no live customer service, no
        fulfillment team, and no one monitoring the inbox. If you are
        interested in the project behind Maison Eko, the best place to
        look is the source code linked from the About page.
      </p>

      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center min-h-11 rounded-control bg-ink px-6 text-sm font-medium text-bg hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Send a WhatsApp message
        </a>
      ) : (
        <p className="text-sm text-muted">
          WhatsApp is not configured for this demo.
        </p>
      )}
    </div>
  );
}