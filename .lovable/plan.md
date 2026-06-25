## Desktop Storefront Redesign

Mobile (≤lg) stays exactly as today — App-Store-feel 480px column. Only `lg:` and up changes.

### New desktop storefront (`lg:` breakpoint and up)

Replace the 340px sticky-sidebar layout in `src/pages/Storefront.tsx` with a true ecommerce storefront:

```text
┌──────────────────────────────────────────────────────────────┐
│  TOP NAV (sticky, blurred)                                   │
│  [logo+name (i)]   [search input — wide]   [links] [⭐] [🛒] │
├──────────────────────────────────────────────────────────────┤
│  HERO BAND (full-width inside max-w-7xl)                     │
│  ┌─ store identity ──────────┐ ┌─ banner / featured ──────┐  │
│  │ avatar · name · bio       │ │ banner_url or            │  │
│  │ rating · products · ship  │ │ first popular product    │  │
│  │ [socials]  [referral pill]│ │ as a CTA card (4:5)      │  │
│  └───────────────────────────┘ └──────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  CATEGORIES — horizontal rail, 5–6 visible, scroll for more  │
├──────────────────────────────────────────────────────────────┤
│  MOST POPULAR — horizontal rail (only if ≥3 popular)         │
├──────────────────────────────────────────────────────────────┤
│  ACTIVE BUNDLES — 2-up grid                                  │
├──────────────────────────────────────────────────────────────┤
│  ALL PRODUCTS — 4-col grid (xl: 5-col), with category chips  │
│  on top to filter inline (no separate "Shop All" page on lg) │
├──────────────────────────────────────────────────────────────┤
│  FOOTER — footer_image, links, social, store info link       │
└──────────────────────────────────────────────────────────────┘
```

Key behaviors:
- `max-w-7xl mx-auto` content container with `px-8`. Hero band gets a subtle tinted background using `store.accent_color` at ~6% alpha.
- Sticky top nav with `backdrop-blur` + 1px border. Cart button moves into the nav on desktop (hide the floating `CartButton`); mobile keeps the floating button.
- Search bar is inline and live-filters the All Products grid on desktop (does not navigate away). On mobile it still navigates to `/store/:slug/search`.
- Seller info (i) opens the same `Sheet` from bottom; on desktop it opens as a right-side drawer instead.
- Category rail: tapping a category scrolls to All Products and applies a chip filter; chips also live above the grid.
- Product grid: `lg:grid-cols-4 xl:grid-cols-5`, slightly larger cards (existing `ProductList` only needs a grid-cols tweak via a prop or a `lg:` class).

Files touched:
- `src/pages/Storefront.tsx` — replace the `lg:grid-cols-[340px_1fr]` block with new top-nav + sectioned layout. Keep all data fetching and mobile rendering paths untouched.
- `src/components/storefront/StoreHeader.tsx` — add a compact horizontal variant for the hero band.
- `src/components/storefront/ProductList.tsx` — bump max columns to `xl:grid-cols-5`.
- `src/components/storefront/CartButton.tsx` — hide on `lg:` (cart now in nav).
- New: `src/components/storefront/DesktopNav.tsx` — sticky top nav with logo, search, links, rating button, cart button.
- New: `src/components/storefront/DesktopHero.tsx` — hero band (identity + banner/featured card).

### New desktop checkout (Stripe-style split screen)

Replace the current two-column-with-sticky-summary in `src/components/storefront/CheckoutPage.tsx` for `lg:` and up:

```text
┌───────────────────────────┬──────────────────────────────────┐
│ LEFT (dark branded panel) │ RIGHT (white form area)          │
│ store_bg = accent_color   │ centered max-w-[520px]           │
│                           │                                  │
│  ← Back to store          │  Contact                         │
│  [logo] Store name        │  [email] [phone]                 │
│                           │                                  │
│  Order summary            │  Shipping                        │
│  ─ item rows w/ thumb     │  [name] [address …]              │
│  ─ subtotal               │  [Inside/Outside Dhaka]          │
│  ─ shipping               │                                  │
│  ─ discount (if referral) │  Payment                         │
│  ═ Total (large)          │  [COD / bKash / Card …]          │
│                           │                                  │
│  Trust row: 🔒 Secure ·   │  [ Place order — full width ]    │
│  ↩ Easy returns ·         │                                  │
│  📞 Support               │  Terms · Privacy                 │
└───────────────────────────┴──────────────────────────────────┘
```

- Left panel uses `store.accent_color` as background with auto-contrast foreground; falls back to neutral dark if accent is too light. Width `lg:w-[44%]`, sticky.
- Right panel scrolls; "Place order" CTA is sticky to the bottom of the viewport on desktop.
- Mobile layout stays as today (single column, summary on top).

Files touched:
- `src/components/storefront/CheckoutPage.tsx` — split the existing JSX into `<DesktopSplit>` and `<MobileStack>` wrappers; reuse the same form state/handlers; no business logic changes.
- New: `src/components/storefront/CheckoutSummaryPanel.tsx` — left dark panel (also reusable on mobile collapsed).

### Out of scope

- No color/typography changes; each store keeps its tokens.
- No changes to data fetching, cart logic, edge functions, RLS, or pricing.
- No changes to the dashboard.
- Mobile layouts are not touched.
