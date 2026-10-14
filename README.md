# Pashmore

Premium Pashmina, Kashmiri shawls and Indian luxury fashion e-commerce, built with the
Next.js App Router.

> *Timeless Indian craftsmanship, woven for modern luxury.*

---

## Requirements

| | |
|---|---|
| **Node** | **20.9 or newer.** See the note below if you are on Node 18. |
| Package manager | npm 10+ |

### Note on Node 18

This project was developed on a machine running Node 18.20.8, which constrained two choices:

* **Next 15.5, not Next 16.** Next 16 requires Node ≥ 20.9. Once you are on Node 20+,
  `npm install next@latest` should be a clean upgrade — nothing in this codebase uses
  Next 15-only APIs.
* **Tailwind v4's native binding.** `@tailwindcss/oxide` declares `engines.node >= 20`, so
  npm silently skips its platform binary on Node 18 and the build fails with
  *"Cannot find native binding"*. On this machine that binary was force-installed to get a
  green build. **On Node 20+, a plain `npm install` resolves it correctly and no workaround
  is needed.** If you hit that error on Node 18, run:

  ```bash
  npm install @tailwindcss/oxide-win32-x64-msvc --force --no-save
  ```

  Upgrading Node is the real fix.

---

## Getting started

```bash
npm ci
cp .env.example .env.local   # then set CLOUDFLARE_API_URL (see below)
npm run dev                  # http://localhost:3000 (or: npx next dev -p 3100)
```

Running the Worker and admin dashboard locally, and the end-to-end check, are described in the
backend's README (`PushminaBackend/README.md`).

```bash
npm run build && npm start   # production build
npm run typecheck            # tsc --noEmit
npm run lint                 # eslint
npm test                     # vitest integration tests (no network needed)
```

The storefront has **no built-in catalogue**. Products, collections, customers, carts,
wishlists and orders all come from the Cloudflare Worker API (D1 + R2). For local
development, run the Worker (`npx wrangler dev` in the backend's `worker/` directory) and set
`CLOUDFLARE_API_URL=http://127.0.0.1:8787`. Without it, catalogue pages show the error
page and the cart reports that the store is unavailable — nothing falls back to demo data.

`NEXT_PUBLIC_SITE_URL` drives `metadataBase`, every canonical URL, the sitemap and all
JSON-LD `@id`s.

---

## Backend integration (Cloudflare Worker, D1, R2)

```
Browser ──► Next.js route handlers (/api/*) ──► Cloudflare Worker /api/v1 ──► D1 / R2
            Server Components ─────────────────┘
```

* **The browser never talks to the Worker or D1.** Client code only calls same-origin
  `/api/*` route handlers (`lib/api/browser.ts`). `CLOUDFLARE_API_URL` and the optional
  Cloudflare Access token are server-only environment variables used by
  `server/worker.ts`; a test build scan confirms none of them reach `.next/static`.
* **One response envelope.** The Worker answers `{ success, data, meta? }` or
  `{ success: false, error: { code, message, details? } }`; the storefront's route handlers
  answer in the same shape, so `bff()` in the browser has one format to read and
  validation `details` bind straight to form fields.
* **Normalisers** (`lib/normalize/*`) map Worker DTOs onto `src/types`, clamp stock, resolve
  R2 image URLs against an allow-list and substitute a neutral placeholder when an image is
  missing. Components are unchanged consumers of `src/types`.
* **Catalogue reads** (`services/catalog.ts`) run in Server Components and are cached in the
  Next Data Cache for 60 seconds with tags (`catalog`, `products`, `product:<slug>`,
  `collections`, `collection:<slug>`). The Worker or admin can purge them immediately via
  `POST /api/revalidate` with `Authorization: Bearer $REVALIDATE_SECRET` and an optional
  `{ "tags": [...] }` body. Catalogue pages render on demand, so builds never depend on the
  Worker being reachable.
* **Failure handling.** Primary content (a product, a collection listing, search results)
  throws to the error boundary when the Worker fails; secondary rails (related products,
  recommendations) log and hide themselves. An unknown slug is a real 404.

### Sessions and cookies

All cookies are `HttpOnly`, `SameSite=Lax` and `Secure` in production. No token is ever
readable by page scripts or returned in a response body.

| Cookie | Holds | Lifetime |
|---|---|---|
| `pm_session` | Worker access token (opaque `pat_…`) | the token's `expiresIn` minus 30 s, so the cookie's presence means "fresh" |
| `pm_refresh` | Worker refresh token (single-use, rotated on every refresh) | 30 days with "keep me signed in", otherwise browser session |
| `pm_remember` | "keep me signed in" flag | 30 days |
| `pm_cart` | guest bag: up to 20 `[variantId, productSlug, quantity]` lines, no prices | 30 days |

* `server/session.ts` → `withSession()` wraps authenticated route handlers: it refreshes up
  front when the access cookie has expired, retries once on a Worker `401`, and writes
  rotated tokens to the response.
* `middleware.ts` does the same for `/account/*` and `/checkout` so Server Components render
  with a fresh token, and sends signed-out visitors to `/login?next=…`. It never refreshes
  for router prefetches.
* `/api/auth/session` is the only place a dead session is cleared (both tokens rejected).
  A Worker outage never signs anyone out.
* **Refresh-token reuse.** The Worker treats a reused refresh token as theft and revokes
  the whole session. Refreshing is therefore confined to the session route, middleware and
  `withSession`, the cart and wishlist wait for the session to load before calling the API,
  and prefetches are skipped. Two tabs refreshing at exactly the same moment can still sign
  the customer out; they simply sign in again.

### Bag

* **Signed in:** the Worker cart in D1 (`/cart`, `/cart/items`, …), forwarded with the
  customer's token.
* **Guest:** the Worker only keeps carts for customers, so `server/cart.ts` keeps the guest
  bag in the HttpOnly `pm_cart` cookie and prices it on every request from
  `GET /products/batch` (no cache), with the Worker's own rules: GST-inclusive prices, the
  shipping fee and free-shipping threshold from the admin's settings (default ₹149 under
  ₹4,999), maximum 10 per line, stock checked on every change.
  The cookie holds no prices, so nothing the browser sends is trusted.
