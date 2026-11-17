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
- `motion` (Framer Motion) for hero, product cards, page transitions and the cart total number roll
- Plain CSS keyframes for the scent pyramid scroll story, the scent finder and the cart drawer open/close, chosen for reliability
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

- `npm run test` runs Vitest. Last measured: 16 files, 255 tests passed.
- `npm run e2e` runs the Playwright end-to-end test. The test runs against the shared Neon database, cleans up after itself in `afterAll`, and refuses to run if `NODE_ENV=production`. The production guard is `NODE_ENV` only.
- Teardown restores stock for the test order, deletes the order (cascades to items and events), and clears rate-limit rows for the test keys. Re-runs are safe because the phone rate-limit key is fixed and the order-number key is fresh.
- The end-to-end test covers: browse → open product → add to cart → checkout → confirm with an `ME-XXXXXX` number → track with the same phone.
- Last measured `npm run e2e`: 1 test passed in 18.7s.

## Measured scores (17 Nov 2026)

Lighthouse mobile on the deployed site, Incognito, no extensions, single run per page:

- `/` — Performance 89, Accessibility 100, Best Practices 100, SEO 100
- `/shop` — Performance 95, Accessibility 94, Best Practices 100, SEO 100
- `/shop/eko-nights` — Performance 90, Accessibility 100, Best Practices 100, SEO 100
- `/scent-finder` — Performance 95, Accessibility 100, Best Practices 100, SEO 100

`/shop` Accessibility was 94 because `aria-pressed` was used on filter links, which is invalid on links. The chips now use `aria-current`. Re-measurement pending.

## Known limits

- The scent finder quiz is keyed to the eight seed fragrances by slug. Admin-created products do not appear in the quiz until added to `FRAGRANCE_INTENSITY` in `src/lib/scent-config.ts`.
- Admin stock edits can race with live orders: the admin update wins. There is no optimistic locking on stock in the admin UI in v1.
- `/api/cart/lookup` returns exact stock numbers to anonymous callers. Planned cleanup: return an availability flag instead.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` is visible in the page source, because `NEXT_PUBLIC_*` variables ship to the browser by design. The WhatsApp handoff link is built on the client.
- `npm audit` reports moderate advisories in dev tooling. The suggested fixes downgrade those packages, which is unacceptable. The advisories are accepted and re-checked at each release.
- No customer accounts, no card payments, no reviews, no wishlists, no coupons, no multi-currency, no email sending, no multi-merchant support.

## Local development

Clone the repository, run `npm install`, copy `.env.example` to `.env.local`, and fill in the required environment variable names below. Then run `npm run dev` and open http://localhost:3000.

Required environment variable names (values not shown):

- `NEXT_PUBLIC_SITE_URL`
- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `ADMIN_USER_ID`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `DEMO_BANK_NAME`
- `DEMO_ACCOUNT_NAME`
- `DEMO_ACCOUNT_NUMBER`

Database:

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed is idempotent for the store row but overwrites name, description, pyramid, tags, accent and price on existing products. Do not re-run it after the admin dashboard exists if you have made manual edits.

## License

This is a portfolio project. All code and content are original.