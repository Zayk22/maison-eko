import type { ScentFamily, SizeMl } from "@/lib/types";

export type SeedVariant = {
  sizeMl: SizeMl;
  priceKobo: number;
  stock: number;
};

export type SeedPyramid = {
  top: readonly string[];
  heart: readonly string[];
  base: readonly string[];
};

export type SeedFragrance = {
  name: string;
  slug: string;
  description: string;
  pyramid: SeedPyramid;
  tags: readonly ScentFamily[];
  accentHex: string;
  active: boolean;
  variants: readonly SeedVariant[];
};

/**
 * The eight fragrance definitions from the brief, translated to integer
 * kobo. Stock is 12 / 20 / 15 for the 30 / 50 / 100 ml variants of every
 * fragrance unless the brief notes otherwise (it does not).
 *
 * This array is the single source of truth for fragrance data. It is
 * imported by src/data/seed.ts (the seeding script), by
 * src/lib/scent-config.ts (fragrance ordering for tie-breaks), and by
 * src/lib/color.test.ts and scripts/check-contrast.ts (which derive a
 * { name, hex } view locally). src/lib/color.ts deliberately does not
 * import this file, so client components using readableOn/tintWash do
 * not ship the descriptions.
 */
export const SEED_FRAGRANCES: readonly SeedFragrance[] = [
  {
    name: "Eko Nights",
    slug: "eko-nights",
    description:
      "Cardamom and bergamot open into incense and rose, then settle slowly into amber, vanilla and tonka. Warm, slow and made for after dark.",
    pyramid: {
      top: ["cardamom", "bergamot"],
      heart: ["incense", "rose"],
      base: ["amber", "vanilla", "tonka"],
    },
    tags: ["warm", "amber", "evening"],
    accentHex: "#B8691F",
    active: true,
    variants: [
      { sizeMl: 30, priceKobo: 3200000, stock: 12 },
      { sizeMl: 50, priceKobo: 4800000, stock: 20 },
      { sizeMl: 100, priceKobo: 7200000, stock: 15 },
    ],
  },
  {
    name: "Harmattan",
    slug: "harmattan",
    description:
      "Two peppers and saffron over cedarwood and vetiver, with a dry leather finish. It carries the dusty warmth of harmattan season, when the light turns hazy and the mornings run cool.",
    pyramid: {
      top: ["black pepper", "pink pepper"],
      heart: ["cedarwood", "saffron"],
      base: ["vetiver", "leather"],
    },
    tags: ["spicy", "woody", "evening"],
    accentHex: "#A8745A",
    active: true,
    variants: [
      { sizeMl: 30, priceKobo: 3000000, stock: 12 },
      { sizeMl: 50, priceKobo: 4500000, stock: 20 },
      { sizeMl: 100, priceKobo: 6800000, stock: 15 },
    ],
  },
  {
    name: "Lagoon",
    slug: "lagoon",
    description:
      "Salt air and grapefruit above jasmine and water lily, drying down to driftwood and white musk. Clear and clean, like standing on a boat at first light.",
    pyramid: {
      top: ["sea salt", "grapefruit"],
      heart: ["jasmine", "water lily"],
      base: ["driftwood", "white musk"],
    },
    tags: ["fresh", "aquatic", "day"],
    accentHex: "#3F8FA6",
    active: true,
    variants: [
      { sizeMl: 30, priceKobo: 2800000, stock: 12 },
      { sizeMl: 50, priceKobo: 4200000, stock: 20 },
      { sizeMl: 100, priceKobo: 6400000, stock: 15 },
    ],
  },
  {
    name: "Adire",
    slug: "adire",
    description:
      "Violet leaf and bergamot over iris and orris root, closed by sandalwood and soft musk. Powdery and composed, the scent of fresh indigo cloth folded in a drawer.",
    pyramid: {
      top: ["violet leaf", "bergamot"],
      heart: ["iris", "orris"],
      base: ["sandalwood", "soft musk"],
    },
    tags: ["floral", "powdery", "day"],
    accentHex: "#3B4A8F",
    active: true,
    variants: [
      { sizeMl: 30, priceKobo: 3000000, stock: 12 },
      { sizeMl: 50, priceKobo: 4500000, stock: 20 },
      { sizeMl: 100, priceKobo: 6800000, stock: 15 },
    ],
  },
  {
    name: "Palm Wine",
    slug: "palm-wine",
    description:
      "Coconut and fig open into a palm-sap accord and jasmine, then rest in tonka and sandalwood. Sweet without being heavy, like the first cup of the evening.",
    pyramid: {
      top: ["coconut", "fig"],
      heart: ["palm sap accord", "jasmine"],
      base: ["tonka", "sandalwood"],
    },
    tags: ["sweet", "gourmand", "anytime"],
    accentHex: "#D9B15B",
    active: true,
    variants: [
      { sizeMl: 30, priceKobo: 2900000, stock: 12 },
      { sizeMl: 50, priceKobo: 4400000, stock: 20 },
      { sizeMl: 100, priceKobo: 6600000, stock: 15 },
    ],
  },
  {
    name: "Iroko",
    slug: "iroko",
    description:
      "Juniper and lemon over cypress and geranium, settling into oakmoss, patchouli and cedar. Green at the edges, deeply woody at the centre, like shade under an old tree.",
    pyramid: {
      top: ["juniper", "lemon"],
      heart: ["cypress", "geranium"],
      base: ["oakmoss", "patchouli", "cedar"],
    },
    tags: ["woody", "fresh", "anytime"],
    accentHex: "#6B6A3A",
    active: true,
    variants: [
      { sizeMl: 30, priceKobo: 3400000, stock: 12 },
      { sizeMl: 50, priceKobo: 5000000, stock: 20 },
      { sizeMl: 100, priceKobo: 7500000, stock: 15 },
    ],
  },
  {
    name: "Night Bloom",
    slug: "night-bloom",
    description:
      "Pear and lychee above tuberose and jasmine sambac, held together by white musk and sandalwood. Creamy, lush and unmistakable.",
    pyramid: {
      top: ["pear", "lychee"],
      heart: ["tuberose", "jasmine sambac"],
      base: ["white musk", "sandalwood"],
    },
    tags: ["floral", "sweet", "evening"],
    accentHex: "#8A4F7D",
    active: true,
    variants: [
      { sizeMl: 30, priceKobo: 3300000, stock: 12 },
      { sizeMl: 50, priceKobo: 4900000, stock: 20 },
      { sizeMl: 100, priceKobo: 7400000, stock: 15 },
    ],
  },
  {
    name: "First Rain",
    slug: "first-rain",
    description:
      "Rain and cut leaves open over iris and geranium, then settle into vetiver and musk. It smells like the first rain on dry earth, before the city has caught up.",
    pyramid: {
      top: ["rain accord", "green leaves"],
      heart: ["iris", "geranium"],
      base: ["vetiver", "musk"],
    },
    tags: ["fresh", "green", "day"],
    accentHex: "#7E9BA3",
    active: true,
    variants: [
      { sizeMl: 30, priceKobo: 2700000, stock: 12 },
      { sizeMl: 50, priceKobo: 4100000, stock: 20 },
      { sizeMl: 100, priceKobo: 6200000, stock: 15 },
    ],
  },
] as const;