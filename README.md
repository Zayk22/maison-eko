# Maison Eko

A demo storefront for a fictional Lagos perfume house, built around how many Nigerian shops actually sell: bank transfer and a WhatsApp handoff instead of a card form. Orders are real rows in a Postgres database, customers can track them, and a single owner manages products and order status from an admin dashboard.

This is a portfolio project. No real orders are fulfilled, the bank details are demo-only, and the fragrances are fictional.

**Live:** https://maison-eko.vercel.app/

## What it does

- Browse eight original fragrances, filter by scent family and time of day, sort by price.
- Product pages with sizes, per-size pricing, stock state, and a scroll-driven scent pyramid (top, heart and base notes).
- A three-question scent finder that scores answers against fragrance tags and returns a best match and a runner-up.
- Cart drawer, checkout with Nigerian phone validation, a confirmation page with demo bank details, and a WhatsApp handoff link.
- Order tracking by order number plus the phone used at checkout.
- Owner-only admin: product and variant CRUD, order list with status filter, status updates with an event history.

## Stack

- Next.js 16 (App Router), React 19, TypeScript strict
- Tailwind CSS v4 (CSS-first `@theme`)
- Neon Postgres with Drizzle ORM; the `@neondatabase/serverless` WebSocket `Pool` for interactive transactions
- Clerk for the owner login, restricted to one user ID
- Zod for validation on every server action and API route
- `motion` for the hero, product cards, page transitions and the cart total roll; plain CSS keyframes and direct scroll-driven DOM updates for the scent pyramid, the scent finder and the cart drawer open/close
- Radix Dialog for the cart drawer and mobile menus
- Vitest and Playwright
- Hosted on Vercel

## How checkout works

1. The cart stores only `{ variantId, quantity }`. The client never sends a price.
2. On submit, the server validates the payload, normalises the phone to `+234...`, merges duplicate variants, and recomputes every price from the database.
3. One Postgres transaction reserves stock with a guarded `UPDATE ... SET stock = stock - $qty WHERE id = $id AND stock >= $qty RETURNING stock`. If any line is short, the whole transaction rolls back and the customer sees which lines conflict.
4. If the random order number (`ME-XXXXXX`, unambiguous alphabet) collides on the unique index, the whole transaction retries with a new number, up to three times.
5. The confirmation page shows the order number, items, totals and demo bank details, never the phone or address. The WhatsApp button appears only if `NEXT_PUBLIC_WHATSAPP_NUMBER` is set.
6. Tracking requires the order number and the phone. A wrong number and a wrong phone return the same generic message.

Money is stored as integer kobo and parsed from decimal strings without floats.

## Security decisions

- **Server-side pricing.** Prices come from the database inside the order transaction.
- **Owner authorisation in every server context.** The Clerk proxy covers `/admin`, `/api/admin` and `/sign-in`, but every admin page, layout and server action also calls `requireAdmin()`, which compares the signed-in user to `ADMIN_USER_ID` and fails closed if it is missing. Clerk sign-ups are set to invite-only.
- **Rate limiting.** A Postgres table with a single-statement upsert that resets the count when the window expires. Order creation: 8 per 10 minutes per IP and 3 per 10 minutes per phone. Tracking: 10 per 10 minutes per order number and 20 per 10 minutes per IP. The counter is written outside the order transaction so a rollback cannot erase it. It fails closed for orders and open for tracking.
- **Order lifecycle.** Status changes use a conditional update (`WHERE status = $current`) in the same transaction as the restock, so a cancel restores stock exactly once, and every change is written to `order_events`.
- **Secrets** live in `.env.local` (git-ignored) and in Vercel environment variables.

## Accessibility

- `npm run check:contrast` reads the `@theme` block in `globals.css`, computes WCAG 2.1 contrast, and exits non-zero on any failing text pair. The ember accent is used for borders, icons, underlines and focus rings only, never for text.
- Skip link, labelled landmarks, visible focus rings, 44 px touch targets, `aria-live` regions for cart and tracking updates, and `prefers-reduced-motion` respected by the animations.

## Testing

- `npm run test`: Vitest. Last run: 16 files, 255 tests passed. Covers money, phone, order totals, status transitions, stock logic, order numbers, rate-limit counting, tracking verification, Zod schemas, colour contrast and the scent finder scoring (including that every fragrance can be the best match).
- `npm run e2e`: one Playwright test covering browse, add to cart, checkout, confirmation and tracking. It runs against the shared Neon database, deletes the test order and restores stock afterwards, and refuses to run when `NODE_ENV=production`.

## Measured Lighthouse scores

Mobile preset, deployed site, Incognito with no extensions, 17 Nov 2026. Scores vary between runs.

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/` | 89 | 100 | 100 | 100 |
| `/shop` | 85 to 86 (four runs) | 100 | 100 | 100 |
| `/shop/eko-nights` | 90 | 100 | 100 | 100 |
| `/scent-finder` | 95 | 100 | 100 | 100 |

`/shop` Accessibility was 94 until the filter links stopped using `aria-pressed` (invalid on links) and switched to `aria-current`. Pages other than `/shop` are single runs.

## Known limits

- The scent finder is keyed to the eight seed fragrances. Products created in the admin do not appear in the quiz.
- Admin stock edits can race with live orders; the last write wins.
- `/api/cart/lookup` returns exact stock to anonymous callers. An availability flag would be better.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` is visible in the page source because `NEXT_PUBLIC_*` values ship to the browser.
- The e2e test shares the production database.
- `npm audit` reports moderate advisories in dev tooling (esbuild via `drizzle-kit`, minimatch via the ESLint packages). The suggested fixes would downgrade those packages, so they are accepted for now.
- Out of scope: customer accounts, card payments, reviews, wishlists, coupons, multi-currency, email, multiple merchants.
- Product images are generated SVG bottles; real photography and a designed logo are not yet in place.

## Local development

```powershell
npm install
Copy-Item .env.example .env.local
npm run db:migrate
npm run db:seed
npm run dev
```

Required variables (names only): `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct, used by Drizzle Kit), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `ADMIN_USER_ID`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`, `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `DEMO_BANK_NAME`, `DEMO_ACCOUNT_NAME`, `DEMO_ACCOUNT_NUMBER`.

Re-running `db:seed` overwrites the name, description, notes, tags, colour and price of the seeded products, so don't run it after editing them in the admin.