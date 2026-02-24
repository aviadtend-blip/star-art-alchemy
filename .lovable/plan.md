

# Celestial Artworks MVP — Implementation Plan

## COMPLETED (Phase 1)
- ✅ StepProgressBar component (4-step with checkmarks)
- ✅ BirthDataBar component (persistent birth data context)
- ✅ Landing page: rebranded to "Celestial Artworks", fixed hero copy, trust bar, social proof stats (2,000+/4.9/98%/23 countries), 4 steps without "AI", "The Perfect Gift" section, "Museum-Quality Materials" section, gallery relabeled, 10 FAQs, footer with contact info/social links
- ✅ Two-step birth data form: Step 1a (date+location inline), Step 1b (birth time modal with "I don't know" checkbox)
- ✅ Style Selection: 3 "Cosmic Collage" variants, "Most popular" badge, "Surprise me" CTA
- ✅ Loading Screen: full-page with Big Three cards, element balance, dominant element callout, rotating fun facts
- ✅ Size Selection: canvas-only ($79/$119/$179), removed frames/mat/text options
- ✅ Artwork Reveal: updated headline, CTA banner, testimonials section
- ✅ Order Confirmation: 4-step timeline, referral program, digital download, social share, post-purchase FAQ

## TODO (Phase 2-5)
- Phase 3: Supabase session persistence + order tracking tables
- Phase 4.1: Email capture modal gating "Download Preview"
- Phase 4.2: Stripe fixed Price IDs
- Phase 4.3: AI-generated unique hotspot explanations
- Phase 5: Email service, abandoned cart, new style models

## PART 1: COMPONENT AUDIT

### Routes

| Route | Component | Status |
|-------|-----------|--------|
| `/` | LandingPage | Partially built |
| `/generate` | GeneratorFlow | Partially built |
| `/order-confirmation` | OrderConfirmationPage | Partially built |

---

### Step 1: Landing Page (`LandingPage.jsx`)

| Section | Spec Requirement | Current State |
|---------|-----------------|---------------|
| Nav | "Celestial Artworks" brand | **Wrong** -- says "CosmicArt" |
| Hero headline | "Turn Your Birth Into Gallery-Worthy Art" | **Wrong** -- says "Transform Your Birth Chart Into Personalized Artwork" |
| Hero CTA | "Show me my artwork" (scrolls to form) | **Partially** -- button exists but copy differs |
| Trust bar | "Secure Payment, Free Shipping, 30-Day Guarantee" | **Missing** |
| Social proof stats | 2,000+ / 4.9 / 98% / 23 Countries | **Partially** -- stats exist but numbers wrong (12,847 instead of 2,000+), missing "23 Countries Shipped" |
| Interactive Example ("Sarah's Chart") | Sample artwork with placements labeled, hotspot explanations | **Missing entirely** |
| "Every Symbol Has Meaning" section | Numbered hotspot markers with hover/tap explanations | **Missing entirely** |
| "4 Simple Steps" process | Steps without mentioning "AI" | **Partially** -- exists but copy says "AI Creates Your Artwork" (violates brand rule) |
| "The Perfect Gift" section | "Impossible to Duplicate" positioning | **Missing** -- there's a generic "More Than Just Decoration" section instead |
| "Museum-Quality Materials" section | Archival paper, wood frames, anti-reflective glaze | **Missing** -- briefly mentioned in value props but not a dedicated section |
| Customer Gallery | "Real homes. Real customers." | **Partially** -- gallery exists but labeled as "Every Chart Tells a Different Story" (not spec) |
| Birth Data Form (Step 1a) | Date + Location inline, yellow "Continue" button | **Partially** -- form exists but all fields are on one page (no two-step modal), button is purple gradient not yellow |
| Birth Time Modal (Step 1b) | Dark overlay modal after date/location, "I don't know my birth time" checkbox | **Missing entirely** -- time is inline on same form, no modal, no checkbox |
| FAQ section | 10 specific questions per spec | **Partially** -- 6 FAQs exist, missing 4 from spec (sizes/frames, international shipping, examples, refund policy details) |
| Footer | "Celestial Artworks" brand, contact info, social links | **Partially** -- footer exists but says "CosmicArt", missing contact email/phone, missing social icons |

### Step 2: Style Selection (`StyleSelection.jsx`)

