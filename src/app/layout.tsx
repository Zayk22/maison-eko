import type { Metadata } from "next";
import { fraunces, instrumentSans } from "./fonts";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { DemoNotice } from "@/components/ui/demo-notice";
import { CartProvider } from "@/components/cart/cart-context";
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
      <body className="flex min-h-screen flex-col bg-bg text-ink font-sans antialiased">
        <CartProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-control focus:bg-ink focus:px-4 focus:text-bg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
          >
            Skip to content
          </a>
          <DemoNotice />
          <Nav />
          <main id="main-content" className="flex-grow">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}