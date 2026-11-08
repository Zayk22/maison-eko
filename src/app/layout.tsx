import type { Metadata } from "next";
import { fraunces, instrumentSans } from "./fonts";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { DemoNotice } from "@/components/ui/demo-notice";
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
        <DemoNotice />
        <Nav />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}