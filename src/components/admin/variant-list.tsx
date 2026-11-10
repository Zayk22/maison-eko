"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Edit2, Trash2, Check, X } from "lucide-react";
import {
  createVariantAction,
  updateVariantAction,
  deleteVariantAction,
} from "@/server/admin-variant-actions";
import { formatMoney } from "@/lib/money";
import type { VariantRow } from "@/server/queries";

const inputBase =
  "w-full min-h-11 rounded-control border border-border-strong bg-surface px-3 text-base text-ink " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

type Props = {
  productId: string;
  variants: VariantRow[];
};

export function VariantList({ productId, variants }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    
    const result = await createVariantAction({
      productId,
      sizeMl: Number(fd.get("sizeMl")),
      priceNaira: fd.get("priceNaira") as string,
      stock: Number(fd.get("stock")),
    });
    
    setPending(false);
    if (result.ok) {
      setIsAdding(false);
      router.refresh();
    } else {
      setError(result.error === "size_taken" ? "This size already exists." : `Error: ${result.error}`);
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    const result = await updateVariantAction({
      id,
      productId,
      priceNaira: fd.get("priceNaira") as string,
      stock: Number(fd.get("stock")),
    });

    setPending(false);
    if (result.ok) {
      setEditingId(null);
      router.refresh();
    } else {
      setError(`Error: ${result.error}`);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this variant?")) return;
    setPending(true);
    setError(null);
    const result = await deleteVariantAction({ id, productId });
    setPending(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error === "variant_has_orders" 
        ? "Cannot delete: This variant has been ordered. Set stock to 0 instead." 
        : `Error: ${result.error}`);
    }
  }

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-ink">Variants</h2>
        {!isAdding && (
          <button
            type="button"
            onClick={() => { setIsAdding(true); setError(null); }}
            className="inline-flex items-center justify-center min-h-11 rounded-control border border-border-strong px-4 text-sm font-medium text-ink hover:border-ink transition-colors"
          >
            Add Variant
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="bg-danger/10 border border-danger text-danger p-4 rounded-control mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-surface border border-border rounded-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg border-b border-border text-muted">
            <tr>
              <th className="p-4 font-medium">Size</th>
              <th className="p-4 font-medium">Price</th>
              <th className="p-4 font-medium">Stock</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {variants.map((v) => {
              const isEditing = editingId === v.id;
              return (
                <tr key={v.id}>
                  <td className="p-4">{v.sizeMl} ml</td>
                  {isEditing ? (
                    <>
                      <td className="p-4">
                        <input name="priceNaira" type="text" defaultValue={(v.priceKobo / 100).toString()} className={inputBase} form={`edit-form-${v.id}`} />
                      </td>
                      <td className="p-4">
                        <input name="stock" type="number" defaultValue={v.stock} className={inputBase} form={`edit-form-${v.id}`} />
                      </td>
                      <td className="p-4 text-right">
                        <form id={`edit-form-${v.id}`} onSubmit={(e) => handleUpdate(e, v.id)} className="inline-flex items-center gap-2">
                          <button type="submit" disabled={pending} className="p-2 text-success hover:bg-success/10 rounded">
                            <Check className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => setEditingId(null)} className="p-2 text-muted hover:bg-border/50 rounded">
                            <X className="h-4 w-4" />
                          </button>
                        </form>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4">{formatMoney(v.priceKobo)}</td>
                      <td className="p-4">{v.stock}</td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => { setEditingId(v.id); setError(null); }}
                            className="p-2 text-ink hover:bg-border/50 rounded"
                            aria-label="Edit variant"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(v.id)}
                            className="p-2 text-danger hover:bg-danger/10 rounded"
                            aria-label="Delete variant"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}

            {isAdding && (
              <tr>
                <td className="p-4">
                  <select name="sizeMl" className={inputBase} form="add-variant-form" required>
                    <option value={30}>30 ml</option>
                    <option value={50}>50 ml</option>
                    <option value={100}>100 ml</option>
                  </select>
                </td>
                <td className="p-4">
                  <input name="priceNaira" type="text" placeholder="e.g. 32000" className={inputBase} form="add-variant-form" required />
                </td>
                <td className="p-4">
                  <input name="stock" type="number" defaultValue={10} className={inputBase} form="add-variant-form" required />
                </td>
                <td className="p-4 text-right">
                  <form id="add-variant-form" onSubmit={handleCreate} className="inline-flex items-center gap-2">
                    <button type="submit" disabled={pending} className="p-2 text-success hover:bg-success/10 rounded">
                      <Check className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setIsAdding(false)} className="p-2 text-muted hover:bg-border/50 rounded">
                      <X className="h-4 w-4" />
                    </button>
                  </form>
                </td>
              </tr>
            )}

            {variants.length === 0 && !isAdding && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted">
                  No variants yet. Add one to make this product available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}