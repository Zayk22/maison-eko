# Maison Eko — Project State

## Status
Batch 1.4b in review. Next: 1.4c (footer focus-visible styles), then 2.1 (money, phone).

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
16. Contrast script reads the same token source as the CSS; runner is tsx. Script parses @theme from globals.css at runtime; no duplicated token list.
17. Colocated pure-function tests required for Zod schemas, stock reservation decisions, tracking verification, rate limiter counting, restock-on-cancel.

## Accent contrast rule (locked 2026-11-08)
Accent (`--color-accent` `#B4532A`) is allowed only for borders, icons, underlines and focus rings. It is never used for text on `bg` or `surface`. Measured: accent on bg = 4.36 (below 4.5 for normal text, above 3.0 for UI components). Nav and footer link hover: ink text plus an ember underline (`underline-offset-4`, `decoration-accent`); the same treatment applies on `:focus-visible`.

## Large-text threshold (WCAG 2.1 AA)
Large text means 24 px (18 pt) regular or 18.66 px (14 pt) bold. Text that only passes 3:1 may be used at those sizes; anything smaller must clear 4.5:1.

## Measured fragrance wash contrast (2026-11-08, from vitest color.test.ts run)
```
Fragrance     Hex       Chosen  Ratio   Ink     Bone    4.5   3.0
Eko Nights    #B8691F   ink     4.40    4.40    3.61    FAIL  PASS
Harmattan     #A8745A   ink     4.60    4.60    3.46    PASS  PASS
Lagoon        #3F8FA6   ink     4.93    4.93    3.23    PASS  PASS
Adire         #3B4A8F   bone    7.17    2.22    7.17    PASS  PASS
Palm Wine     #D9B15B   ink     9.00    9.00    1.77    PASS  PASS
Iroko         #6B6A3A   bone    4.90    3.25    4.90    PASS  PASS
Night Bloom   #8A4F7D   bone    5.25    3.03    5.25    PASS  PASS
First Rain    #7E9BA3   ink     6.16    6.16    2.58    PASS  PASS
```
Eko Nights (4.40) fails 4.5:1 for normal text on its raw colour and passes 3:1 for large text only. All other raw fragrance colours pass 4.5:1 with the better of ink or bone.

## Tinted-wash rule (pending approval)
`tintWash(fragranceHex, boneHex, percent)` exists in `src/lib/color.ts`. The contrast script computes the largest multiple of 5 at which, for all eight fragrances, ink on the tinted wash is >= 5.0 AND composited muted is >= 4.5, and prints the binding condition. `CHOSEN_TINT_PERCENT` in `src/lib/color.ts` is `null` until the architect approves a percent. No component or test uses a tint while it is null. The percent will be written here as a decision, not an estimate.

## Measured token contrast (npm run check:contrast, 2026-11-08)
All text pairs and accent non-text pairs pass with the thresholds currently in the script. Key figures from the previous run: ink on bg 15.91, muted on bg 4.85, accent on surface 4.71, accent on bg 4.36 (non-text, threshold 3.0), bg on ink 15.91, danger on bg 5.71, success on bg 5.50. The current script may reclassify or re-threshold some pairs; the values in this section reflect the last pasted run and will be replaced with the next pasted run.

## Border finding (open, before Batch 5)
`--color-border` is `rgba(27, 20, 16, 0.1)`. Its measured contrast against `bg` is 1.23:1. This fails the 3:1 UI-component requirement for form fields. Form inputs in the checkout and admin will need a stronger border than the 10% token, decided before Batch 5. The script prints this figure informationally and does not fail on it.

## Tooling decisions discovered during scaffold
- vitest config is `.mts` so Vite loads it as ESM without requiring `"type": "module"` in package.json.
- Vite 8 has native tsconfig paths support via `resolve.tsconfigPaths: true`; `vite-tsconfig-paths` was removed.
- `cacheComponents` is explicitly `false` in `next.config.ts`.
- `turbopack.root` is explicitly set to `process.cwd()` in `next.config.ts`.
- Tailwind v4 requires `postcss.config.mjs` with `@tailwindcss/postcss`.
- `--radius-control` is defined in `@theme` as `10px`; `rounded-control` is valid.

## Corrections to my own earlier advice
- `jsx` stays `"react-jsx"` for Next 16.
- `@types/node` had to be upgraded from `^20` to `24` to satisfy Vitest 5 peer range.
- `.gitignore` needed `!.env.example`.
- The first `git push` sent only the scaffold; subsequent batches commit and push before checking Vercel.
- Turbopack does not pick up Tailwind v4 `@theme` without the PostCSS config.
- My earlier hardcoded expectation for the gamma test (12.63) was wrong; the correct ratio is 4.478. The test asserts 4.47 to 4.49.

## Known TODOs for Batch 4
- Mobile navigation menu using `@radix-ui/react-dialog`.
- Cart control becomes a `button` that opens the cart drawer with an item-count badge announced via `aria-live`. Remove the `/cart` link.
- Confirm accent hover visual (ink text plus ember underline) once the nav is final.

## Known TODOs (later batches)
- **Logo:** architect is designing a real logo. Keep the text wordmark as a placeholder. Later batch: `Logo` component (inline SVG, `currentColor`, `variant` prop) reused for nav, footer, favicon, og-image, JSON-LD.
- **Input borders:** raise as a decision before Batch 5.
- **Optional:** left-align the footer on mobile to match the header.

## Files complete
- `tsconfig.json`, `vitest.config.mts`, `.env.example`, `.gitignore`
- `next.config.ts`, `globals.css`, `fonts.ts`, `postcss.config.mjs`
- `src/app/layout.tsx` (skip link, `#main-content`, flex column)
- `src/components/layout/nav.tsx` (aligned, labelled, 44 px targets, ink text with ember underline on hover/focus)
- `src/components/layout/footer.tsx` (aligned, labelled, 44 px targets, honest copy; focus-visible styles pending in 1.4c)
- `src/components/ui/demo-notice.tsx`
- `src/lib/color.ts` (parseColor, composite, relativeLuminance, contrastRatio, readableOn, tintWash, SEED_FRAGRANCES, INK, BONE, CHOSEN_TINT_PERCENT = null)
- `src/lib/color.test.ts` (count pending run; measured regressions; tintWash endpoints active, chosen-percent test skipped until CHOSEN_TINT_PERCENT is set)
- `scripts/check-contrast.ts` (parses @theme, drift check, accent non-text pairs counted toward exit, tinted-wash dual-rule with binding summary)

## Next batch
1.4c — `src/components/layout/footer.tsx` with `focus-visible:underline ... decoration-accent` on each link, then commit and push. Then 2.1 — `money.ts` and `phone.ts` with colocated tests.