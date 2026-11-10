import { z } from "zod";
import { normalizePhone } from "./phone";
import { MAX_QUANTITY_PER_LINE } from "./order";

export const MAX_UNIT_PRICE_KOBO = 10_000_000;

// ─── Phone ───────────────────────────────────────────────────────────────

const phoneField = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .refine(
    (v) => {
      try {
        normalizePhone(v);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Enter a valid Nigerian phone number." },
  )
  .transform((v) => normalizePhone(v));

// ─── Cart ────────────────────────────────────────────────────────────────

export const cartLineSchema = z.object({
  variantId: z.string().min(1).max(64),
  quantity: z
    .number()
    .int()
    .min(1)
    .max(MAX_QUANTITY_PER_LINE),
});

export const cartSubmissionSchema = z.object({
  lines: z
    .array(cartLineSchema)
    .min(1, "Your cart is empty.")
    .max(10, "Too many different items in one order."),
});

export type CartSubmission = z.infer<typeof cartSubmissionSchema>;

// ─── Checkout form ──────────────────────────────────────────────────────

export const checkoutFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(100, "Name is too long."),
    phone: phoneField,
    streetAddress: z
      .string()
      .trim()
      .min(5, "Street address is too short.")
      .max(200, "Street address is too long."),
    area: z
      .string()
      .trim()
      .min(2, "Area or city is too short.")
      .max(100, "Area or city is too long."),
    state: z
      .string()
      .trim()
      .min(2, "State is required.")
      .max(50, "State is too long.")
      .default("Lagos"),
    note: z.string().trim().max(500, "Delivery note is too long.").optional(),
  })
  .transform((v) => ({
    name: v.name,
    phone: v.phone,
    address: `${v.streetAddress}, ${v.area}, ${v.state}`,
    note: v.note && v.note.length > 0 ? v.note : null,
  }));

export type CheckoutForm = z.infer<typeof checkoutFormSchema>;

// ─── Tracking lookup ────────────────────────────────────────────────────

export const trackingLookupSchema = z.object({
  orderNumber: z.string().trim().min(1).max(32),
  phone: z.string().trim().min(1).max(32),
});

export type TrackingLookup = z.infer<typeof trackingLookupSchema>;