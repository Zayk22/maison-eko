# Maison Eko — Project State

## Status
Batch 1.2 complete. Next: 1.3 (nav, footer, demo-notice component).

## Deploy
- GitHub: https://github.com/Zayk22/maison-eko (private, main)
- Vercel: https://maison-eko.vercel.app/ (auto-deploys on push to main)

## Verified environment (measured, 2026-11-08)
- Node 24.14.0, npm 11.9.0, PowerShell 5.1.19041.6456
- Next.js 16.4.5, React 19.3.0
- TypeScript 5.9.3, Vitest 5.1.0, Vite 8.3.6
- @types/node 24.19.2 (upgraded from scaffold ^20 to satisfy Vitest 5 peer range)
- drizzle-orm 0.45.4, drizzle-kit 0.31.11
- Clerk @clerk/nextjs 7.9.25, motion 14.10.1, zod 4.6.7, lucide-react 1.70.0, @radix-ui/react-dialog 1.3.1

## Decisions locked (from architect answers 1-15)
1. Flat shipping: 350000 kobo, one constant.
2. Cancel allowed from pending, confirmed, paid. Every status update is conditional on current status inside the same transaction, so restock happens at most once.
3. Rate limiter: Postgres table. Counter write outside the order transaction. IP primary, phone secondary. Tracking also limited per order number. Old rows cleaned up. Dev fallback when x-real-ip is absent. Fail closed for order creation, fail open for tracking. Both documented.
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
16. Contrast script reads the same token source as the CSS; runner is tsx.
17. Colocated pure-function tests required for Zod schemas, stock reservation decisions, tracking verification, rate limiter counting, restock-on-cancel.

## Tooling decisions discovered during scaffold
- vitest config is `.mts` so Vite loads it as ESM without requiring `"type": "module"` in package.json.
- Vite 8 has native tsconfig paths support via `resolve.tsconfigPaths: true`; `vite-tsconfig-paths` was removed. If Batch 2.1 fails to resolve `@/*` imports, revert to the plugin.
- cacheComponents in Next 16 defaults to off; it is set explicitly to false in next.config.ts so no reader has to infer it.

## Corrections to my own earlier advice
- `jsx` stays `"react-jsx"` for Next 16; my earlier suggestion of `"preserve"` was wrong.
- `@types/node` had to be upgraded from the scaffold's `^20` to `24` to satisfy Vitest 5's peer range.
- `.gitignore` needed `!.env.example`; the scaffold ignores every `.env*` file.
- The first `git push` after Batch 1.1 sent only the scaffold because the four files had not been committed. The follow-up commit `chore(batch 1.1)` fixed this. Going forward, every batch ends with `git add .`, `git commit`, `git push` in that order before Vercel is trusted to reflect the change.

## Files complete
- tsconfig.json (strict, noUncheckedIndexedAccess, target ES2022)
- vitest.config.mts (node environment, native tsconfig paths, clearMocks explicit)
- .env.example (nine variables, all empty)
- .gitignore (adds !.env.example)
- next.config.ts (cacheComponents false)
- src/app/globals.css (@theme tokens, base styles)
- src/app/fonts.ts (Fraunces + Instrument Sans via next/font)
- src/app/layout.tsx (fonts wired, demo notice inline)

## Next batch
1.3 — nav.tsx, footer.tsx, demo-notice.tsx. Three files; layout.tsx is updated to import DemoNotice instead of inlining it.