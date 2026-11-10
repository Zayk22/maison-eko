import { ClerkProvider, SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import Link from "next/link";

export const metadata = {
  title: "Sign in — Maison Eko",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#1b1410",
          borderRadius: "10px",
          fontFamily: "var(--font-instrument-sans)",
        },
        elements: {
          footerAction: { display: "none" },
        },
      }}
    >
      <div className="min-h-svh flex flex-col items-center justify-center bg-bg px-4 py-8">
        <Link
          href="/"
          className="font-display text-2xl font-medium tracking-tight text-ink mb-8 hover:underline hover:underline-offset-4 hover:decoration-accent"
        >
          Maison Eko
        </Link>
        <Suspense
          fallback={
            <div className="text-center text-sm text-muted py-8">
              Loading sign-in...
            </div>
          }
        >
          <SignIn />
        </Suspense>
        <Link
          href="/"
          className="mt-6 text-sm text-muted hover:text-ink transition-colors"
        >
          Back to store
        </Link>
      </div>
    </ClerkProvider>
  );
}