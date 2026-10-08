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
npm install
npm run gen:images    # writes /public/images (see "Imagery" below)
npm run dev           # http://localhost:3000
```

```bash
npm run build && npm start   # production build
npm run typecheck            # tsc --noEmit
npm run lint                 # eslint
```

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SITE_URL` — it drives
`metadataBase`, every canonical URL, the sitemap and all JSON-LD `@id`s.

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
│   ├── checkout/            # 4-step distraction-free checkout
│   ├── api/                 # search + product-by-slug endpoints
│   ├── sitemap.ts robots.ts # generated, public pages only
│   └── error / not-found / global-error
├── components/
│   ├── ui/                  # button, input, dialog, accordion, badge, skeleton…
│   ├── layout/              # header, mega menu, mobile menu, footer, bottom nav
│   ├── product/             # card, grid, carousel, gallery, zoom, viewer, quick view
│   ├── collection/          # filter sidebar, filter drawer, sort, active filters
│   ├── cart/ checkout/ search/ blog/ account/ home/ marketing/ motion/ seo/
├── context/                 # cart, wishlist, recently viewed, toast, UI overlays
├── hooks/                   # local storage, media query, scroll, debounce, selection
├── data/                    # demo catalogue, collections, blog, taxonomy, landing
├── services/                # catalog, orders, newsletter, api client
├── lib/                     # seo, jsonld, query (URL filters), site config, utils
└── types/                   # the whole domain model
```

### The rule that shapes everything

**Components never import data.** They consume the types in `src/types` and receive data
from `src/services`. `services/catalog.ts` is the only module that knows the catalogue is
currently a local array — swapping in a Node/Express API, a Next route handler or a headless
commerce platform means rewriting the bodies of those functions and nothing else. Every
service function is already `async`, and `services/api.ts` is the HTTP client waiting for
`NEXT_PUBLIC_API_BASE_URL`.

### Client boundaries

`components/providers.tsx` is the single client boundary in the layout. Everything above it
stays a Server Component. Interactivity is pushed to leaves:

* Collection **filters are links, not checkboxes** — the entire filter panel is a Server
  Component with zero client JavaScript. State lives in the URL
  (`?color=ivory&material=pure-pashmina&sort=price-low`), so filtered views are shareable,
  crawlable, back-button correct and middle-clickable.
* The mobile filter drawer is a thin client shell that receives the server-rendered panel
  as `children`.
* The cart drawer's recommendations are resolved on the server in the root layout and
  passed down, so the catalogue never reaches the browser.

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

The brief forbids fake external image URLs, so **every image is a real local PNG** committed
under `public/images` and written from scratch by `scripts/generate-images.mjs` (pure Node —
zlib and a CRC32 table, no native dependencies). They are procedural placeholders in the
Pashmore palette with woven micro-texture, drape folds and a vignette: correct aspect ratios,
correct filenames, correct colour story.

**Replace the files in place with real photography and nothing in the application changes.**
Paths are derived from slugs (`/images/products/{slug}-{n}.png`), and alt text is generated
per product in `data/products.ts` — descriptive sentences, never filenames.

```bash
npm run gen:images            # skips files that already exist
node scripts/generate-images.mjs --force   # regenerate everything
```

---

## Demo data

30 products, 33 collections, 8 journal articles, 9 landing pages, 4 policy pages and demo
orders/addresses. Products are built from a compact seed array through a builder that derives
images, variants, SKUs, specifications and care instructions, so nothing is repeated by hand
and every product is internally consistent.

The demo customer, orders and addresses in `data/account.ts` exist so the account area is
complete and reviewable before authentication is wired in.

---

## What is deliberately not built

These are UI-complete and validated but have no backend behind them — each is a single
service function away from being live:

* **Authentication.** `components/account/auth-form.tsx` validates properly and is the one
  place to call `signIn` / `signUp`.
* **Payments.** The checkout flow is complete through confirmation. `services/orders.ts`
  returns a plausible order number; for live Razorpay, create the order server-side and open
  the checkout handler with the returned id — the UI does not change.
* **Order lookup.** `/track-order` validates the reference format and reports "not found"
  rather than inventing a status.
* **Newsletter and contact.** Both validate and simulate the round trip;
  `services/newsletter.ts` already switches to a real POST when `NEXT_PUBLIC_API_BASE_URL`
  is set.
* **Wishlist sync.** Guests are stored locally; `context/wishlist-context.tsx` documents
  where the merge-on-sign-in belongs.

---

## Licence

Proprietary. Brand name, copy and imagery are original to this project.
