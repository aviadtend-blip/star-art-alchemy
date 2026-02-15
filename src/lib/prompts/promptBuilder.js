// Prompt Builder
// Constructs structured AI image generation prompts from natal chart data
// using canonical visual definitions for each astrological placement.

import { SUN_CANONICAL, MOON_CANONICAL, RISING_AESTHETIC, ELEMENTAL_PALETTE } from '@/data/canonicalDefinitions';

/**
 * Returns the element with the highest count from the element balance object.
 * @param {{ Fire: number, Water: number, Earth: number, Air: number }} elementBalance
 * @returns {string} e.g. "Fire"
 */
export function getDominantElement(elementBalance) {
  let dominant = null;
  let max = -1;
  for (const [element, count] of Object.entries(elementBalance)) {
    if (count > max) {
      max = count;
      dominant = element;
    }
  }
  return dominant;
}

/**
 * Combines the energy/emotional quality strings from sun, moon, and rising definitions
 * into a single cohesive energy description.
 * @param {object} sunDef - Entry from SUN_CANONICAL
 * @param {object} moonDef - Entry from MOON_CANONICAL
 * @param {object} risingDef - Entry from RISING_AESTHETIC
 * @returns {string} Combined energy description
 */
export function combineEnergies(sunDef, moonDef, risingDef) {
  const parts = [];
  if (sunDef?.energy) parts.push(`Core energy: ${sunDef.energy}`);
  if (moonDef?.emotionalResonance) parts.push(`Emotional undercurrent: ${moonDef.emotionalResonance}`);
  if (risingDef?.energy) parts.push(`Presentation style: ${risingDef.energy}`);
  return parts.join('. ');
}

/**
 * Builds a structured AI art generation prompt from natal chart data.
 *
 * The prompt is divided into clearly labeled sections so the AI model
 * can parse compositional intent, color guidance, and stylistic direction.
 *
 * @param {{ sun: { sign: string }, moon: { sign: string }, rising: string, element_balance: object }} chartData
 * @returns {string} Complete generation prompt
 */
export function buildCanonicalPrompt(chartData) {
  // --- Look up canonical definitions for each placement ---
  const sunDef = SUN_CANONICAL[chartData.sun.sign];
  const moonDef = MOON_CANONICAL[chartData.moon.sign];
  const risingDef = RISING_AESTHETIC[chartData.rising];

  // --- Determine the dominant element and its palette ---
  const dominantElement = getDominantElement(chartData.element_balance);
  const paletteDef = ELEMENTAL_PALETTE[`${dominantElement}-dominant`];

  // --- Assemble the prompt in clearly labeled sections ---

  const sections = [];

  // 1. Primary visual element — the Sun placement drives the main focal point
  sections.push(
    `PRIMARY ELEMENT (Sun in ${chartData.sun.sign}):`,
    sunDef?.description ?? 'A radiant celestial sun.',
    sunDef?.zodiacSymbolism ?? '',
    `Colors: Core ${sunDef?.colorCore ?? '#FFD700'}, Rays ${sunDef?.colorRays ?? '#FFA500'}`,
    ''
  );

  // 2. Secondary visual element — the Moon adds emotional depth and atmosphere
  sections.push(
    `SECONDARY ELEMENT (Moon in ${chartData.moon.sign}):`,
    moonDef?.description ?? 'A luminous celestial moon.',
    moonDef?.zodiacSymbolism ?? '',
    `Colors: Surface ${moonDef?.colorSurface ?? '#F0F8FF'}, Glow ${moonDef?.colorGlow ?? '#E6E6FA'}`,
    ''
  );

  // 3. Detail aesthetic — the Rising sign defines decorative style and line work
  sections.push(
    `DETAIL AESTHETIC (${chartData.rising} Rising):`,
    risingDef?.detailStyle ?? 'Elegant decorative details.',
    risingDef?.zodiacSymbolism ?? '',
    `Line work: ${risingDef?.lineWorkSpecifics ?? 'Fine, considered lines.'}`,
    ''
  );

  // 4. Color palette — driven by the dominant element in the chart
  sections.push(
    `COLOR PALETTE (${dominantElement}-dominant):`,
    paletteDef?.primaryColors?.join(', ') ?? '#FFD700, #DC143C, #FF4500',
    ''
  );

  // 5. Overall energy — a synthesis of all three placements
  sections.push(
    'OVERALL ENERGY:',
    combineEnergies(sunDef, moonDef, risingDef),
    ''
  );

  // 6. Style direction — consistent across all charts
  sections.push(
    'STYLE:',
    'Mystical watercolor artwork with ethereal dreamy atmosphere. Soft edges on watercolor with fine line details overlaid. Professional illustration quality suitable for framed wall art. Avoid literal zodiac symbols - work with abstract symbolic representations.',
    ''
  );

  // 7. Technical specs — ensures consistent output dimensions and quality
  sections.push(
    'TECHNICAL SPECS:',
    'Vertical portrait orientation, 3:4 aspect ratio, high detail, museum quality aesthetic.'
  );

  return sections.join('\n');
}