| Feature | Spec Requirement | Current State |
|---------|-----------------|---------------|
| Progress bar | Persistent 4-step bar with checkmarks | **Missing entirely** |
| Persistent birth data bar | "Creating artwork for: [Name], Born: [Date]..." with "Edit Birth Data" link | **Missing** -- there's a small chart summary but not matching spec |
| Headline | "Choose your artistic expression" | **Different** -- says "Choose Your Style" |
| Style cards | 3 cards: Bold & Vibrant, Minimal & Architectural, Organic & Flowing | **Wrong** -- shows 5 styles (Magical Pink, Neo Topograph, Celestial Ink, Vapor Dream, Sacred Geometry) instead of 3 "Cosmic Collage" variants |
| "Surprise me" CTA | Primary button that auto-selects | **Missing** |
| "Most popular" badge | On Minimal & Architectural card | **Missing** |
| Magnifying glass preview | Enlarged preview on each card | **Missing** |

### Loading Screen (Step 2 to Step 3 transition)

| Feature | Spec Requirement | Current State |
|---------|-----------------|---------------|
| Headline | "Calculating planetary positions..." | **Different** -- says "Creating Your Artwork..." |
| Chart summary | Big Three cards + Element balance cards + Dominant element callout | **Partially** -- small inline summary exists but not the full card layout from spec |
| Rotating fun facts | 3 rotating facts every few seconds | **Missing entirely** |
| Typical generation time display | "30-45 seconds" | **Partially** -- says "30-60 seconds" |
| Auto-redirect | Navigate to Step 3 on completion | **Works** |

### Step 3: Artwork Reveal (`ChartExplanation.jsx`)

| Feature | Spec Requirement | Current State |
|---------|-----------------|---------------|
| Progress bar | Step 3 active | **Missing** |
| Headline | "Meet Your Cosmic Masterpiece" | **Different** -- says "Your Personalized Birth Chart Artwork" |
| Numbered hotspots on artwork | Clickable numbered markers on the image itself | **Missing** -- explanations are in a list beside the image, not overlaid as numbered hotspots |
| Unique hotspot text | Each hotspot generated from interpretation layer | **Partially** -- explanations come from `generateExplanation.js` using lookup tables, NOT from the AI narrative. They are template-based, not unique per chart beyond the sign name |
| Thumbnail strip | Multiple views below artwork | **Missing** |
| CTA banner | Dark starfield, "Frame it. Hang it. Treasure it forever.", "Choose Your Size ($79-$179)" | **Different** -- simpler CTA, no starfield background, different copy |
| "Download Preview (Free)" | Triggers email capture modal | **Missing email gate** -- currently downloads directly with no modal |
| Trust elements | Free shipping, 30-day guarantee, secure checkout, same-day processing | **Partially** -- trust line exists but incomplete |
| "Try a Different Style" link | Returns to Step 2 | **Exists** -- in GeneratorFlow |
| Testimonials section | 4.9/5 from 287 customers, review cards with photos | **Missing** on this page (only on ProductCustomization) |

### Step 4: Size Selection (`ProductCustomization.jsx`)

| Feature | Spec Requirement | Current State |
|---------|-----------------|---------------|
| Progress bar | Step 4 active | **Missing** |
| Sizes | 12x18" ($79), 16x24" ($119), 20x30" ($179), canvas only | **Wrong** -- shows 12x16" ($79), 18x24" ($129), 24x32" ($199) AND includes frame/mat/text options (spec says canvas only for MVP) |
| "Most popular" badge | On 16x24 | **Exists** but on wrong size (18x24) |
| Frame options | None for MVP (canvas only) | **Violates spec** -- 5 frame options shown |
| Mat board option | None for MVP | **Violates spec** -- mat board add-on shown |
| Custom text option | None for MVP | **Violates spec** -- custom text add-on shown |
| Recommendation text | "We recommend 16x24 for most spaces" | **Different** -- says 18x24 |
| Artwork mockup | Frame mockup + thumbnail gallery | **Partially** -- preview exists with frame overlay but no thumbnail strip |
| Order summary | Size, subtotal, free shipping, total | **Partially** -- works but includes frame/mat/text line items |
| CTA text | "Continue to Secure Checkout -- $[total]" | **Close** -- says "Proceed to Checkout -- $[total]" |
| Persistent birth data bar | Shows chart info + "Edit Birth Data" | **Missing** |

### Order Confirmation (`OrderConfirmation.jsx`)