* **Sign-in / registration** sends the guest lines to `POST /cart/merge`, then clears
  `pm_cart`. If the merge fails, sign-in still succeeds and the guest bag is kept.
* The wishlist works the same way from the customer's point of view: guests save to
  `localStorage`, which is merged into the account wishlist (`/wishlist/merge`) at sign-in.

### Checkout

`/checkout` is for signed-in customers (the middleware sends guests to `/login?next=/checkout`).
It shows the server-priced bag, saved or new address, Standard/Express shipping and the payment
methods the Worker has enabled (`GET /payments/methods`): Razorpay when its keys are set, cash on
delivery when `ENABLE_COD_ORDERS=true`. With neither, it says online payment is unavailable.

1. `POST /api/checkout` forwards the address, shipping method, payment method and coupon to the
   Worker's `POST /orders` with an `Idempotency-Key`, so a double click or retry cannot create a
   second order. Prices, stock and totals are computed by the Worker; nothing from the browser is
   trusted.
2. For Razorpay, the browser opens Razorpay Checkout with the options the Worker returned and posts
   the result to `POST /api/orders/:id/verify`. The Worker checks the signature and fetches the
   payment from Razorpay before marking the order paid. Signed webhooks confirm it independently.
3. The customer lands on `/account/orders/:id` (`?placed=1`, `?payment=failed` or
   `?payment=cancelled`). There they see status, tracking and timeline, and can retry payment,
   cancel or request a return through `/api/orders/:id/{pay,verify,sync,cancel,return}`.

---

## Architecture

