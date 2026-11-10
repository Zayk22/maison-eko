"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  createProductAction,
  updateProductAction,
} from "@/server/admin-product-actions";
import { SCENT_FAMILIES, type ScentFamily } from "@/lib/types";
import type { ProductWithVariants } from "@/server/queries";

const inputBase =
  "w-full min-h-11 rounded-control border border-border-strong bg-surface px-3 text-base text-ink " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

const labelBase = "block text-sm font-medium text-ink mb-1";

const SCENT_GROUP: ScentFamily[] = [
  "amber", "aquatic", "floral", "fresh", "gourmand", "green",
  "powdery", "spicy", "sweet", "warm", "woody"
];
const WHEN_GROUP: ScentFamily[] = ["day", "evening", "anytime"];

type Props = {
  initialData?: ProductWithVariants;
};

export function ProductForm({ initialData }: Props) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [selectedTags, setSelectedTags] = useState<ScentFamily[]>(
    (initialData?.scentFamilyTags as ScentFamily[]) ?? []
  );

  function toggleTag(tag: ScentFamily) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    setFieldErrors({});

    const fd = new FormData(e.currentTarget);
    const topNotes = (fd.get("topNotes") as string).split("\n").map(s => s.trim()).filter(Boolean);
    const heartNotes = (fd.get("heartNotes") as string).split("\n").map(s => s.trim()).filter(Boolean);
    const baseNotes = (fd.get("baseNotes") as string).split("\n").map(s => s.trim()).filter(Boolean);

    const basePayload = {
      name: fd.get("name") as string,
      description: fd.get("description") as string,
      accentHex: fd.get("accentHex") as string,
      pyramid: { top: topNotes, heart: heartNotes, base: baseNotes },
      scentFamilyTags: selectedTags,
    };

    if (isEdit && initialData) {
      const result = await updateProductAction({
        ...basePayload,
        id: initialData.id,
      });
      setPending(false);
      if (result.ok) {
        router.push("/admin/products");
      } else {
        setError(`Error: ${result.error}`);
      }
    } else {
      const slug = (fd.get("slug") as string).trim() || undefined;
      const result = await createProductAction({ ...basePayload, slug });
      setPending(false);
      if (result.ok) {
        router.push("/admin/products");
      } else {
        if (result.error === "slug_taken") {
          setFieldErrors({ slug: "This slug is already taken." });
        } else if (result.error === "invalid_slug") {
          setFieldErrors({ slug: "Could not generate a valid slug." });
        } else if (result.error === "invalid_input") {
          setError("Please check all fields and ensure at least one tag and a valid hex colour are provided.");
        } else {
          setError(`Error: ${result.error}`);
        }
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 max-w-2xl">
      {error && (
        <div role="alert" className="bg-danger/10 border border-danger text-danger p-4 rounded-control">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className={labelBase}>Name</label>
          <input id="name" name="name" type="text" required defaultValue={initialData?.name} className={inputBase} />
        </div>
        <div>
          <label htmlFor="slug" className={labelBase}>Slug {!isEdit && "(optional)"}</label>
          <input
            id="slug"
            name="slug"
            type="text"
            placeholder={isEdit ? undefined : "auto-generated"}
            defaultValue={initialData?.slug}
            disabled={isEdit}
            className={inputBase}
          />
          {fieldErrors.slug && <p className="text-sm text-danger mt-1">{fieldErrors.slug}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelBase}>Description</label>
        <textarea id="description" name="description" rows={4} required defaultValue={initialData?.description} className={inputBase + " py-2 min-h-[88px]"} />
      </div>

      <div>
        <label htmlFor="accentHex" className={labelBase}>Accent Hex (e.g. #B8691F)</label>
        <input id="accentHex" name="accentHex" type="text" required pattern="^#[0-9a-fA-F]{6}$" placeholder="#B8691F" defaultValue={initialData?.accentHex} className={inputBase} />
      </div>

      <fieldset>
        <legend className={labelBase}>Scent Notes (one per line)</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="topNotes" className="text-xs text-muted">Top</label>
            <textarea id="topNotes" name="topNotes" rows={4} required defaultValue={initialData?.pyramid.top.join("\n")} className={inputBase + " py-2"} />
          </div>
          <div>
            <label htmlFor="heartNotes" className="text-xs text-muted">Heart</label>
            <textarea id="heartNotes" name="heartNotes" rows={4} required defaultValue={initialData?.pyramid.heart.join("\n")} className={inputBase + " py-2"} />
          </div>
          <div>
            <label htmlFor="baseNotes" className="text-xs text-muted">Base</label>
            <textarea id="baseNotes" name="baseNotes" rows={4} required defaultValue={initialData?.pyramid.base.join("\n")} className={inputBase + " py-2"} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className={labelBase}>Tags</legend>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted mb-2">Scent</p>
            <div className="flex flex-wrap gap-2">
              {SCENT_GROUP.map(tag => (
                <label key={tag} className="inline-flex items-center gap-2 text-sm capitalize cursor-pointer">
                  <input type="checkbox" checked={selectedTags.includes(tag)} onChange={() => toggleTag(tag)} className="rounded border-border-strong h-4 w-4" />
                  {tag}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted mb-2">When</p>
            <div className="flex flex-wrap gap-2">
              {WHEN_GROUP.map(tag => (
                <label key={tag} className="inline-flex items-center gap-2 text-sm capitalize cursor-pointer">
                  <input type="checkbox" checked={selectedTags.includes(tag)} onChange={() => toggleTag(tag)} className="rounded border-border-strong h-4 w-4" />
                  {tag}
                </label>
              ))}
            </div>
          </div>
        </div>
      </fieldset>

      <div className="pt-4 border-t border-border">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 min-h-11 rounded-control bg-ink px-8 text-sm font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : (isEdit ? "Update Product" : "Save Product")}
        </button>
      </div>
    </form>
  );
}