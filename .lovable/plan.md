

# Vendor Onboarding Flow — Build Plan

## What you picked
- **Guided multi-step wizard** — must complete to enter dashboard
- **Bilingual toggle** (English / বাংলা) at top of every screen
- **Required to publish**: store name + slug + 1 product + 1 delivery option + COD enabled
- **Teaching moment**: "First Order Simulation" after setup completes

---

## The 6-step wizard (analyzed from Shopify, Stripe, Daraz Seller, Linear, Notion)

### Step 0 — Welcome & language
- Big "Welcome to InstaSellr 🎉" / "স্বাগতম"
- Language toggle (EN / বাংলা) — saved to localStorage, applies to whole wizard
- 3 bullet promises: "Take orders from Instagram DMs · Auto-reply in Bangla · Ship via Pathao"
- Progress bar: 0/6
- One CTA: "Let's set up your store →"

### Step 1 — Store basics
- **Store name** (required) — e.g. "Aarong Boutique"
- **Store URL** (required, auto-slugged from name, editable) — shows live preview `instasellr.app/store/aarong-boutique`
- **One-line bio** (optional) — placeholder: "Premium handcrafted kurtis from Dhaka"
- **Avatar initials** (auto-generated from name, editable)
- Inline hint: "You can change this later in Settings"

### Step 2 — Branding (logo + accent color)
- **Logo upload** (optional, drag-drop, fallback to colored initials avatar)
- **Accent color** picker — 6 preset swatches + custom hex
- Live preview card showing how the storefront header will look
- "Skip for now" link → uses initials + default color

### Step 3 — Add your first product (the most critical step)
- **Pre-filled example** vendor can edit OR clear: "Cotton Kurti — ৳1200"
- Fields: Name (req), Price ৳ (req), Photo (optional, with helpful "Use a clear product photo on white background" hint), Tagline, Material (auto-feeds chatbot knowledge), Care instructions (auto-feeds chatbot)
- Mini explainer above fields: "💡 Material & care info help the AI chatbot answer customer DMs automatically"
- "Add another later" — only 1 required to proceed

### Step 4 — Delivery charges (Bangladesh-specific)
- **Pre-filled smart defaults** (vendor can edit/delete):
  - Inside Dhaka — ৳60
  - Outside Dhaka — ৳120
- Add custom option button
- Mini explainer: "Customers will pick one of these at checkout. ৳0 = free delivery."

### Step 5 — Payment (COD by default)
- ✅ Cash on Delivery (toggled ON, recommended badge)
- ⏸ bKash / Nagad — "Coming soon" or "Set up later in Settings"
- One-line copy: "Most Bangladesh stores start with COD only. You can add bKash later."

### Step 6 — Almost done! (review screen)
- Summary card: store name, URL, 1 product, delivery options, COD on
- Big green "Publish my store 🚀" button
- Secondary: "← Edit anything"

---

## After publish: First Order Simulation 🎁

Triggered automatically when wizard completes:

1. **Confetti animation** + "Your store is live!" with copy-link button & WhatsApp/Facebook share buttons
2. **Auto-creates a fake test order** in the database (clearly labeled `[TEST ORDER]`, customer = "Demo Customer", easily deletable)
3. **Animated guided tour** (3 spotlights, dismissible):
   - Spotlight on **Orders tab**: "Your first test order just arrived! Click to see what real orders look like."
   - Spotlight on **Inbox**: "When customers DM you on Instagram, the AI replies here. Try it!"
   - Spotlight on **Share Store**: "Copy your store link and post it to your Instagram bio."
4. Persistent dismissible card on dashboard: *"Next steps to grow: connect Pathao courier · set up Meta pixel · add chatbot FAQs"* — links to those pages, vendor can dismiss

---

## Technical implementation

### New files
- `src/pages/Onboarding.tsx` — wizard shell with progress bar, step routing, language context
- `src/components/onboarding/StepWelcome.tsx`
- `src/components/onboarding/StepStoreBasics.tsx`
- `src/components/onboarding/StepBranding.tsx`
- `src/components/onboarding/StepFirstProduct.tsx`
- `src/components/onboarding/StepDelivery.tsx`
- `src/components/onboarding/StepPayment.tsx`
- `src/components/onboarding/StepReview.tsx`
- `src/components/onboarding/SuccessCelebration.tsx` — confetti + share + tour trigger
- `src/components/onboarding/CoachMark.tsx` — spotlight overlay for dashboard tour
- `src/lib/onboardingCopy.ts` — bilingual EN/বাংলা strings for every label
- `src/hooks/use-onboarding-status.ts` — checks if user has completed onboarding

### Routing changes (`src/App.tsx`)
- New route `/onboarding` (guarded, requires auth)
- `AuthGuard` checks: if user logged in AND store has no products AND `onboarding_completed=false` → redirect to `/onboarding`
- Once complete → redirect to `/dashboard` with `?firstTime=true` to trigger tour

### Database (one tiny migration)
Add to `stores` table:
- `onboarding_completed BOOLEAN DEFAULT false`
- `onboarding_step INTEGER DEFAULT 0` (resume where they left off)
- `preferred_language TEXT DEFAULT 'en'` (en | bn)

### Test order seeding
When wizard completes, insert one row into `orders` with `customer_name = 'Demo Customer (Test)'`, status `pending`, amount = first product's price + cheapest delivery. Vendor can delete it from the Orders page.

### Accessibility & polish
- Each step has back button (except Welcome)
- Form validation with friendly Bangla/English error messages
- "Save & exit" link top-right — saves progress, can resume later
- Keyboard navigable (Enter advances, Esc nothing destructive)
- Mobile-first (393px viewport you're testing on) — all steps single-column, sticky bottom CTA

---

## What I will NOT touch this round
- Existing dashboard pages (only adding a coach-mark overlay layer)
- Existing storefront, checkout, chatbot logic
- Pathao courier setup (lives in Settings, mentioned in "next steps" card only)
- Meta pixel setup (lives in Settings, mentioned in "next steps" card only)

This keeps the change scoped, low-risk, and entirely additive.

