import { ClerkProvider, SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export const metadata = {
  title: "Sign in — Maison Eko",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <ClerkProvider>
      <div className="mx-auto max-w-md px-4 py-16 md:py-24">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl text-ink">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-muted">
            Admin access only. This page is not part of the customer store.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="text-center text-sm text-muted py-8">
              Loading sign-in...
            </div>
          }
        >
          <SignIn />
        </Suspense>
      </div>
    </ClerkProvider>
  );
}