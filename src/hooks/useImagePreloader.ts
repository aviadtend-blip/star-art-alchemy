/**
 * useImagePreloader
 *
 * Preloads a list of image URLs in the background so that when the user
 * navigates to a page, every image is already in the browser cache.
 *
 * Priority tiers:
 *   'high'   – LCP / hero images. Loaded immediately, in order.
 *   'normal' – Above-the-fold supporting images. Loaded right after high.
 *   'low'    – Below-the-fold / secondary images. Loaded last.
 *
 * Usage:
 *   useImagePreloader(LANDING_IMAGES);
 *   useImagePreloader(NEXT_ROUTE_IMAGES, { defer: true }); // loads after current priority set
 */

import { useEffect } from 'react';

export type ImageEntry = {
  src: string;
  priority?: 'high' | 'normal' | 'low';
};

type Options = {
  /** Delay (ms) before starting to load. Useful for next-page prefetch. */
  defer?: number;
};

const loaded = new Set<string>();

function preloadImage(src: string): Promise<void> {
  if (!src || loaded.has(src)) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { loaded.add(src); resolve(); };
    img.onerror = () => resolve(); // silent fail — don't block the queue
    img.src = src;
  });
}

async function preloadInPriorityOrder(images: ImageEntry[]): Promise<void> {
  const high   = images.filter(i => (i.priority ?? 'normal') === 'high');
  const normal = images.filter(i => (i.priority ?? 'normal') === 'normal');
  const low    = images.filter(i => i.priority === 'low');

  // High priority: load sequentially so the most important finishes first
  for (const img of high) {
    await preloadImage(img.src);
  }

  // Normal: load concurrently after high
  await Promise.all(normal.map(i => preloadImage(i.src)));

  // Low: fire-and-forget
  low.forEach(i => preloadImage(i.src));
}

export function useImagePreloader(images: ImageEntry[], options: Options = {}) {
  useEffect(() => {
    if (!images || images.length === 0) return;

    const validImages = images.filter(i => Boolean(i.src));
    if (validImages.length === 0) return;

    let cancelled = false;
    const run = async () => {
      if (options.defer) {
        await new Promise(r => setTimeout(r, options.defer));
      }
      if (!cancelled) {
        await preloadInPriorityOrder(validImages);
      }
    };

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