```
src/
├── app/                     # App Router. Server Components by default.
│   ├── layout.tsx           # fonts, Organization + WebSite JSON-LD, providers
│   ├── page.tsx             # homepage
│   ├── [landing]/           # SEO landing pages (/pashmina-shawls, /wedding-gifts …)
│   ├── collections/         # index + /collections/[slug] with URL-driven filters
│   ├── products/[slug]/     # PDP: gallery, zoom, purchase panel, accordions
│   ├── blog/                # journal, article, category
│   ├── account/             # overview, orders, profile, addresses, wishlist
│   ├── checkout/            # bag review; payments not yet enabled
│   ├── api/                 # route handlers: auth, account, cart, wishlist, catalogue
│   ├── sitemap.ts robots.ts # generated, public pages only
│   └── error / not-found / global-error
├── components/
│   ├── ui/                  # button, input, dialog, accordion, badge, skeleton…
│   ├── layout/              # header, mega menu, mobile menu, footer, bottom nav
│   ├── product/             # card, grid, carousel, gallery, zoom, viewer, quick view
│   ├── collection/          # filter sidebar, filter drawer, sort, active filters, pagination
│   ├── cart/ checkout/ search/ blog/ account/ home/ marketing/ motion/ seo/
├── context/                 # session, cart, wishlist, recently viewed, toast, UI overlays
├── hooks/                   # local storage, media query, scroll, debounce, selection
├── data/                    # editorial content only: blog, landing pages, navigation, policies
├── server/                  # Worker client, sessions/cookies, route-handler helpers
├── services/                # catalog (Worker-backed), newsletter, keywords
├── lib/                     # api envelope, normalisers, media, seo, jsonld, query, utils
└── types/                   # the whole domain model
tests/                       # vitest integration tests with a fake Worker
```

### The rule that shapes everything

**Components never import data.** They consume the types in `src/types` and receive data
from `src/services` (Server Components) or from `/api/*` route handlers (client
components). `services/catalog.ts` is the only module that knows where products come from.

### Client boundaries

`components/providers.tsx` is the single client boundary in the layout. Everything above it
stays a Server Component. Interactivity is pushed to leaves:

* Collection **filters are links, not checkboxes** — the entire filter panel is a Server
  Component with zero client JavaScript. State lives in the URL
  (`?color=ivory&material=pure-pashmina&sort=price-low`), so filtered views are shareable,
  crawlable, back-button correct and middle-clickable.
* The mobile filter drawer is a thin client shell that receives the server-rendered panel
  as `children`.
* The cart drawer fetches a handful of recommendations from `/api/recommendations` the
  first time it opens, so the catalogue never ships in the client bundle.

---

## The product image system

The brief treats this as the most important interaction, and it is built as three
cooperating pieces rather than a CSS transform.

**`ZoomImage`** — desktop hover magnification. The magnified layer is the *same*
`next/image` element scaled about the cursor via `transform-origin`, so there is no second
network request and no second decode. `transform-origin` updates without a transition so the
lens tracks the pointer exactly; `transform` itself is transitioned so entering and leaving
feels like a lens settling. Pointer moves are coalesced into one animation frame.

**`FullscreenViewer`** — built on pointer events, so one code path serves mouse, touch and
pen:

| Gesture | Behaviour |
|---|---|
| Wheel / trackpad pinch | Zoom about the cursor |
| Double click or double tap | Toggle 1× ↔ 2.5× about the tap point |
| Drag | Pan while zoomed; swipe between images at 1× |
| Two-finger pinch | Continuous zoom about the midpoint |
| `←` `→` | Previous / next image, or pan when zoomed |
| `+` `−` `0` | Zoom in, out, reset |
| `Esc` | Close |

Radix Dialog supplies the focus trap, `aria-modal` semantics and the background scroll lock.
Translation is clamped so the image can never be dragged off the stage.

**`ProductGallery`** — vertical thumbnail rail plus magnifying main image on desktop; a
scroll-snap swipe gallery with an `n / total` indicator on mobile. Both open the same viewer.

**Keyboard**: the main image is focusable. `Enter` opens the fullscreen viewer, `+`/`−`
toggle inline zoom, and arrow keys move the zoom point — the zoom is not mouse-only.

---

## SEO

Every route builds its metadata through `lib/seo.ts#buildMetadata`, so canonical URL, Open
Graph, Twitter card and robots directives cannot be present on one page and forgotten on
another.

**Structured data** (`lib/jsonld.ts`) is emitted as a single `@graph` per page:

