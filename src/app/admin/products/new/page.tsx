import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = {
  title: "New Product — Admin",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  const auth = await requireAdmin();
  if (auth.status === "unauthenticated") redirect("/sign-in");
  if (auth.status !== "ok") return null;

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/products" className="text-sm text-muted hover:text-ink mb-4 inline-block">
          &larr; Back to products
        </Link>
        <h1 className="font-display text-3xl text-ink">New Product</h1>
        <p className="text-sm text-muted mt-2">
          Products are created inactive. You must add at least one variant before they can be activated.
        </p>
      </div>
      <ProductForm />
    </div>
  );
}