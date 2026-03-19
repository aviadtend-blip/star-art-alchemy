/**
 * Alpha-channel compositing for phone case mockups.
 *
 * Instead of runtime green-screen detection, uses pre-processed mockup PNGs
 * where the green area is already transparent. Compositing is a simple
 * 3-layer sandwich:
 *
 *   Layer 1 (bottom): Solid background color
 *   Layer 2 (middle): Artwork, scaled/cropped to fill the print region
 *   Layer 3 (top):    Mockup overlay with transparent cutout
 *
 * The mockup's alpha channel naturally clips the artwork — no mask detection,
 * no green spill, no fringe cleanup needed.
 */

const BG_COLOR = '#F5F5F5';

/**
 * Regions where the artwork should be drawn, per mockup.
 * Determined once from the original green-screen areas.
 * Coordinates are in the original asset's pixel space.
 */
const MOCKUP_REGIONS = {
  'mockup-1': { x: 624, y: 195, width: 670, height: 1725 },
  'mockup-2': { x: 113, y: 159, width: 1652, height: 1349 },
  'mockup-3': { x: 582, y: 159, width: 813, height: 1607 },
  'mockup-4': null,  // No green region — detail/lifestyle shot, pass through
  'mockup-5': null,  // No green region — detail/lifestyle shot, pass through
};

/**
 * Composite artwork onto a single alpha-channel mockup.
 *
 * @param {HTMLImageElement} mockupImg  - Pre-processed PNG with transparent cutout
 * @param {HTMLImageElement} artworkImg - The artwork to insert
 * @param {string} mockupKey           - e.g. 'mockup-1'
 * @param {number} maxDim              - Max output dimension (default 800)
 * @returns {string} Data URL of the composited image (JPEG)
 */
export function compositeAlpha(mockupImg, artworkImg, mockupKey, maxDim = 800) {
  console.log(`[alphaComposite] compositing ${mockupKey}, mockup size: ${mockupImg.naturalWidth}x${mockupImg.naturalHeight}, hasArtwork: ${!!artworkImg}`);
  const region = MOCKUP_REGIONS[mockupKey] ?? null;

  const fullW = mockupImg.naturalWidth;
  const fullH = mockupImg.naturalHeight;
  const scale = Math.min(1, maxDim / Math.max(fullW, fullH));
  const w = Math.max(1, Math.round(fullW * scale));
  const h = Math.max(1, Math.round(fullH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Layer 1: Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, w, h);

  // Layer 2: Artwork (if this mockup has a region)
  if (region && artworkImg) {
    const rx = Math.round(region.x * scale);
    const ry = Math.round(region.y * scale);
    const rw = Math.round(region.width * scale);
    const rh = Math.round(region.height * scale);

    // Cover-crop the artwork to fill the region
    const artW = artworkImg.naturalWidth;
    const artH = artworkImg.naturalHeight;
    const artAspect = artW / artH;
    const regionAspect = rw / rh;

    let sx = 0, sy = 0, sw = artW, sh = artH;
    if (artAspect > regionAspect) {
      // Artwork is wider — crop sides
      sw = Math.round(artH * regionAspect);
      sx = Math.round((artW - sw) / 2);
    } else {
      // Artwork is taller — crop top/bottom
      sh = Math.round(artW / regionAspect);
      sy = Math.round((artH - sh) / 2);
    }

    ctx.drawImage(artworkImg, sx, sy, sw, sh, rx, ry, rw, rh);
  }

  // Layer 3: Mockup overlay (alpha channel clips the artwork)
  ctx.drawImage(mockupImg, 0, 0, w, h);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Extract the mockup key from a source path.
 * e.g. '/assets/mockups/phone-case-alpha/mockup-2.png' → 'mockup-2'
 */
export function extractMockupKey(src) {
  const match = String(src).match(/mockup-\d+/);
  return match ? match[0] : '';
}

/**
 * Check if a mockup key has a compositable region.
 */
export function hasCompositableRegion(mockupKey) {
  return MOCKUP_REGIONS[mockupKey] != null;
}
