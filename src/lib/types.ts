/**
 * Shared domain contracts. These are the names the rest of the codebase
 * uses for shapes that cross boundaries (cart, order lifecycle, seed
 * data). Database-shaped types (Product, Order, OrderItem, OrderEvent) are
 * inferred from the Drizzle schema in Batch 3, so there is exactly one
 * definition of what a row looks like.
 */

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * All tags a fragrance can carry. The seed data mixes olfactory families
 * (warm, amber, spicy, woody, fresh, aquatic, floral, powdery, sweet,
 * gourmand, green) with occasion tags (evening, day, anytime) in the same
 * field. The shop filter and the scent finder both score against the same
 * set, so one union covers both.
 */
export const SCENT_FAMILIES = [
  "warm",
  "amber",
  "spicy",
  "woody",
  "fresh",
  "aquatic",
  "floral",
  "powdery",
  "sweet",
  "gourmand",
  "green",
  "evening",
  "day",
  "anytime",
] as const;

export type ScentFamily = (typeof SCENT_FAMILIES)[number];

export const SIZE_OPTIONS_ML = [30, 50, 100] as const;
export type SizeMl = (typeof SIZE_OPTIONS_ML)[number];

/**
 * What the cart stores: only a variant identifier and a quantity.
 * Prices are never stored client-side; the server recomputes them from
 * the database during order creation.
 */
export type CartLine = {
  variantId: string;
  quantity: number;
};

/**
 * Structured scent notes for a product, matching the seed data:
 * Top: cardamom, bergamot. Heart: incense, rose. Base: amber, vanilla, tonka.
 */
export type ScentPyramid = {
  top: string[];
  heart: string[];
  base: string[];
};