| Page | Schema |
|---|---|
| Homepage | `Organization`, `WebSite` (+ `SearchAction`), `WebPage` |
| Collection | `CollectionPage` (+ `ItemList`), `BreadcrumbList`, `FAQPage`¹ |
| Product | `Product`, `Offer`, `MerchantReturnPolicy`, `AggregateRating`², `BreadcrumbList`, `FAQPage`¹ |
| Landing | `WebPage`, `BreadcrumbList`, `FAQPage` |
| Article | `BlogPosting`, `BreadcrumbList`, `FAQPage`¹ |

¹ Emitted **only** when the same questions are actually rendered on the page.
² Emitted **only** when the data source supplied real rating data. The demo catalogue seeds
ratings so the markup can be reviewed; a backend that returns no ratings removes the
`AggregateRating` node automatically, with no code change. **Never ship fabricated ratings.**

**Indexing**: `/cart`, `/checkout`, `/account/*`, `/wishlist`, `/login`, `/register`,
`/search` and `/api/*` are `noindex` in metadata *and* disallowed in `robots.txt`, and are
absent from the sitemap. Faceted query strings are disallowed for crawlers so the canonical
unfiltered collection page is the one that gets indexed.

**Landing pages are not duplicates.** `/collections/womens-shawls` answers *show me the
products*; `/womens-shawls` answers *help me decide* — its own H1, long-form buying guidance,
its own FAQs, its own internal links, and a curated selection linking through to the
collection.

---

## Keyword intelligence

`/admin/keywords` is a keyword research tool built on the real catalogue. It is **research,
not a page generator**: it suggests which keywords to target and where, and it never publishes
pages.

| Piece | Where |
|---|---|
| Seed keywords (brand, product, material, occasion, location, questions…) | `data/keyword-seeds.ts` |
| Business facts the engine must respect | `data/keyword-config.ts` |
| Real metrics, shared with the team | `data/keyword-metrics.json` |
| Engine: generate → classify → cluster → score → recommend → cannibalization | `lib/keyword-intel/` |
| Data access (swap for a DB / metrics API here) | `services/keywords.ts` |

**How it decides.** Every keyword is checked against stock. It gets a `do-not-target` result if it
asks for something Pashmore doesn't sell, such as black shawls, blankets, jackets, suits, printed
shawls or a price band with no products. City, "near me" and offer searches get `no-page`,
because those pages would be doorway pages or would mislead. Each cluster maps to **one** target
page: colours group into families, price bands are one page each, and festivals share one guide.
Questions become FAQ entries on the cluster's page.

**Metrics are never invented.** Search volume, CPC, competition, difficulty and trend show as
`unavailable` until you import a Keyword Planner, Search Console or SEO-tool export on the
Metrics tab. Until then, scores are labelled *estimated*: they are built only from intent,
catalogue relevance and conversion potential.

**Claims.** Words like "100% pure", "authentic" and "GI certified" are flagged as claim-sensitive
until `verifiedClaims` in `keyword-config.ts` is set to true. Only set it once lab or GI
documentation exists.

**Export:** CSV, Excel (.xlsx, built in the browser), JSON in the database schema, and PDF via the
print dialog. Every export respects the active filters.

**Access:** there is no auth yet, so `/admin` is off in production unless `ENABLE_ADMIN=true`.
It is always `noindex` and disallowed in `robots.txt`. Protect it at the edge before you enable it.

---

## Performance & Core Web Vitals

* Server Components by default; framer-motion only where an animation genuinely runs.
* Hero is the LCP element: `priority`, `fetchPriority="high"`, `sizes="100vw"`.
* Every image has explicit dimensions and an aspect-ratio container, so nothing shifts.
  Skeletons match the real ratios exactly.
* Animations touch `transform` and `opacity` only — never layout.
* `scrollbar-gutter: stable` means opening a modal cannot shift the page.
* Fonts via `next/font` with `display: swap` and CSS variables, self-hosted at build time.
* AVIF/WebP negotiated by `next/image`; `deviceSizes` matches the design breakpoints.
* Carousels use native scroll-snap rather than a carousel library.

---

