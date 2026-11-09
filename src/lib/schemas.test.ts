import { describe, it, expect } from "vitest";
import {
  cartLineSchema,
  cartSubmissionSchema,
  checkoutFormSchema,
  trackingLookupSchema,
} from "./schemas";
import { MAX_QUANTITY_PER_LINE } from "./order";

describe("cartLineSchema", () => {
  it("accepts a valid line", () => {
    const r = cartLineSchema.safeParse({ variantId: "abc", quantity: 2 });
    expect(r.success).toBe(true);
  });

  it("rejects empty variantId", () => {
    const r = cartLineSchema.safeParse({ variantId: "", quantity: 1 });
    expect(r.success).toBe(false);
  });

  it("rejects quantity 0", () => {
    const r = cartLineSchema.safeParse({ variantId: "a", quantity: 0 });
    expect(r.success).toBe(false);
  });

  it("rejects quantity above the shared cap", () => {
    const r = cartLineSchema.safeParse({
      variantId: "a",
      quantity: MAX_QUANTITY_PER_LINE + 1,
    });
    expect(r.success).toBe(false);
  });

  it("rejects non-integer quantity", () => {
    const r = cartLineSchema.safeParse({ variantId: "a", quantity: 1.5 });
    expect(r.success).toBe(false);
  });
});

describe("cartSubmissionSchema", () => {
  it("rejects an empty cart", () => {
    const r = cartSubmissionSchema.safeParse({ lines: [] });
    expect(r.success).toBe(false);
  });

  it("rejects more than 10 lines", () => {
    const lines = Array.from({ length: 11 }, (_, i) => ({
      variantId: `v${i}`,
      quantity: 1,
    }));
    const r = cartSubmissionSchema.safeParse({ lines });
    expect(r.success).toBe(false);
  });

  it("accepts exactly 10 lines", () => {
    const lines = Array.from({ length: 10 }, (_, i) => ({
      variantId: `v${i}`,
      quantity: 1,
    }));
    const r = cartSubmissionSchema.safeParse({ lines });
    expect(r.success).toBe(true);
  });

  it("rejects a single invalid line inside a valid array", () => {
    const r = cartSubmissionSchema.safeParse({
      lines: [
        { variantId: "a", quantity: 1 },
        { variantId: "", quantity: 1 },
      ],
    });
    expect(r.success).toBe(false);
  });
});

describe("checkoutFormSchema", () => {
  const valid = {
    name: "Azeez Ogunbanwo",
    phone: "08012345678",
    streetAddress: "12 Bourdillon Road",
    area: "Ikoyi",
    state: "Lagos",
    note: "Please call before delivery.",
  };

  it("accepts a valid form and normalises the phone", () => {
    const r = checkoutFormSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.phone).toBe("+2348012345678");
    expect(r.data.address).toBe("12 Bourdillon Road, Ikoyi, Lagos");
    expect(r.data.note).toBe("Please call before delivery.");
  });

  it("defaults state to Lagos when omitted", () => {
    const { state, ...rest } = valid;
    const r = checkoutFormSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.address).toBe("12 Bourdillon Road, Ikoyi, Lagos");
  });

  it("converts an empty note to null", () => {
    const r = checkoutFormSchema.safeParse({ ...valid, note: "" });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.note).toBeNull();
  });

  it("converts an omitted note to null", () => {
    const { note, ...rest } = valid;
    const r = checkoutFormSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.note).toBeNull();
  });

  it("rejects a short name", () => {
    const r = checkoutFormSchema.safeParse({ ...valid, name: "A" });
    expect(r.success).toBe(false);
  });

  it("rejects an invalid phone", () => {
    const r = checkoutFormSchema.safeParse({ ...valid, phone: "12345" });
    expect(r.success).toBe(false);
  });

  it("rejects a short street address", () => {
    const r = checkoutFormSchema.safeParse({ ...valid, streetAddress: "12" });
    expect(r.success).toBe(false);
  });

  it("rejects an over-long note", () => {
    const r = checkoutFormSchema.safeParse({
      ...valid,
      note: "x".repeat(501),
    });
    expect(r.success).toBe(false);
  });
});

describe("trackingLookupSchema", () => {
  it("accepts a valid payload", () => {
    const r = trackingLookupSchema.safeParse({
      orderNumber: "ME-ABCDEF",
      phone: "08012345678",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an empty order number", () => {
    const r = trackingLookupSchema.safeParse({ orderNumber: "", phone: "08012345678" });
    expect(r.success).toBe(false);
  });

  it("rejects an empty phone", () => {
    const r = trackingLookupSchema.safeParse({ orderNumber: "ME-ABCDEF", phone: "" });
    expect(r.success).toBe(false);
  });
});