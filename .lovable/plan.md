# App Audit — What's Off

## Security / Database

1. **4 permissive RLS policies (WARN)** — newly added INSERT/UPDATE policies use `WITH CHECK (true)`:
   - `reviews` "Anon submit review" / "Authenticated submit review"
   - `stores` and `reviews` permissive SELECT-style helpers introduced in the last security pass
   - Fix: scope each to a real condition (e.g. `EXISTS store`, `auth.uid() = user_id`).

2. **Custom domain feature is fake** — `DashboardSettings.tsx` stores the domain in `localStorage` only. No backend record, no DNS verification, no routing. Shipping this misleads users.

3. **`pg_net` reinstall side effects** — the recent `DROP EXTENSION pg_net; CREATE EXTENSION ... SCHEMA extensions` would have dropped any `net.http_post` triggers / cron jobs that depended on it. Worth verifying recovery/learn cron is still scheduled.

4. **Service worker exclusion for `/~oauth/`** — memory says it must exist; worth confirming the PWA SW still excludes auth callback paths after recent changes.

## Functionality / UX

5. **Routing oddity** — `dashboard/orders` redirects to `/dashboard` (index = `DashboardOrders`), so the sidebar "Orders" link likely double-navigates or breaks active state.

6. **`CheckoutPage.tsx` is 553 lines** — single component handling cart, address, courier, payment, COD/digital/bank, referral. Hard to maintain and a known source of regressions; should be split.

7. **No global error boundary** — a thrown render in any storefront page shows a blank screen instead of a fallback.

8. **Storefront `select("*")` already replaced for stores**, but other storefront reads (`products`, `categories`, `reviews`) still use `select("*")` — fine today but couples client to schema changes.

9. **Search page reloads everything** — `StorefrontSearch.tsx` re-fetches store + all products on mount instead of reusing the cached data from the storefront. Slow on mobile.

10. **Random product shuffle on every render** — `useMemo` keyed on `products` reshuffles whenever the array reference changes; jumps positions on refetch.

## Code Health

11. **`src/integrations/supabase/types.ts` is hand-edited** — repeated `as any` casts in pages (`referral_campaigns as any`, `reviews as any`, `chatbot_* as any`) suggest the generated types are stale. Should regenerate.

12. **Sample data still imported** (`src/data/sampleData.ts`) in several pages even though stores are live — dead code path, larger bundle.

13. **No tests cover the new flows** — categories, popular toggle, reviews visibility, custom domain UI all untested. `src/test/example.test.ts` is the only test file.

14. **Magic numbers / strings** — `185.158.133.1`, `ns1.lovable.app`, `30 * 86400000` (NEW badge), `48 * 3600` (download expiry) repeated across files instead of central constants.

15. **`OrderNotification` uses `console.error` for audio failures** but no user-facing fallback — sound permission denial is silent.

## What I'd Tackle First

| Priority | Item |
|----------|------|
| P0 | Fix the 4 permissive RLS warnings |
| P0 | Decide custom-domain: build it properly (backend + verification) or remove the UI |
| P1 | Verify pg_net dependents still work; confirm cron jobs intact |
| P1 | Split CheckoutPage; add error boundary |
| P2 | Regenerate Supabase types; remove `as any` |
| P2 | Stabilize storefront shuffle; reuse store data in search page |
| P3 | Centralize constants; add tests for new tabs |

## Next Step

Tell me which of these you want fixed and I'll scope a focused build pass. If you want everything, I'll group them into 2–3 sequential PR-sized passes (security → checkout split → polish).
