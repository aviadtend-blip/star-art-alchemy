/**
 * imageManifest.ts
 *
 * Central registry of every image used in the funnel, grouped by route.
 * Priority tiers:
 *   'high'   – LCP / first-visible image. Preloaded first.
 *   'normal' – Above-the-fold. Preloaded concurrently after high.
 *   'low'    – Below-the-fold / carousel overflow. Preloaded last.
 *
 * Import convention: use Vite's static asset imports so the hash-based
 * filenames are resolved correctly in production builds.
 */

// ─── Landing / Index ──────────────────────────────────────────────────────────
import heroDesktop        from '@/assets/hero-desktop.webp';
import heroMobile         from '@/assets/hero-mobile.webp';
import heroCustomer1      from '@/assets/hero/customer-1.webp';
import heroCustomer2      from '@/assets/hero/customer-2.webp';
import heroCustomer3      from '@/assets/hero/customer-3.webp';
import heroCustomer4      from '@/assets/hero/customer-4.webp';
import heroCustomer5      from '@/assets/hero/customer-5.webp';
import heroCustomer6      from '@/assets/hero/customer-6.webp';
import hotspotExample     from '@/assets/gallery/hotspot-example.webp';
import emmaChart          from '@/assets/gallery/emma-chart.webp';
import danielChart        from '@/assets/gallery/daniel-chart.webp';
import jamesChart         from '@/assets/gallery/james-chart.webp';
import mariaChart         from '@/assets/gallery/maria-chart.webp';
import capricornWall      from '@/assets/gallery/capricorn-wall.jpg';
import taurusArtwork      from '@/assets/gallery/taurus-artwork.jpg';
import womanHolding       from '@/assets/gallery/woman-holding.webp';
import galaxyBg           from '@/assets/gallery/../galaxy-bg.jpg';
import saturnPlanet       from '@/assets/gallery/saturn-planet.jpg';
import canvasDetail       from '@/assets/gallery/canvas-detail.jpg';
import libraWall          from '@/assets/gallery/libra-wall.jpg';
import virgoArtwork       from '@/assets/gallery/virgo-artwork.jpg';
import gallery2           from '@/assets/gallery/example-2.jpg';
import gallery3           from '@/assets/gallery/example-3.jpg';
import moonSurface        from '@/assets/gallery/moon-surface.jpg';
import earthSpace         from '@/assets/gallery/earth-space.jpg';
import capricornGallery   from '@/assets/gallery/capricorn-gallery.jpg';
import taurusExample      from '@/assets/gallery/taurus-example.jpg';
import customerDisplay1   from '@/assets/gallery/customer-display-1.webp';
import customerDisplay2   from '@/assets/gallery/customer-display-2.webp';
import customerDisplay3   from '@/assets/gallery/customer-display-3.webp';
import customerDisplay4   from '@/assets/gallery/customer-display-4.webp';
import customerDisplay5   from '@/assets/gallery/customer-display-5.webp';
import customerDisplay6   from '@/assets/gallery/customer-display-6.webp';
import customerDisplay7   from '@/assets/gallery/customer-display-7.webp';
import customerDisplay8   from '@/assets/gallery/customer-display-8.webp';
import customerDisplay9   from '@/assets/gallery/customer-display-9.webp';
import customerDisplay10  from '@/assets/gallery/customer-display-10.webp';
import review1            from '@/assets/gallery/reviews/review-1.webp';
import review2            from '@/assets/gallery/reviews/review-2.webp';
import review3            from '@/assets/gallery/reviews/review-3.webp';
import review4            from '@/assets/gallery/reviews/review-4.webp';
import review5            from '@/assets/gallery/reviews/review-5.webp';
import review6            from '@/assets/gallery/reviews/review-6.webp';
import review7            from '@/assets/gallery/reviews/review-7.webp';
import review8            from '@/assets/gallery/reviews/review-8.webp';
import review9            from '@/assets/gallery/reviews/review-9.webp';
import footerBg           from '@/assets/footer-bg.jpg';
import footerMobileBg     from '@/assets/footer-mobile-bg.jpg';

