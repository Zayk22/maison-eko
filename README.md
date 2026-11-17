# Maison Eko

A demo perfume house storefront built for a portfolio. The storefront sells eight fictional fragrances, checks out via bank transfer and WhatsApp (no card processing), stores orders in a real Postgres database, and includes a single-owner admin dashboard for product, variant and order management.

The product is the point. The demo notice is honest: no real orders are fulfilled, all bank details are demo-only, and the fragrances are fictional.

## Live

Deployed on Vercel: https://maison-eko.vercel.app/

## Stack

- Next.js 16 (App Router, TypeScript strict)
- Tailwind CSS v4 (CSS-first `@theme`, no `tailwind.config.js`)
- Neon Postgres with Drizzle ORM (`@neondatabase/serverless` WebSocket `Pool` for interactive transactions)
- Clerk for the owner dashboard, restricted to one user via `ADMIN_USER_ID`
- `motion` (Framer Motion) for hero, product cards and page transitions
- Plain CSS keyframes and direct DOM updates for the scent pyramid scroll story, the scent finder, and the cart drawer totals, where the library has proven fragile under Next 16 / Turbopack
- `@radix-ui/react-dialog` for the cart drawer, mobile menu and admin mobile menu
- `lucide-react` for icons
- Vitest for unit tests, Playwright for the end-to-end checkout flow

## How the customer flow works

1. The customer browses `/shop`, opens a product, picks a size, adds to cart.
2. The cart drawer shows each line, subtotal, flat shipping (₦3,500) and total. Prices are always recomputed on the server during order creation; the client never sends prices.
3. Checkout collects name, phone (Nigerian format, normalised to `+234...`), street, area, state, and an optional delivery note. The server combines the three address fields into a single `address` column.
4. On submit, a single Postgres transaction guards stock with `UPDATE ... WHERE stock >= $qty RETURNING stock`. If any line is short, the whole transaction rolls back with a specific conflict list. If the generated order number collides (`23505` on `orders_order_number_unique`), the whole transaction retries with a new number, up to three times.
5. The confirmation page reads the order directly from the database. It shows the order number, items, totals, demo bank details, and a "Send order on WhatsApp" button built from `NEXT_PUBLIC_WHATSAPP_NUMBER`. The button is hidden if the variable is unset, and the number is never shown as text.
6. Tracking requires the order number plus the phone used at checkout. Wrong order number and wrong phone return the same generic error, so neither field can be probed independently.

## Security decisions

- **Server-side pricing.** The cart stores only `{ variantId, quantity }`. Every price is looked up from the database inside the order transaction. A malicious client cannot submit a lower price.
- **Owner authorisation is checked in every server context.** `src/proxy.ts` runs `clerkMiddleware()` on `/admin/*`, `/api/admin/*` and `/sign-in(.*)`. Every admin page, layout and server action calls `requireAdmin()` itself. A session cookie alone is never sufficient.
- **Rate limiting on mutation endpoints only.** Order creation is limited to 8 per 10 minutes per IP and 3 per 10 minutes per normalised phone. Tracking is limited to 10 per 10 minutes per order number and 20 per 10 minutes per IP. The limiter is a Postgres table with a single-statement `INSERT ... ON CONFLICT DO UPDATE` that resets when the window expires. The write happens outside the order transaction so a rollback does not erase the count. Fail-closed for orders, fail-open for tracking, so a broken limiter never locks a customer out of viewing their own order.
- **Secrets** live in `.env.local` (git-ignored) locally and in Vercel environment variables in production. `.env.example` documents every variable name with empty values. A leaked credential was scrubbed from history with `git filter-repo` and the Neon role password was rotated at the same time.

## Accessibility

- WCAG 2.1 AA target. The `npm run check:contrast` script parses the `@theme` block in `globals.css`, computes WCAG contrast with the real gamma curve, and exits non-zero if any text pair fails 4.5:1. Ember is allowed for borders, icons, underlines and focus rings, never for text.
- Every text/background pair on the site has a measured ratio. The current ratios are printed by the script and recorded in `PROJECT_STATE.md`.
- Skip link, labelled landmarks (`aria-label="Primary"`, `aria-label="Footer"`), visible focus rings, 44 px minimum targets, `aria-live="polite"` on cart and status changes, and reduced-motion support throughout.
- Large text is allowed at lower contrast (3:1) per WCAG 2.1. That is why "Eko Nights" (4.40 on its own accent) is fine for display headlines but not for body copy, and the site respects that.

## Testing

- `npm run test` runs Vitest.
- `npm run e2e` runs the Playwright end-to-end test. The test creates a real order in the Neon database, then deletes it and restores stock in `afterAll`. It refuses to run if `NODE_ENV=production` or `DATABASE_URL` contains `prod`. Re-runs are safe because the phone rate-limit key is fixed and the order-number key is fresh; teardown clears both.
- The end-to-end test covers: browse → open product → add to cart → checkout → confirm with an `ME-XXXXXX` number → track with the same phone.

## Measured scores (17 Nov 2026)

Lighthouse mobile on the deployed home page, Incognito, no extensions, single run:

- Performance: 89
- Accessibility: 100
- Best Practices: 100
- SEO: 100

Measured pages: `/`. Other pages are not yet measured; the numbers above are for the home page only.

## Known limits

- The scent finder quiz is keyed to the eight seed fragrances by slug. Admin-created products do not appear in the quiz until added to `FRAGRANCE_INTENSITY` in `src/lib/scent-config.ts`.
- Admin stock edits can race with live orders: the admin update wins. There is no optimistic locking on stock in the admin UI in v1.
- `/api/cart/lookup` returns exact stock numbers to anonymous callers. Planned cleanup: return an availability flag instead.
- `npm audit` reports 11 moderate advisories in dev tooling (esbuild via @esbuild-kit inside drizzle-kit; minimatch via typescript-eslint and eslint-config-next). The suggested fixes downgrade those packages, which is unacceptable. The advisories are accepted, re-checked at each release.
- No customer accounts, no card payments, no reviews, no wishlists, no coupons, no multi-currency, no email sending, no multi-merchant support.

## Local development

```powershell
git clone https://github.com/Zayk22/maison-eko.git
cd maison-eko
npm install
Copy-Item .env.example .env.local
npm run dev
```

Fill in the variables in `.env.local`, then open http://localhost:3000.

Database:

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed is idempotent for the store row but overwrites name, description, pyramid, tags, accent and price on existing products. Do not re-run it after the admin dashboard exists if you have made manual edits.

## License

This is a portfolio project. All code and content are original.