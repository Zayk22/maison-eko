# Maison Eko — Project State

## Status
Batch 2.4b accepted (pending commit). Batch 2.5 in review. Next: 3.1 (Drizzle schema).

## Deploy
- GitHub: https://github.com/Zayk22/maison-eko (private, main)
- Vercel: https://maison-eko.vercel.app/ (auto-deploys on push to main)

## Verified environment (measured, 2026-11-08)
- Node 24.14.0, npm 11.9.0, PowerShell 5.1.19041.6456
- Next.js 16.4.5, React 19.3.0
- TypeScript 5.9.3, Vitest 5.1.0, Vite 8.3.6
- @types/node 24.19.2
- drizzle-orm 0.45.4, drizzle-kit 0.31.11
- Clerk @clerk/nextjs 7.9.25, motion 14.10.1, zod 4.6.7, lucide-react 1.70.0, @radix-ui/react-dialog 1.3.1
- Tailwind CSS 4.3.5 (via @tailwindcss/postcss)

## Decisions locked (from architect answers 1-15)
1. Flat shipping: 350000 kobo, one constant (`FLAT_SHIPPING_KOBO` in `src/lib/money.ts`). Shipping is zero on an empty cart.
2. Cancel allowed from pending, confirmed, paid. Every status update is conditional on current status inside the same transaction, so restock happens at most once.
3. Rate limiter: Postgres table. Counter write outside the order transaction. IP primary, phone secondary. Tracking also limited per order number. Old rows cleaned up. Dev fallback when x-real-ip is absent. Fail closed for order creation, fail open for tracking.
4. Scroll story pins only at min-width 768px; below that, stacked whileInView sections. svh/dvh only. No sticky ancestor with overflow hidden.
5. Sub-batches allowed; four-file cap still applies.
6. Scent finder: no strength column in DB. Intensity 1-3 in scoring config only. Mood option E keeps three tags. Test asserts every fragrance wins at least one of 54 combinations.
7. No image upload in admin v1.
8. Clerk: email code and Google, dashboard-only configuration.
9. OG image: public/og-image.png, 1200x630.
10. Playwright teardown deletes test order, items and events, restores stock, refuses when NODE_ENV=production.
11. On 23505 for order_number, retry the whole transaction. Merge duplicate variantIds before processing.
12. Confirmation page: order number, items, total, bank details only. Tracking returns the same generic error for wrong order number and wrong phone.
13. Money parsing works on the decimal string manually; no floats. Order numbers use crypto.randomInt.
14. README notes that per-order-number tracking limits can temporarily lock out the real customer.
15. Page transitions: enter-only via template.tsx. No AnimatePresence exit. Under 250 ms.
16. Contrast script reads the same token source as the CSS; runner is tsx. Script parses @theme from globals.css at runtime.
17. Colocated pure-function tests required for Zod schemas, stock reservation decisions, tracking verification, rate limiter counting, restock-on-cancel.

## Accent contrast rule (locked)
Accent (`--color-accent` `#B4532A`) is allowed only for borders, icons, underlines and focus rings. Never used for text on `bg` or `surface`. Measured: accent on bg 4.36. Nav and footer link hover: ink text plus ember underline; same on `:focus-visible`.

## Tinted wash (approved 2026-11-08)
`CHOSEN_TINT_PERCENT = 10` in `src/lib/color.ts`. At 10%, for all eight fragrances, ink on the tinted wash clears 5.0:1 and composited muted clears 4.5:1. Binding condition at 15% is muted >= 4.5. Page-background washes use 10%. Raw fragrance colour reserved for bottle fills, swatches and large display type.

Open decision for Batch 8: a stronger wash (up to 60%) using ink-only text for the scent story scroll. Not built, not approved.

## Bundle boundary (2026-11-08)
`src/lib/color.ts` does not import `src/data/seed-data.ts`. Client components that use `readableOn` or `tintWash` ship only the colour maths, not the eight descriptions. `src/lib/color.test.ts` and `scripts/check-contrast.ts` derive their own `{ name, hex }` view from `seed-data.ts`.

## Scent finder scoring
- Mood: +3 per matched tag, capped at +6.
- Moment: exact +2; `anytime` fragrance +1 when user picks `day`/`evening`; user picking `anytime` gives +2 to an `anytime` fragrance, else 0.
- Strength: exact +4, one step away +1, two steps away 0.
- Tie-break: higher score, then earlier position in `SEED_FRAGRANCES`, then alphabetical slug.
- Runner-up: always defined when there are >= 2 fragrances; never equal to best match.
- Every fragrance must win at least one of the 54 combinations; the test enforces it.

## Approved fragrance descriptions (2.4b)
- Eko Nights: "Cardamom and bergamot open into incense and rose, then settle slowly into amber, vanilla and tonka. Warm, slow and made for after dark."
- Harmattan: "Two peppers and saffron over cedarwood and vetiver, with a dry leather finish. It carries the dusty warmth of harmattan season, when the light turns hazy and the mornings run cool."
- Lagoon, Adire, Palm Wine, Iroko, First Rain: approved as written in Batch 2.4.
- Night Bloom: "Pear and lychee above tuberose and jasmine sambac, held together by white musk and sandalwood. Creamy, lush and unmistakable."
No seeding until Batch 3.2.

## Border finding (open, before Batch 5)
`--color-border` is `rgba(27, 20, 16, 0.1)`. Measured contrast against `bg` is 1.23:1. Fails 3:1 for form fields. Decide stronger border before Batch 5.

## Test counts (from accepted runs, not predicted)
- Batch 1.4c `color.test.ts`: 19 passed (19).
- Batch 2.1 `money.test.ts` + `phone.test.ts`: 20 passed (20), 2 files.
- Batch 2.2 `order-number.test.ts`: 10 passed (10), 1 file.
- Batch 2.3 `order.test.ts` + `stock.test.ts`: 65 passed (65), 2 files.
- Batch 2.4b `color.test.ts`: 19 passed (19). `check:contrast` exit 0, chosen 10%, binding at 15% muted >= 4.5.
- Batch 2.5 `scent-finder.test.ts`: counts pending next run.

## Files complete
- `tsconfig.json`, `vitest.config.mts`, `.env.example`, `.gitignore`
- `next.config.ts`, `globals.css`, `fonts.ts`, `postcss.config.mjs`
- `src/app/layout.tsx`, `src/components/layout/nav.tsx`, `src/components/layout/footer.tsx`
- `src/components/ui/demo-notice.tsx`
- `src/lib/color.ts`, `color.test.ts` (19 active tests, no seed-data import)
- `src/lib/money.ts`, `money.test.ts`
- `src/lib/phone.ts`, `phone.test.ts`
- `src/lib/order-number.ts`, `order-number.test.ts`
- `src/lib/order.ts`, `order.test.ts`
- `src/lib/stock.ts`, `stock.test.ts`
- `src/lib/types.ts`
- `src/lib/scent-config.ts` (questions, options, intensity map)
- `src/lib/scent-finder.ts` (pure scoring, deterministic tie-break)
- `src/lib/scent-finder.test.ts` (counts pending next run)
- `src/data/seed-data.ts` (8 fragrances; descriptions approved)
- `scripts/check-contrast.ts` (derives its own seed view)

## Next batch
3.1 — `src/server/schema.ts` (Drizzle schema for stores, products, product_variants, orders, order_items, order_events, rate_limits) and `drizzle.config.ts`. Four files including a PROJECT_STATE update in the following batch.