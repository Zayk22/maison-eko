import { z } from "zod";
import { SCENT_FAMILIES } from "./types";
import { pyramidSchema } from "./pyramid";
import {
  BONE,
  INK,
  CHOSEN_TINT_PERCENT,
  parseColor,
  composite,
  contrastRatio,
  tintWash,
} from "./color";

// TODO(6.2b): move MAX_UNIT_PRICE_KOBO to src/lib/schemas.ts (or money.ts)
// when that file is next touched. For now this lives here because this is
// the only file that validates a user-entered price, and moving it there
// would require a fifth file in this batch. Never retype 10_000_000.
export const MAX_UNIT_PRICE_KOBO = 10_000_000;
export const MAX_STOCK = 9999;

// Mirrors --color-muted in src/app/globals.css. If the token changes,
// update this constant so the contrast check stays honest.
const MUTED_RAW = "rgba(27, 20, 16, 0.62)";

function passesAccentContrast(hex: string): boolean {
  let wash: ReturnType<typeof parseColor>;
  try {
    wash = parseColor(tintWash(hex, BONE, CHOSEN_TINT_PERCENT));
  } catch {
    return false;
  }
  const inkRatio = contrastRatio(parseColor(INK), wash);
  if (inkRatio < 5.0) return false;
  const mutedRatio = contrastRatio(
    composite(parseColor(MUTED_RAW), wash),
    wash,
  );
  return mutedRatio >= 4.5;
}

const slugField = z
  .string()
  .trim()
  .max(100, "Slug is too long.")
  .refine(
    (v) => v === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v),
    "Slug must be lowercase letters, digits, and single dashes.",
  );

const accentHexField = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Accent must be a 6-digit hex colour.")
  .refine(
    passesAccentContrast,
    "Accent does not meet contrast requirements on the tinted background.",
  );

const tagsField = z
  .array(z.enum(SCENT_FAMILIES))
  .min(1, "At least one scent tag is required.")
  .max(5, "At most five scent tags.")
  .refine(
    (tags) => new Set(tags).size === tags.length,
    "Duplicate tags are not allowed.",
  );

export const productCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name is too short.")
    .max(100, "Name is too long."),
  // Optional. Empty string (or omitted) means the action derives the slug
  // from the name using slugify(). When provided, the format is enforced.
  slug: slugField.optional(),
  description: z
    .string()
    .trim()
    .min(10, "Description is too short.")
    .max(2000, "Description is too long."),
  pyramid: pyramidSchema,
  scentFamilyTags: tagsField,
  accentHex: accentHexField,
});

export type ProductCreate = z.infer<typeof productCreateSchema>;

// Slug is intentionally absent. It is immutable after creation. Zod's
// default object mode strips unknown keys, so a payload that includes
// `slug` will pass but the value is discarded before it reaches the
// action.
export const productUpdateSchema = z.object({
  id: z.string().uuid("Invalid product id."),
  name: z
    .string()
    .trim()
    .min(2, "Name is too short.")
    .max(100, "Name is too long."),
  description: z
    .string()
    .trim()
    .min(10, "Description is too short.")
    .max(2000, "Description is too long."),
  pyramid: pyramidSchema,
  scentFamilyTags: tagsField,
  accentHex: accentHexField,
});

export type ProductUpdate = z.infer<typeof productUpdateSchema>;

export const variantCreateSchema = z.object({
  productId: z.string().uuid("Invalid product id."),
  sizeMl: z.union([z.literal(30), z.literal(50), z.literal(100)]),
  priceKobo: z
    .number()
    .int("Price must be an integer number of kobo.")
    .min(0, "Price cannot be negative.")
    .max(MAX_UNIT_PRICE_KOBO, "Price exceeds the maximum allowed."),
  stock: z
    .number()
    .int("Stock must be a whole number.")
    .min(0, "Stock cannot be negative.")
    .max(MAX_STOCK, "Stock exceeds the maximum allowed."),
});

export type VariantCreate = z.infer<typeof variantCreateSchema>;

// sizeMl is intentionally absent. It is immutable after creation. To hide
// a size, set stock to 0. Zod strips the field if a payload includes it.
export const variantUpdateSchema = z.object({
  id: z.string().uuid("Invalid variant id."),
  priceKobo: z
    .number()
    .int("Price must be an integer number of kobo.")
    .min(0, "Price cannot be negative.")
    .max(MAX_UNIT_PRICE_KOBO, "Price exceeds the maximum allowed."),
  stock: z
    .number()
    .int("Stock must be a whole number.")
    .min(0, "Stock cannot be negative.")
    .max(MAX_STOCK, "Stock exceeds the maximum allowed."),
});

export type VariantUpdate = z.infer<typeof variantUpdateSchema>;