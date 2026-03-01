import buildInterpretationLayer from './buildInterpretationLayer.js';
import getAIInterpretation from './getAIInterpretation.js';

// Simple zodiac subject keywords — no colors, no positioning
const SUN_SUBJECTS = {
  Aries: 'ram charging through stone walls',
  Taurus: 'bull resting in a harvest field',
  Gemini: 'twin figures sharing a single book',
  Cancer: 'crab guarding a pearl-lined shell',
  Leo: 'lion with a mane of sunflowers',
  Virgo: 'maiden with wheat sheaves',
  Libra: 'figure holding balanced scales',
  Scorpio: 'scorpion transforming into eagle',
  Sagittarius: 'archer aiming at distant stars',
  Capricorn: 'mountain goat on a frozen summit',
  Aquarius: 'water-bearer pouring from cracked vessels',
  Pisces: 'two fish circling a whirlpool',
};

const MOON_TEXTURES = {
  Aries: 'sparks scattering from struck flint',
  Taurus: 'moss-covered stone in still water',
  Gemini: 'twin mirrors reflecting scattered thoughts',
  Cancer: 'tide pools glowing under moonlight',
  Leo: 'warm hearth flames behind curtains',
  Virgo: 'pressed herbs between pages',
  Libra: 'silk draped over a sleeping face',
  Scorpio: 'deep well with no visible bottom',
  Sagittarius: 'bonfire smoke rising into open sky',
  Capricorn: 'frost crystallizing on iron',
  Aquarius: 'lightning frozen inside glass',
  Pisces: 'dissolving ocean mist',
};

const RISING_ENVIRONMENTS = {
  Aries: 'volcanic terrain and cracked earth',
  Taurus: 'lush garden with stone walls',
  Gemini: 'crossroads with multiple winding paths',
  Cancer: 'sheltered cove with tidal caves',
  Leo: 'grand amphitheater under open sky',
  Virgo: 'apothecary workshop with organized shelves',
  Libra: 'mirrored courtyard with floating scales',
  Scorpio: 'underground cavern with phosphorescent pools',
  Sagittarius: 'distant horizons and open plains',
  Capricorn: 'ancient stone tower on a cliff',
  Aquarius: 'observatory floating above clouds',
  Pisces: 'shoreline where land dissolves into fog',
};

export async function buildConcretePrompt(chartData, style) {
  chartData = buildInterpretationLayer(chartData);

  // Get the AI scene narrative
  const aiNarrative = await getAIInterpretation(chartData);

  // Combine into a clean prompt — AI narrative already encodes all zodiac symbolism
  const contentPrompt = `cosmic collage, ${aiNarrative}`;

  // Trim to ~500 chars max (before params)
  const trimmed = contentPrompt.length > 500 ? contentPrompt.substring(0, 497) + '...' : contentPrompt;

  if (import.meta.env.DEV) {
    console.log('🎨 Built prompt:', {
      sun: chartData.sun.sign,
      moon: chartData.moon.sign,
      rising: chartData.rising,
      style: style?.id,
      length: trimmed.length,
      prompt: trimmed,
    });
  }

  return trimmed;
}

// Keep backward-compatible export name
export const buildCanonicalPrompt = buildConcretePrompt;