## Accessibility

Semantic landmarks and a skip link; one visible focus treatment defined once and never
removed; every icon-only control labelled; `aria-live` on the cart count, stock status and
result counts; `aria-current` on active navigation; native `<select>` for sorting because the
platform picker beats any custom dropdown on mobile and with a screen reader; full keyboard
paths through the gallery, zoom, viewer, drawers and checkout.

`prefers-reduced-motion` is honoured at three levels: a global CSS override, a
`usePrefersReducedMotion` hook that stops parallax and reveals from attaching listeners at
all, and per-component variants. The hero's parallax is additionally mouse-only — touch
devices never attach the handler.

---

## Mobile verification

Checked in headless Chromium at 320, 360, 390 and 768 px — no horizontal overflow and no
console errors on any of home, collection, product, cart, checkout, article, landing or FAQs.

Interactions exercised on a 390 px touch context: navigation drawer (open, submenu expand,
Escape to close), instant search, quick view bottom sheet, add-to-bag from the sheet, cart
drawer, fullscreen viewer (open, background scroll lock, double-tap zoom to 250%), sticky
add-to-cart clearing the bottom navigation, and the filter drawer applying `?color=ivory`.

Four real bugs were found and fixed this way, each worth knowing about if you touch the
same areas:

* **The wordmark pushed the cart button off-screen below ~360 px.** It sits between the
  hamburger and the utility icons, so it now steps down in size and tracking under `sm`.
  The overflow also made Chrome expand the layout viewport to 354 px, which pushed the
  bottom navigation below the fold — a second symptom with the same cause.
* **The announcement bar silently hid half its message.** It clips to a single line, so a
  wrapped second line simply vanished. Type and gutters now scale down, `truncate` degrades
  to an ellipsis rather than disappearing, and the copy is kept under ~48 characters.
* **The quick view's mobile image collapsed to zero height.** An `aspect-ratio` box as a flex
  child of a scrolling column gets shrunk away; it needs `shrink-0`.
* **Long uppercase button labels forced overflow.** Wide tracking gives uppercase labels a
  large min-content width, so `md` and `lg` sizes ease off their padding and tracking on
  phones.

One caveat on testing: a synthetic mouse drag does *not* scroll a CSS scroll-snap container,
so swipe tests must dispatch real touch events (`Input.dispatchTouchEvent`) or scroll the
element directly. The gallery swipe advances correctly under both.

## Imagery

**Product and collection imagery comes from Cloudflare R2** via the Worker. The Worker
returns absolute URLs (an R2 custom domain, or its own `/media/*` delivery route) or bare
object keys; `lib/media.ts` resolves keys against `CLOUDFLARE_R2_PUBLIC_URL` and only
accepts hosts that are also allowed for `next/image` in `next.config.mjs`
(`CLOUDFLARE_R2_PUBLIC_URL`, `CLOUDFLARE_API_URL` and `IMAGE_REMOTE_HOSTS`). Anything else,
including legacy `/images/products/*` paths from the old demo seed, renders the neutral
`/images/placeholders/product.png` instead of a broken image.

Editorial imagery (hero, banners, journal covers, menu cards) is still local PNGs under
`public/images`, written by `scripts/generate-images.mjs` (pure Node, no native
dependencies). Replace those files in place with photography and nothing else changes.

```bash
npm run gen:images            # skips files that already exist
node scripts/generate-images.mjs --force   # regenerate everything
```

---

## Content

Journal articles, landing pages and navigation are editorial content in `src/data`.
Everything commercial (products, stock, prices, collections, customers, carts, wishlists,
orders) lives in D1 behind the Worker.

These are edited in the admin dashboard and read by `server/content.ts` and `server/seo.ts`:

- the announcement bar and homepage banners (image or video) and sections;
- the policy pages (shipping, returns, privacy, terms);
- per-page SEO titles and descriptions;
- redirects;
- shipping fees and the free-shipping threshold.

