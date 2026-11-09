# Maison Eko — Project State

## Status
Batch 3.1b complete (migration applied approval). Batch 3.2 in review. Next: db:migrate, db:seed, verification query, then 4.1 (Bottle, cart context).

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
- dotenv as dev dependency (drizzle.config.ts and seed loader)

## Migration applied
- Single file: `drizzle/migrations/0000_absent_santa_claus.sql`
- Seven tables, `order_status` enum with six values, jsonb `pyramid`, cross-column checks, unique indexes, foreign keys. Reviewed and approved.

## Lessons learned
- **Reset an unapplied migration by deleting the whole `drizzle/migrations/` folder, including `meta/`.** Deleting only the `.sql` file leaves the journal and snapshot in place; the next `db:generate` emits a diff against the stale snapshot instead of a fresh baseline, which fails when applied. Recorded here so it is not repeated.

## Connection strings (verified 2026-11-09)
- `DATABASE_URL`: pooled Neon string (hostname includes `-pooler`). App uses it via the WebSocket Pool.
- `DATABASE_URL_UNPOOLED`: direct Neon string. Drizzle Kit uses it.
- `drizzle.config.ts` loads `.env.local` via `dotenv` and refuses to run without `DATABASE_URL_UNPOOLED`.
- `src/data/seed.ts` loads `.env.local` via a side-effect import of `src/data/load-env.ts`, declared before `import { db } from "../server/db"`. ES module evaluation order guarantees the env is loaded before `db.ts` reads `process.env.DATABASE_URL`.

## npm audit decision (accepted, 2026-11-09)
- 12 moderate advisories, all in dev tooling:
  - esbuild via @esbuild-kit, pulled in by drizzle-kit
  - minimatch via typescript-eslint and eslint-config-next
- The suggested fixes downgrade drizzle-kit and eslint-config-next. Those are unacceptable.
- Decision: accept the advisories, re-check at the polish batch (Batch 9).
- No `npm audit fix --force`.
- Must verify drizzle-kit, dotenv, eslint, eslint-config-next are in `devDependencies`. If any of them is in `dependencies`, move it.

## Schema decisions (3.1b)
- `order_status` is a pgEnum with six values.
- Kobo columns are integer with `CHECK >= 0`.
- `orders.order_number` has a UNIQUE index.
- `rate_limits` has `key`, `count`, `reset_at`, and index on `reset_at`.
- `products.pyramid` is jsonb typed as Pyramid via `$type<Pyramid>()`, validated with `pyramidSchema` on seed and on every read via `src/server/queries.ts`.
- Cross-column checks: `orders.total_kobo = subtotal_kobo + shipping_kobo` and `order_items.line_total_kobo = unit_price_kobo * quantity`.
- `updated_at` on `products` and `orders` uses `$onUpdate(() => new Date())`. It fires only on Drizzle-based updates. Raw SQL updates must set `updated_at` explicitly.
- `product_variants` has a unique index on `(product_id, size_ml)`.
- `order_items` snapshots product_name, size_ml, unit_price_kobo, line_total_kobo.
- `order_events` records each status change with a timestamp and optional note.

## Integer overflow rule
Postgres integer max: 2,147,483,647 kobo (21,474,836.47 naira). The order Zod schema caps:
- quantity per line: 10
- number of lines: 10
- unit price ceiling: 10,000,000 kobo (100,000 naira)
Worst-case subtotal: 1,000,000,000 kobo, safely below the limit.

The admin product Zod schema must enforce the same 10,000,000 kobo unit-price cap, so a product created via admin cannot exceed the order schema's assumption.

## Admin deletion rule
Products with `order_items` must be deactivated (`active = false`), never hard-deleted. `order_items.variant_id` is `ON DELETE restrict`, so a hard delete fails anyway.

## Seed idempotence (3.2)
`src/data/seed.ts` upserts:
- store: inserted once, skipped on subsequent runs
- products: inserted or updated by slug; `active` is preserved on update so admin deactivation survives a re-seed
- variants: inserted or price-updated by `(product_id, size_ml)`; stock is never overwritten on existing variants

## Decisions locked (from architect answers 1-15)
1. Flat shipping: 350000 kobo. Zero on empty cart.
2. Cancel allowed from pending, confirmed, paid. Conditional on current status in same transaction.
3. Rate limiter: Postgres table. Counter outside order transaction. IP primary, phone secondary. Tracking limited per order number. Cleanup of old rows. Dev fallback when x-real-ip is absent. Fail closed for creation, fail open for tracking.
4. Scroll story pins only at min-width 768px.
5. Sub-batches allowed; four-file cap.
6. Scent finder: intensity in config only. Mood E keeps three tags.
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
17. Colocated pure-function tests required.

## Accent and tint (locked)
Accent is allowed only for borders, icons, underlines and focus rings. Never text on bg or surface.
`CHOSEN_TINT_PERCENT = 10`. At 10%, ink clears 5.0:1 and muted clears 4.5:1 for all eight fragrances.

## Scent finder scoring
Mood +3 per matched tag, capped +6. Moment exact +2; anytime fragrance +1 for day/evening. Strength exact +4, one step away +1. Tie-break by score, then seed position, then slug.

## Border finding (open, before Batch 5)
`--color-border` is `rgba(27, 20, 16, 0.1)`, contrast against bg 1.23:1. Fails 3:1 for form fields. Decide before Batch 5.

## Test counts (from accepted runs, not predicted)
- Batch 1.4c color.test.ts: 19 passed (19)
- Batch 2.1 money+phone: 20 passed (20), 2 files
- Batch 2.2 order-number: 10 passed (10), 1 file
- Batch 2.3 order+stock: 65 passed (65), 2 files
- Batch 2.5 scent-finder: 7 passed (7), 1 file
- Batch 3.2 counts pending

## Files complete
- All scaffolding, config, layout, components through Batch 1.5
- All src/lib domain modules and tests through Batch 2.5
- src/lib/pyramid.ts
- src/data/seed-data.ts
- src/server/schema.ts (seven tables with jsonb pyramid, cross-column checks, $onUpdate)
- src/server/db.ts (WebSocket Pool, Node runtime)
- src/server/queries.ts (getActiveProducts, getProductBySlug, getVariantsForProduct; validates pyramid on read)
- src/data/load-env.ts (side-effect dotenv loader)
- src/data/seed.ts (idempotent seed with per-row summary)
- drizzle.config.ts
- drizzle/migrations/0000_absent_santa_claus.sql (applied)
- scripts/check-contrast.ts

## Next batch
4.1 — `Bottle` fallback component and cart context with localStorage in try/catch.