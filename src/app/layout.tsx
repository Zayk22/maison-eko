import type { Metadata } from "next";
import { fraunces, instrumentSans } from "./fonts";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Maison Eko",
    template: "%s | Maison Eko",
  },
  description: "A demo perfume house in Lagos. No real orders are fulfilled.",
  openGraph: {
    siteName: "Maison Eko",
    type: "website",
    locale: "en_NG",
    title: "Maison Eko",
    description: "A demo perfume house in Lagos. No real orders are fulfilled.",
  },
  twitter: {
    card: "summary",
    title: "Maison Eko",
    description: "A demo perfume house in Lagos. No real orders are fulfilled.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrumentSans.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-bg text-ink font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-control focus:bg-ink focus:px-4 focus:text-bg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}