They are cached for 5 minutes under the `content` tag, which the Worker purges on every edit.
When the Worker is unreachable the site falls back to the built-in copy in `src/data`, so a
CMS outage never blanks a page. Redirects are applied in `middleware.ts` with a 60-second
per-instance cache.

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `CLOUDFLARE_API_URL` | **Yes** (production build fails without it) | Worker origin, e.g. `https://api.pashmore.com`. `/api/v1` is appended. Server-only. |
| `CLOUDFLARE_R2_PUBLIC_URL` | Recommended | Public R2 domain for images returned as bare keys; also allowed for `next/image`. |
| `IMAGE_REMOTE_HOSTS` | No | Extra comma-separated image hostnames. |
| `CF_ACCESS_CLIENT_ID` / `CF_ACCESS_CLIENT_SECRET` | No | Cloudflare Access service token, if the Worker sits behind Access. |
| `CLOUDFLARE_GATEWAY_SECRET` | **Strongly recommended** | Must equal the Worker's `GATEWAY_SECRET`. Lets the Worker trust the shopper IP this app forwards; without it every shopper shares Vercel's IP for the Worker's rate limits (sign-in: 20/min, registration: 5 per 10 min). |
| `REVALIDATE_SECRET` | Recommended | Enables `POST /api/revalidate` for instant cache purges. |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical origin for SEO. |
| `GOOGLE_SITE_VERIFICATION` | No | Search Console verification token. |
| `ENABLE_ADMIN` | No | Enables `/admin/keywords` in production. |

None of the server-only variables may be prefixed `NEXT_PUBLIC_`.

**Worker-side settings that must match:**

* `GATEWAY_SECRET` — the same value as `CLOUDFLARE_GATEWAY_SECRET` here.
* `MEDIA_PUBLIC_BASE_URL` — the public R2/media origin the Worker uses for image URLs; that
  host must be covered by `CLOUDFLARE_R2_PUBLIC_URL` or `IMAGE_REMOTE_HOSTS`.
* `FRONTEND_ORIGIN` and `STOREFRONT_URL` — the storefront origin. The storefront calls the
  Worker server-to-server and does not need CORS, but `STOREFRONT_URL` is where the Worker sends
  cache purges and the base of links in emails.
* `REVALIDATE_SECRET` — the same value as here, so admin edits appear at once.
* `ENABLE_COD_ORDERS` and the Razorpay keys decide which payment methods checkout offers.

---

## Deploying to Vercel

1. Import the repository in Vercel. Framework preset **Next.js**; build command
   `npm run build`, install command `npm ci`, Node.js **20.x or 22.x**.
2. In **Settings → Environment Variables**, add the variables above for **Production** (and
   Preview, pointing at a staging Worker if you have one). At minimum:
   `CLOUDFLARE_API_URL`, `CLOUDFLARE_R2_PUBLIC_URL`, `CLOUDFLARE_GATEWAY_SECRET`,
   `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET`.
3. Deploy. `next.config.mjs` reads the image hosts at build time, so **redeploy after
   changing `CLOUDFLARE_R2_PUBLIC_URL`, `CLOUDFLARE_API_URL` or `IMAGE_REMOTE_HOSTS`.**
4. On the Worker, set `GATEWAY_SECRET` (same value), `FRONTEND_ORIGIN` (the Vercel production
   domain), `STOREFRONT_URL` and `MEDIA_PUBLIC_BASE_URL`.
5. Set the same `REVALIDATE_SECRET` on the Worker. It then calls
   `POST https://<storefront>/api/revalidate` after every admin change to products, stock,
   orders, content, SEO or settings, so changes appear before the cache window ends.
6. Smoke-test: home page rails, a collection with filters and sorting, a product page, add
   to bag as a guest, register (the guest bag carries over), wishlist, addresses, order
   history, order tracking, sign out.

---

## What is deliberately not built

* **Admin.** Catalogue, orders, payments, refunds, customers, banners, pages, SEO and site
  settings are managed in the separate admin dashboard (`PushminaBackend/admin`) through the
  Worker's admin API, not here.
* **Guest checkout.** Customers sign in to place an order; a guest bag carries over at sign-in.
  Discount codes likewise need an account.

---

## Licence

Proprietary. Brand name, copy and imagery are original to this project.
