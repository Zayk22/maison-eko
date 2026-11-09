"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function SortSelect({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value === "featured") {
      params.delete("sort");
    } else {
      params.set("sort", e.target.value);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <label htmlFor="sort-select" className="text-sm text-muted">
        Sort by:
      </label>
      <select
        id="sort-select"
        defaultValue={defaultValue}
        onChange={handleChange}
        className="w-full sm:w-56 min-h-11 rounded-control border border-border bg-surface px-3 pr-9 text-base sm:text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <option value="featured">Featured</option>
        <option value="price-asc">Price low to high</option>
        <option value="price-desc">Price high to low</option>
      </select>
    </div>
  );
}