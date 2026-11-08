import type { Metadata } from "next";
import { fraunces, instrumentSans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maison Eko",
  description: "A demo perfume house in Lagos. No real orders are fulfilled.",
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
      <body className="bg-bg text-ink font-sans antialiased">
        <div className="border-b border-border bg-surface px-4 py-2 text-center text-xs text-muted">
          Demo store. No real orders are fulfilled.
        </div>
        {children}
      </body>
    </html>
  );
}