// ─── /generate (entry form) ────────────────────────────────────────────────────
import starsBg            from '@/assets/stars-bg.jpg';

// ─── /generate/style ──────────────────────────────────────────────────────────
import prismThumb         from '@/assets/gallery/styles/prism-storm-thumb.webp';
import prism2             from '@/assets/gallery/styles/prism-storm-2.webp';
import prism3             from '@/assets/gallery/styles/prism-storm-3.webp';
import prism4             from '@/assets/gallery/styles/prism-storm-4.webp';
import folkThumb          from '@/assets/gallery/styles/folk-oracle-thumb.webp';
import folk2              from '@/assets/gallery/styles/folk-oracle-2.webp';
import folk3              from '@/assets/gallery/styles/folk-oracle-3.webp';
import folk4              from '@/assets/gallery/styles/folk-oracle-4.webp';
import fableThumb         from '@/assets/gallery/styles/cosmic-fable-thumb.webp';
import fable2             from '@/assets/gallery/styles/cosmic-fable-2.webp';
import fable3             from '@/assets/gallery/styles/cosmic-fable-3.webp';
import fable4             from '@/assets/gallery/styles/cosmic-fable-4.webp';
import paperThumb         from '@/assets/gallery/styles/paper-carnival-thumb.webp';
import paper2             from '@/assets/gallery/styles/paper-carnival-2.webp';
import paper3             from '@/assets/gallery/styles/paper-carnival-3.webp';
import paper4             from '@/assets/gallery/styles/paper-carnival-4.webp';
import redThumb           from '@/assets/gallery/styles/red-eclipse-thumb.webp';
import red2               from '@/assets/gallery/styles/red-eclipse-2.webp';
import red3               from '@/assets/gallery/styles/red-eclipse-3.webp';
import red4               from '@/assets/gallery/styles/red-eclipse-4.webp';
import collisionThumb     from '@/assets/gallery/styles/cosmic-collision-thumb.webp';
import collision2         from '@/assets/gallery/styles/cosmic-collision-2.webp';
import collision3         from '@/assets/gallery/styles/cosmic-collision-3.webp';
import collision4         from '@/assets/gallery/styles/cosmic-collision-4.webp';

// ─── /generate/loading ────────────────────────────────────────────────────────
import artistGif          from '@/assets/artist-painting.gif';

// ─── /generate/preview & /generate/size (mockups) ────────────────────────────
import mockup12x18_1      from '@/assets/mockups/12x18/mockup-1.webp';
import mockup12x18_2      from '@/assets/mockups/12x18/mockup-2.webp';
import mockup12x18_3      from '@/assets/mockups/12x18/mockup-3.webp';
import mockup12x18_4      from '@/assets/mockups/12x18/mockup-4.webp';
import mockup12x18_5      from '@/assets/mockups/12x18/mockup-5.webp';
import mockup12x18_6      from '@/assets/mockups/12x18/mockup-6.webp';
import mockup12x18_7      from '@/assets/mockups/12x18/mockup-7.webp';
import mockup12x18_8      from '@/assets/mockups/12x18/mockup-8.webp';
import mockup16x24_1      from '@/assets/mockups/16x24/mockup-1.webp';
import mockup16x24_2      from '@/assets/mockups/16x24/mockup-2.webp';
import mockup16x24_3      from '@/assets/mockups/16x24/mockup-3.webp';
import mockup16x24_4      from '@/assets/mockups/16x24/mockup-4.webp';
import mockup16x24_5      from '@/assets/mockups/16x24/mockup-5.webp';
import mockup16x24_6      from '@/assets/mockups/16x24/mockup-6.webp';
import mockup16x24_7      from '@/assets/mockups/16x24/mockup-7.webp';
import mockup16x24_8      from '@/assets/mockups/16x24/mockup-8.webp';
import mockup20x30_3      from '@/assets/mockups/20x30/mockup-3.webp';
import mockup20x30_4      from '@/assets/mockups/20x30/mockup-4.webp';
import mockup20x30_5      from '@/assets/mockups/20x30/mockup-5.webp';
import mockup20x30_6      from '@/assets/mockups/20x30/mockup-6.webp';
import mockup20x30_7      from '@/assets/mockups/20x30/mockup-7.webp';
import mockup20x30_8      from '@/assets/mockups/20x30/mockup-8.webp';