| Feature | Spec Requirement | Current State |
|---------|-----------------|---------------|
| No progress bar | Correct | **Correct** |
| "Order Confirmed!" | With thank you message | **Exists** |
| Order number, date, artwork thumbnail | With placements listed | **Partially** -- session ID shown, artwork shown if available, but page loses state on refresh (no session persistence) |
| "What Happens Next" timeline | 4-step visual timeline with dates | **Partially** -- 3 steps shown, not matching spec's 4-step format |
| Expected delivery date | Date range calculated | **Exists** |
| Referral program | "Give $10, Get $10" with personal code (e.g., SARAH10) | **Wrong** -- shows "FRIEND10" discount code and "10% off" (violates discount rules) |
| Digital download | "Download High-Resolution File" button | **Missing** |
| Social share icons | X, Instagram, LinkedIn, Facebook, WhatsApp, Email | **Missing** |
| Post-purchase FAQ | 4 specific questions | **Missing** |

### Progress Bar Component

| Feature | Current State |
|---------|---------------|
| Reusable component | **Missing entirely** -- no progress bar exists anywhere |

---

## PART 2: PIPELINE CHECK

### Data Pipeline Status

```text
Birth Form --> Google Places Autocomplete --> Prokerala API --> Chart Data
     [OK]              [OK]                       [OK]           [OK]

Chart Data --> buildInterpretationLayer --> ai-interpret edge fn --> 3-sentence narrative
   [OK]              [OK]                       [OK]                    [OK]

Narrative --> promptBuilder --> "magicalpink" trigger --> Replicate FLUX.1 Dev
   [OK]          [OK]               [OK]                      [OK]

Image URL --> Artwork Display --> Hotspot Explanations
   [OK]          [OK]             [ISSUE: template-based, not from AI narrative]
```

**Pipeline issues found:**

1. **Geocoding**: Landing page uses Google Places API (correct), but the edge function has a Nominatim fallback (used when no lat/lng passed). The spec says Google Maps only. Low risk since Places passes coordinates.

2. **Hotspot explanations are NOT unique**: `generateExplanation.js` uses static lookup tables (same text for every Virgo Sun, every Gemini Moon, etc.). The spec requires each hotspot to have unique content generated from the interpretation layer. Currently the AI narrative is only injected into the image prompt, not used for explanations.

3. **Art style mismatch**: The spec defines 3 "Cosmic Collage" variants (Bold & Vibrant, Minimal & Architectural, Organic & Flowing). The codebase has 5 different styles (Magical Pink, Neo Topograph, Celestial Ink, Vapor Dream, Sacred Geometry). Only Magical Pink has a trained model.

4. **Image generation parameters**: Edge function uses 28 inference steps / 90% quality. Spec target is 50 steps / 100% quality / 1024x1365 resolution. Current settings are fine for MVP speed, but should be configurable.

---

## PART 3: INTEGRATION GAPS

| Integration | Status | Priority |
|-------------|--------|----------|
| Supabase database (session persistence) | **Missing** -- no tables exist, all state is in React memory. Refreshing any page loses everything. | HIGH |
| Supabase database (order tracking) | **Missing** -- orders only exist in Stripe metadata | HIGH |
| Email capture modal | **Missing** -- "Download Preview" bypasses email gate entirely | HIGH |
| Stripe checkout | **Exists** -- `create-payment` edge function works, but uses dynamic `price_data` instead of fixed Stripe Price IDs (harder to track) | MEDIUM |
| Email service (order confirmations) | **Missing** -- no email integration at all | MEDIUM |
| Email service (abandoned cart) | **Missing** | LOW (post-MVP) |
| Abandoned checkout webhook | **Missing** | LOW (post-MVP) |

---

## PART 4: PRIORITIZED IMPLEMENTATION PLAN

### Phase 1: Fix Foundations (Critical Path)

**1.1 Create Progress Bar Component**
- Build a reusable `<ProgressBar step={1-4} />` component
- 4 steps: "Enter data", "Choose style", "Preview", "Size"
- Completed steps show checkmarks, active step highlighted in pink/coral
- Add to Steps 1-4 pages

**1.2 Create Persistent Birth Data Bar**
- Build a `<BirthDataBar />` component showing "Creating artwork for: [Name], Born: [Date] at [Time] in [City]"
- Include "Edit Birth Data" link
- Add to Steps 2, 3, and 4

**1.3 Fix Landing Page Copy and Structure**
- Rename all "CosmicArt" to "Celestial Artworks"
- Update hero headline to spec copy
- Fix "How It Works" to remove "AI" language
- Add missing trust bar
- Fix social proof numbers (2,000+ not 12,847)
- Add missing FAQ questions
- Update footer with contact info, social links

**1.4 Split Birth Data Form into Two Steps**
- Step 1a: Name + Birth Date + Birth Location (inline on landing page)
- Step 1b: Birth Time modal (dark overlay) with hour/minute/AM-PM dropdowns and "I don't know my birth time" checkbox
- Yellow "Continue" buttons on both

