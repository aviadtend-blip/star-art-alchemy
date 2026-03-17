/**
 * emailStoryHotspots.js
 * Provides crop center coordinates (as fractions of image width/height)
 * for Sun, Moon, and Rising hotspots per zodiac sign.
 * Used by emailStoryGallery.js to generate 4:3 horizontal close-up crops
 * for Email 2 (The Story Behind Your Art).
 *
 * Coordinates are based on the hotspot positions defined in ChartExplanation.jsx
 * and converted to 0-1 fractions (left, top).
 */

// SUN hotspot centers — fractions of image dimensions (left, top)
const SUN_CENTERS = {
  Aries:       { cx: 0.50, cy: 0.18 },
  Taurus:      { cx: 0.30, cy: 0.20 },
  Gemini:      { cx: 0.45, cy: 0.18 },
  Cancer:      { cx: 0.50, cy: 0.35 },
  Leo:         { cx: 0.50, cy: 0.30 },
  Virgo:       { cx: 0.35, cy: 0.30 },
  Libra:       { cx: 0.50, cy: 0.20 },
  Scorpio:     { cx: 0.65, cy: 0.45 },
  Sagittarius: { cx: 0.50, cy: 0.18 },
  Capricorn:   { cx: 0.50, cy: 0.15 },
  Aquarius:    { cx: 0.35, cy: 0.25 },
  Pisces:      { cx: 0.50, cy: 0.30 },
};

// MOON hotspot centers
const MOON_CENTERS = {
  Aries:       { cx: 0.60, cy: 0.55 },
  Taurus:      { cx: 0.45, cy: 0.65 },
  Gemini:      { cx: 0.55, cy: 0.50 },
  Cancer:      { cx: 0.50, cy: 0.50 },
  Leo:         { cx: 0.55, cy: 0.50 },
  Virgo:       { cx: 0.45, cy: 0.55 },
  Libra:       { cx: 0.50, cy: 0.55 },
  Scorpio:     { cx: 0.70, cy: 0.65 },
  Sagittarius: { cx: 0.60, cy: 0.40 },
  Capricorn:   { cx: 0.55, cy: 0.45 },
  Aquarius:    { cx: 0.65, cy: 0.50 },
  Pisces:      { cx: 0.45, cy: 0.60 },
};

// RISING hotspot centers
const RISING_CENTERS = {
  Aries:       { cx: 0.85, cy: 0.40 },
  Taurus:      { cx: 0.25, cy: 0.75 },
  Gemini:      { cx: 0.80, cy: 0.35 },
  Cancer:      { cx: 0.30, cy: 0.70 },
  Leo:         { cx: 0.75, cy: 0.15 },
  Virgo:       { cx: 0.35, cy: 0.80 },
  Libra:       { cx: 0.85, cy: 0.45 },
  Scorpio:     { cx: 0.75, cy: 0.80 },
  Sagittarius: { cx: 0.80, cy: 0.25 },
  Capricorn:   { cx: 0.80, cy: 0.70 },
  Aquarius:    { cx: 0.80, cy: 0.20 },
  Pisces:      { cx: 0.70, cy: 0.75 },
};

const DEFAULT_CENTER = { cx: 0.50, cy: 0.50 };

/**
 * Returns the crop center for a given planet and sign.
 * @param {'Sun'|'Moon'|'Rising'} planet
 * @param {string} sign - zodiac sign name
 * @returns {{ cx: number, cy: number }} - fractions of image width/height
 */
export function getStoryCropCenter(planet, sign) {
  const map = planet === 'Sun' ? SUN_CENTERS : planet === 'Moon' ? MOON_CENTERS : RISING_CENTERS;
  return map[sign] || DEFAULT_CENTER;
}
