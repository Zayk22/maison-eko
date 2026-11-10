/**
 * Convert a human-readable name into a URL-safe slug.
 *
 * Rules, in order:
 * - Trim leading and trailing whitespace.
 * - Lowercase.
 * - Strip diacritics (é -> e, ñ -> n, ç -> c).
 * - Convert "&" to " and " before the character pass.
 * - Replace any run of non-[a-z0-9] characters with a single dash.
 * - Trim leading and trailing dashes.
 *
 * Empty input returns empty string. The caller decides whether to reject
 * it; the product schema rejects slugs shorter than 2 characters when
 * a slug is provided.
 */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}