// ─── /generate/preview (explanation) ─────────────────────────────────────────
import galaxyBgExp        from '@/assets/galaxy-bg.jpg';
import insertCardPreview  from '@/assets/insert-card-preview.jpg';
import ctaRoomMockup      from '@/assets/mockups/cta-room-mockup.webp';

import type { ImageEntry } from '@/hooks/useImagePreloader';

// ─────────────────────────────────────────────────────────────────────────────
// Route image sets
// ─────────────────────────────────────────────────────────────────────────────

export const LANDING_IMAGES: ImageEntry[] = [
  // Hero — LCP images, load first
  { src: heroDesktop,       priority: 'high'   },
  { src: heroMobile,        priority: 'high'   },
  // Hero social proof avatars — visible above fold
  { src: heroCustomer1,     priority: 'normal' },
  { src: heroCustomer2,     priority: 'normal' },
  { src: heroCustomer3,     priority: 'normal' },
  { src: heroCustomer4,     priority: 'normal' },
  { src: heroCustomer5,     priority: 'normal' },
  { src: heroCustomer6,     priority: 'normal' },
  // Interactive hotspot demo image — prominent section
  { src: hotspotExample,    priority: 'normal' },
  // Gallery tiles — visible when scrolled slightly
  { src: emmaChart,         priority: 'normal' },
  { src: danielChart,       priority: 'normal' },
  { src: jamesChart,        priority: 'normal' },
  { src: mariaChart,        priority: 'normal' },
  // Below-fold gallery & proof images
  { src: capricornWall,     priority: 'low'    },
  { src: taurusArtwork,     priority: 'low'    },
  { src: womanHolding,      priority: 'low'    },
  { src: galaxyBg,          priority: 'low'    },
  { src: saturnPlanet,      priority: 'low'    },
  { src: canvasDetail,      priority: 'low'    },
  { src: libraWall,         priority: 'low'    },
  { src: virgoArtwork,      priority: 'low'    },
  { src: gallery2,          priority: 'low'    },
  { src: gallery3,          priority: 'low'    },
  { src: moonSurface,       priority: 'low'    },
  { src: earthSpace,        priority: 'low'    },
  { src: capricornGallery,  priority: 'low'    },
  { src: taurusExample,     priority: 'low'    },
  { src: customerDisplay1,  priority: 'low'    },
  { src: customerDisplay2,  priority: 'low'    },
  { src: customerDisplay3,  priority: 'low'    },
  { src: customerDisplay4,  priority: 'low'    },
  { src: customerDisplay5,  priority: 'low'    },
  { src: customerDisplay6,  priority: 'low'    },
  { src: customerDisplay7,  priority: 'low'    },
  { src: customerDisplay8,  priority: 'low'    },
  { src: customerDisplay9,  priority: 'low'    },
  { src: customerDisplay10, priority: 'low'    },
  { src: review1,           priority: 'low'    },
  { src: review2,           priority: 'low'    },
  { src: review3,           priority: 'low'    },
  { src: review4,           priority: 'low'    },
  { src: review5,           priority: 'low'    },
  { src: review6,           priority: 'low'    },
  { src: review7,           priority: 'low'    },
  { src: review8,           priority: 'low'    },
  { src: review9,           priority: 'low'    },
  { src: footerBg,          priority: 'low'    },
  { src: footerMobileBg,    priority: 'low'    },
];

