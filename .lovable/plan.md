

## Digital-First Funnel (`/d/` prefix)

### Overview
A parallel funnel that sells the digital artwork as the primary product, with canvas as a secondary upsell on the preview page. Reuses the existing generator infrastructure (context, styles, loading, edge functions). The canvas size selection page is the existing `/generate/size` page, navigated to directly when the user clicks the canvas upsell.

### Flow

```text
Current funnel:        /  →  /generate  →  /generate/product  →  /generate/style  →  /generate/loading  →  /generate/preview  →  /generate/size
Digital funnel:       /d/ →  /d/generate →                       /d/style          →  /d/loading         →  /d/preview         →  /generate/size
                                              (no product step)                                              (digital CTA primary,    (reused as-is)
                                                                                                              canvas upsell secondary)
```

### What to build

**1. Funnel mode flag in GeneratorContext**
- Add a `funnelMode` state (`'default' | 'digital'`) to the context.
- Adjust `handleFormSubmit` to skip `/generate/product` and go straight to `/d/style` when mode is `'digital'`.
- Adjust `handleGetFramed` to navigate to `/generate/size` (reused page) regardless of funnel mode.
- Add a `handleDigitalCheckout` callback for purchasing the digital edition (separate Shopify product/variant).

**2. New pages (shells reusing existing components)**
- `src/pages/Digital/DigitalIndex.tsx` — Landing page for `/d/`. Initially a shell with different hero copy/imagery, reusing the `BirthDataFormCard`. You'll provide the actual copy later.
- `src/pages/Digital/DigitalStyle.jsx` — Thin wrapper around existing `GenerateStyle`, sets `funnelMode = 'digital'` on mount.
- `src/pages/Digital/DigitalLoading.jsx` — Reuses `GenerateLoading` as-is (or direct re-export).
- `src/pages/Digital/DigitalPreview.jsx` — Modified preview page: primary CTA is "Get Your Digital Artwork" (single price), secondary CTA is "Upgrade to Canvas" linking to `/generate/size`.

**3. Routes in App.tsx**
Add the `/d/` routes alongside existing ones:
```
/d/           → DigitalIndex
/d/style      → DigitalStyle
/d/loading    → DigitalLoading
/d/preview    → DigitalPreview
```
Canvas upsell routes to existing `/generate/size` — no new page needed.

**4. Digital pricing config**
- Add `src/lib/digitalProduct.js` with a single price constant (placeholder, e.g. `$29`) and product metadata for checkout.

**5. Modified Preview CTA layout (DigitalPreview)**
- Reuses `ChartExplanation` component but overrides the CTA section:
  - Primary button: "Get Your Digital Artwork — $XX"
  - Secondary link/button: "Want it on canvas?" → navigates to `/generate/size`

### What's reused (no changes)
- `GeneratorContext` (extended, not replaced)
- `BirthDataForm` / `BirthDataFormCard`
- `StyleSelection` / `StyleCarousel`
- `LoadingScreen`
- `ChartExplanation` (with CTA override)
- `GenerateSize` page (canvas upsell destination)
- All edge functions (store-artwork, create-shopify-checkout, etc.)

### Technical notes
- The `funnelMode` flag is persisted in sessionStorage alongside other generator state so refreshes preserve the correct flow.
- Navigation guards in `handleFormSubmit` check `funnelMode` to route to `/d/style` vs `/generate/product`.
- The digital checkout will call the same `create-shopify-checkout` edge function with a different Shopify variant ID (to be configured).

