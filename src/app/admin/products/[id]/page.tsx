import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { getProductById } from "@/server/queries";
import { ProductForm } from "@/components/admin/product-form";
import { ProductStatusToggle } from "@/components/admin/product-status-toggle";
import { VariantList } from "@/components/admin/variant-list";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "Edit Product — Admin",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({ params }: { params: Params }) {
  const auth = await requireAdmin();
  if (auth.status === "unauthenticated") redirect("/sign-in");
  if (auth.status !== "ok") return null;

  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/products" className="text-sm text-muted hover:text-ink mb-4 inline-block">
          &larr; Back to products
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="font-display text-3xl text-ink">Edit {product.name}</h1>
          <ProductStatusToggle productId={product.id} active={product.active} />
        </div>
      </div>

      <ProductForm initialData={product} />
      
      <VariantList productId={product.id} variants={product.variants} />
    </div>
  );
}