### Phase 2: Fix Step Flow (Core Experience)

**2.1 Fix Style Selection**
- Rename 3 cards to "Cosmic Collage -- Bold & Vibrant", "Cosmic Collage -- Minimal & Architectural", "Cosmic Collage -- Organic & Flowing"
- Add "Most popular" badge to Minimal & Architectural
- All route to magicalpink model for MVP
- Add "Surprise me" primary CTA button

**2.2 Rebuild Loading Screen**
- Full-page loading screen with chart summary cards (Big Three as 3-column cards)
- Element balance cards (4-column)
- Dominant element callout
- Rotating fun facts bar (3 facts cycling every 4 seconds)
- Remove "AI" language

**2.3 Rebuild Artwork Reveal (Step 3)**
- Headline: "Meet Your Cosmic Masterpiece"
- Add numbered hotspot markers (1-4) overlaid on the artwork image
- Generate unique hotspot text using AI interpretation data (not static lookup tables)
- Desktop: artwork left with hotspots, scrollable explanations right
- Add CTA banner with dark starfield background
- Add email capture modal gating the "Download Preview (Free)" button
- Add testimonials section (3 review cards)

**2.4 Fix Size Selection (Step 4)**
- Change sizes to 12x18" ($79), 16x24" ($119 Most Popular), 20x30" ($179)
- Remove all frame options, mat board, and custom text (canvas only for MVP)
- Update order summary to reflect canvas-only
- Update CTA to "Continue to Secure Checkout -- $[total]"

**2.5 Fix Order Confirmation**
- Add 4-step "What Happens Next" timeline matching spec (NOW/TODAY/THIS WEEK/NEXT WEEK)
- Remove discount code display (violates brand rules)
- Add referral section with personal code (no discount amount shown)
- Add digital download button
- Add social share icons
- Add post-purchase FAQ accordion

### Phase 3: Session Persistence (Backend)

**3.1 Supabase Database Schema**
Create tables:
- `sessions` -- store birth data, chart data, generated image URLs, selected style, step progress (keyed by anonymous session ID stored in localStorage)
- `orders` -- store order details, Stripe session ID, chart data, delivery status

**3.2 Session Persistence Logic**
- On form submit: save session to Supabase, store session ID in localStorage
- On page load: check localStorage for session ID, restore state from Supabase
- Order confirmation page: fetch order details from Supabase using Stripe session ID

### Phase 4: Email and Checkout Polish

**4.1 Email Capture Modal**
- Modal on "Download Preview (Free)" button
- Email input + "Send me my artwork" CTA
- Store email in Supabase `email_captures` table
- Deliver hi-res preview link after capture

**4.2 Stripe Checkout Cleanup**
- Create fixed Stripe Products and Prices for the 3 canvas sizes ($79, $119, $179)
- Update `create-payment` to use Price IDs instead of dynamic `price_data`
- Pass email from capture modal to pre-fill Stripe checkout

**4.3 Unique Hotspot Explanations**
- Extend the `ai-interpret` edge function (or add a second call) to generate 4 unique hotspot descriptions
- Each hotspot: placement name + 2-paragraph explanation of what the visual element represents and where to find it
- Replace static `generateExplanation.js` lookups with AI-generated content

### Phase 5: Post-MVP (Not blocking launch)

- Email service integration (SendGrid/Resend) for order confirmations
- Abandoned cart webhook (1 hour post-Stripe-expiry)
- Additional LoRA style models
- "Every Symbol Has Meaning" interactive section on landing page
- "Sarah's Chart" interactive example on landing page
- Exit-intent popup

---

### Implementation Sequence Summary

```text
Phase 1 (Foundation):
  1.1 Progress Bar component
  1.2 Birth Data Bar component
  1.3 Landing page copy/structure fixes
  1.4 Two-step birth data form with modal

Phase 2 (Core Flow):
  2.1 Style Selection card fixes
  2.2 Loading screen rebuild
  2.3 Artwork Reveal rebuild (hotspots, email gate, testimonials)
  2.4 Size Selection simplification (canvas only, correct prices)
  2.5 Order Confirmation rebuild

Phase 3 (Backend):
  3.1 Supabase tables (sessions, orders)
  3.2 Session persistence logic

Phase 4 (Polish):
  4.1 Email capture modal
  4.2 Stripe Price IDs
  4.3 AI-generated unique hotspot explanations

Phase 5 (Post-MVP):
  Email service, abandoned cart, new styles, landing page interactive sections
```

Each phase can be implemented as a series of focused prompts. Phases 1-2 are pure frontend. Phase 3 requires database work. Phase 4 ties it all together.