export const GENERATE_ENTRY_IMAGES: ImageEntry[] = [
  { src: starsBg,           priority: 'high'   },
];

export const GENERATE_STYLE_IMAGES: ImageEntry[] = [
  // Thumbnails are the first thing visible in the carousel
  { src: collisionThumb,    priority: 'high'   },
  { src: prismThumb,        priority: 'high'   },
  { src: folkThumb,         priority: 'high'   },
  { src: fableThumb,        priority: 'normal' },
  { src: paperThumb,        priority: 'normal' },
  { src: redThumb,          priority: 'normal' },
  // Expanded style previews (loaded when user taps a style)
  { src: collision2,        priority: 'low'    },
  { src: collision3,        priority: 'low'    },
  { src: collision4,        priority: 'low'    },
  { src: prism2,            priority: 'low'    },
  { src: prism3,            priority: 'low'    },
  { src: prism4,            priority: 'low'    },
  { src: folk2,             priority: 'low'    },
  { src: folk3,             priority: 'low'    },
  { src: folk4,             priority: 'low'    },
  { src: fable2,            priority: 'low'    },
  { src: fable3,            priority: 'low'    },
  { src: fable4,            priority: 'low'    },
  { src: paper2,            priority: 'low'    },
  { src: paper3,            priority: 'low'    },
  { src: paper4,            priority: 'low'    },
  { src: red2,              priority: 'low'    },
  { src: red3,              priority: 'low'    },
  { src: red4,              priority: 'low'    },
];

export const GENERATE_LOADING_IMAGES: ImageEntry[] = [
  { src: artistGif,         priority: 'high'   },
];

/** Static mockup images shown on the preview & size pages */
export const MOCKUP_IMAGES: ImageEntry[] = [
  // 16x24 mockup-6 is the primary lifestyle hero — load it first
  { src: mockup16x24_6,     priority: 'high'   },
  { src: mockup16x24_1,     priority: 'normal' },
  { src: mockup16x24_2,     priority: 'normal' },
  { src: mockup16x24_3,     priority: 'normal' },
  { src: mockup16x24_4,     priority: 'normal' },
  { src: mockup16x24_5,     priority: 'normal' },
  { src: mockup16x24_7,     priority: 'normal' },
  { src: mockup16x24_8,     priority: 'normal' },
  { src: mockup12x18_1,     priority: 'low'    },
  { src: mockup12x18_2,     priority: 'low'    },
  { src: mockup12x18_3,     priority: 'low'    },
  { src: mockup12x18_4,     priority: 'low'    },
  { src: mockup12x18_5,     priority: 'low'    },
  { src: mockup12x18_6,     priority: 'low'    },
  { src: mockup12x18_7,     priority: 'low'    },
  { src: mockup12x18_8,     priority: 'low'    },
  { src: mockup20x30_3,     priority: 'low'    },
  { src: mockup20x30_4,     priority: 'low'    },
  { src: mockup20x30_5,     priority: 'low'    },
  { src: mockup20x30_6,     priority: 'low'    },
  { src: mockup20x30_7,     priority: 'low'    },
  { src: mockup20x30_8,     priority: 'low'    },
];

export const GENERATE_PREVIEW_IMAGES: ImageEntry[] = [
  ...MOCKUP_IMAGES,
  { src: galaxyBgExp,       priority: 'normal' },
  { src: insertCardPreview, priority: 'low'    },
  { src: ctaRoomMockup,     priority: 'low'    },
  { src: taurusExample,     priority: 'low'    },
];

export const GENERATE_SIZE_IMAGES: ImageEntry[] = [
  ...MOCKUP_IMAGES,
  { src: womanHolding,      priority: 'normal' },
  { src: canvasDetail,      priority: 'low'    },
  { src: galaxyBg,          priority: 'low'    },
];
