# Maison Eko — Project State

## Status
Batch 3.1b in review (migration regenerated, not applied). Next: review new SQL, then 3.2 (seed script and db:migrate).

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
- dotenv installed as dev dependency for drizzle.config.ts

## Connection strings (verified 2026-11-09)
- `DATABASE_URL`: pooled Neon string (hostname includes `-pooler`). Used by the app via the WebSocket Pool.
- `DATABASE_URL_UNPOOLED`: direct Neon string (no `-pooler`). Used by Drizzle Kit.
- Neon's Drizzle guide states that a pooled string can cause migration errors; use a direct connection for Drizzle Kit.
- `drizzle.config.ts` loads `.env.local` with `dotenv` and refuses to run if `DATABASE_URL_UNPOOLED` is missing.

## Schema decisions (3.1b)
- `order_status` is a pgEnum with six values: pending, confirmed, paid, shipped, delivered, cancelled.
- Kobo columns are `integer` with `CHECK >= 0`.
- `orders.order_number` has a UNIQUE index.
- `rate_limits` has `key` (primary key), `count`, `reset_at`, and an index on `reset_at`.
- `products` and `orders` carry `store_id`.
- `product_variants` has a unique index on `(product_id, size_ml)`.
- `order_items` snapshots `product_name`, `size_ml`, `unit_price_kobo` and `line_total_kobo`.
- `order_events` records every status change.
- `products.pyramid` is `jsonb` typed as `{ top: string[]; heart: string[]; base: string[] }` via `$type<Pyramid>()`. The runtime contract is `pyramidSchema` in `src/lib/pyramid.ts`.
- `orders` has `CHECK total_kobo = subtotal_kobo + shipping_kobo`.
- `order_items` has `CHECK line_total_kobo = unit_price_kobo * quantity`.
- `updated_at` on `products` and `orders` uses `$onUpdate(() => new Date())`. This runs when the update goes through Drizzle. Raw SQL updates bypass it; any raw update must set `updated_at` explicitly.

## Integer overflow rule (3.1b)
Postgres `integer` max is 2,147,483,647. In kobo that is 21,474,836.47 naira. The order Zod schema caps:
- quantity per line: 10
- number of lines: 10
- unit price: 10,000,000 kobo (100,000 naira) as a sanity ceiling

Worst-case subtotal under those caps: 10 lines x 10 qty x 10,000,000 kobo = 1,000,000,000 kobo (10,000,000 naira), below the 2,147,483,647 limit. Shipping adds 350,000 kobo. Total stays under 1,000,350,000 kobo. The database check `total_consistent` and `line_total_consistent` enforce the arithmetic; the Zod caps prevent the arithmetic from ever approaching overflow.

## Admin deletion rule (3.1b)
Products that have `order_items` must be deactivated (`active = false`), never hard-deleted. The `order_items.variant_id` foreign key uses `ON DELETE restrict`, so a hard delete would fail anyway. Admin UI will surface deactivate, not delete.

## Decisions locked (from architect answers 1-15)
1. Flat shipping: 350000 kobo. Zero on empty cart.
2. Cancel allowed from pending, confirmed, paid. Conditional on current status in the same transaction.
3. Rate limiter: Postgres table. Counter write outside the order transaction. IP primary, phone secondary. Tracking limited per order number. Cleanup of old rows. Dev fallback when x-real-ip is absent. Fail closed for order creation, fail open for tracking.
4. Scroll story pins only at min-width 768px.
5. Sub-batches allowed; four-file cap.
6. Scent finder: intensity in config only. Mood E keeps three tags. Every fragrance wins at least one of 54 combinations.
7. No image upload in admin v1.
8. Clerk: email code and Google.
9. OG image: public/og-image.png, 1200x630.
10. Playwright teardown deletes test order and restores stock; refuses when NODE_ENV=production.
11. On 23505 for order_number, retry the whole transaction. Merge duplicate variantIds.
12. Confirmation page: order number, items, total, bank details only. Tracking returns the same generic error for wrong order number and wrong phone.
13. Money parsing works on the decimal string manually. Order numbers use crypto.randomInt.
14. README notes that per-order-number tracking limits can temporarily lock out the real customer.
15. Page transitions: enter-only via template.tsx. Under 250 ms.
16. Contrast script reads the same token source as the CSS.
17. Colocated pure-function tests required for Zod schemas, stock reservation decisions, tracking verification, rate limiter counting, restock-on-cancel.

## Accent and tint (locked)
Accent is allowed only for borders, icons, underlines and focus rings. Never text on bg or surface.
`CHOSEN_TINT_PERCENT = 10`. At 10%, ink clears 5.0:1 and muted clears 4.5:1 for all eight fragrances. Binding condition at 15% is muted >= 4.5.

## Scent finder scoring (2.5)
Mood +3 per matched tag capped at +6. Moment exact +2; anytime fragrance +1 for day/evening. Strength exact +4, one step away +1. Tie-break by score, then seed position, then slug.

## Border finding (open, before Batch 5)
`--color-border` is `rgba(27, 20, 16, 0.1)`, contrast against `bg` is 1.23:1. Fails 3:1 for form fields. Decide stronger border before Batch 5.

## npm audit (open)
12 moderate warnings are present. Package names and whether each is dev-only or runtime have not been identified. `npm audit` output has not been pasted. Do not run `npm audit fix --force`. `npm audit` will be run and the output reviewed before any remediation decision.

## Test counts (from accepted runs, not predicted)
- Batch 1.4c `color.test.ts`: 19 passed (19).
- Batch 2.1 `money.test.ts` + `phone.test.ts`: 20 passed (20), 2 files.
- Batch 2.2 `order-number.test.ts`: 10 passed (10), 1 file.
- Batch 2.3 `order.test.ts` + `stock.test.ts`: 65 passed (65), 2 files.
- Batch 2.5 `scent-finder.test.ts`: 7 passed (7), 1 file.
- Batch 3.1b counts pending next run.

## Files complete
- `tsconfig.json`, `vitest.config.mts`, `.env.example`, `.gitignore`
- `next.config.ts`, `globals.css`, `fonts.ts`, `postcss.config.mjs`
- `src/app/layout.tsx`, `src/components/layout/nav.tsx`, `src/components/layout/footer.tsx`
- `src/components/ui/demo-notice.tsx`
- `src/lib/color.ts`, `color.test.ts`
- `src/lib/money.ts`, `money.test.ts`
- `src/lib/phone.ts`, `phone.test.ts`
- `src/lib/order-number.ts`, `order-number.test.ts`
- `src/lib/order.ts`, `order.test.ts`
- `src/lib/stock.ts`, `stock.test.ts`
- `src/lib/types.ts`
- `src/lib/scent-config.ts`, `scent-finder.ts`, `scent-finder.test.ts`
- `src/lib/pyramid.ts` (Zod schema and type)
- `src/data/seed-data.ts`
- `src/server/schema.ts` (jsonb pyramid, cross-column checks, $onUpdate)
- `src/server/db.ts` (WebSocket Pool, Node runtime)
- `drizzle.config.ts` (loads .env.local, requires DATABASE_URL_UNPOOLED)
- `scripts/check-contrast.ts`

## Next batch
3.2 — seed script (`src/data/seed.ts`) that loads `.env.local` via `dotenv/config` before importing `db.ts`, inserts the one store row, upserts products by slug and variants by `(product_id, size_ml)`, and does not overwrite stock on existing variants. No migration or seed run until the regenerated SQL is approved.