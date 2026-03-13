

## Pathao Courier Integration Plan

### What we're building

1. **Order status progression** on the Orders page: pending → approved → dispatched (dropdown per order)
2. **Courier settings tab** in dashboard for Pathao API credentials and store setup
3. **Edge function** to proxy Pathao API calls (auth, city/zone/area lookups, create order)
4. **Dispatch flow** that sends order data to Pathao when status changes to "dispatched"
5. **Checkout page update** to collect Pathao-compatible address data (city/zone/area dropdowns)

### Database changes

- **`courier_settings` table**: `id`, `store_id` (ref stores), `provider` (text, default "pathao"), `client_id`, `client_secret`, `client_email`, `client_password`, `access_token`, `refresh_token`, `token_expires_at`, `pathao_store_id` (integer), `created_at`. RLS: only store owner can read/write.
- **`orders` table**: add `pathao_consignment_id` (text, nullable) column to track dispatched orders. Update RLS to allow authenticated store owners to UPDATE their orders.

### New dashboard page: Courier Settings

- **`src/pages/DashboardCourier.tsx`** — form to enter Pathao client_id, client_secret, email, password. A "Connect" button that calls the edge function to issue a token and saves credentials. A section to create/select a Pathao store (name, contact, address, city/zone/area dropdowns). Status indicator showing connection health.
- Add "Courier" nav item to `DashboardLayout.tsx` and route in `App.tsx`.

### Edge function: `pathao-proxy`

Single edge function handling multiple actions via `action` field:

- **`issue-token`**: POST to `https://api-hermes.pathao.com/aladdin/api/v1/issue-token` with client credentials. Stores tokens in `courier_settings`.
- **`refresh-token`**: Auto-refreshes expired tokens.
- **`get-cities`**: GET `/aladdin/api/v1/countries/1/city-list`
- **`get-zones`**: GET `/aladdin/api/v1/cities/{city_id}/zone-list`
- **`get-areas`**: GET `/aladdin/api/v1/zones/{zone_id}/area-list`
- **`create-store`**: POST `/aladdin/api/v1/stores`
- **`create-order`**: POST `/aladdin/api/v1/orders` — maps our order data to Pathao's format (recipient_name, recipient_phone, recipient_address, store_id, delivery_type=48, item_type=2, amount_to_collect, recipient_city/zone/area IDs).

All calls check token expiry and auto-refresh before proceeding.

### Orders page updates

- Replace static status badge with a dropdown: **pending → approved → dispatched**
- On selecting "dispatched", trigger the `pathao-proxy` edge function with `create-order` action
- Show Pathao consignment ID after successful dispatch
- Update order status in database

### Checkout page updates

- For physical products, replace free-text city/state/zip with cascading dropdowns:
  - **City** → fetches zones → **Zone** → fetches areas → **Area**
- Store selected city_id, zone_id, area_id in the order (new columns or in `order_items` JSONB)
- Keep street address as free text (recipient_address for Pathao)

### Technical details

```text
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Dashboard   │────▶│ pathao-proxy │────▶│ Pathao API       │
│  / Checkout  │     │ edge function│     │ api-hermes.      │
│              │◀────│              │◀────│ pathao.com       │
└─────────────┘     └──────────────┘     └──────────────────┘
```

- Pathao credentials stored encrypted in `courier_settings` table (service_role access only from edge function)
- Token refresh handled transparently in edge function
- City/zone/area data cached client-side during checkout session

### File changes summary

| File | Action |
|------|--------|
| `supabase/functions/pathao-proxy/index.ts` | Create |
| `src/pages/DashboardCourier.tsx` | Create |
| `src/pages/DashboardOrders.tsx` | Update (status dropdown + dispatch) |
| `src/components/storefront/CheckoutPage.tsx` | Update (city/zone/area dropdowns) |
| `src/pages/DashboardLayout.tsx` | Update (add Courier nav) |
| `src/App.tsx` | Update (add courier route) |
| `supabase/config.toml` | Update (add pathao-proxy function) |
| DB migration | Create courier_settings table, add columns to orders |

