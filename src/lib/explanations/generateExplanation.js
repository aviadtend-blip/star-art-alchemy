import { CONCRETE_SUN_VISUALS, CONCRETE_MOON_VISUALS, CONCRETE_RISING_VISUALS, CONCRETE_ELEMENT_PALETTES } from '@/data/concreteVisualPrompts';

export function generateChartExplanation(chartData) {
  const safeChart = chartData || {};
  const sunSign = safeChart?.sun?.sign || 'Pisces';
  const moonSign = safeChart?.moon?.sign || 'Scorpio';
  const risingSign = typeof safeChart?.rising === 'string'
    ? safeChart.rising
    : safeChart?.rising?.sign || 'Leo';

  const elementBalance = safeChart?.element_balance || safeChart?.elements || {
    Fire: 1,
    Water: 1,
    Earth: 1,
    Air: 1,
  };

  const sunVisuals = CONCRETE_SUN_VISUALS[sunSign];
  const moonVisuals = CONCRETE_MOON_VISUALS[moonSign];
  const risingVisuals = CONCRETE_RISING_VISUALS[risingSign];

  const dominantElement = getDominantElement(elementBalance);
  const palette = CONCRETE_ELEMENT_PALETTES[`${dominantElement}-dominant`] || CONCRETE_ELEMENT_PALETTES['Water-dominant'];

  return {
    overview: `Every visual choice in this piece was inspired by your birth chart — from the flowers and colors to the composition and mood.`,

    elements: [
      {
        chartElement: `Sun in ${sunSign}, House ${safeChart?.sun?.house ?? '—'}`,
        artworkElement: getSunArtworkElement(sunSign),
        icon: "☀️",
        explanation: getSunArtistNote(sunSign, sunVisuals),
      },
      {
        chartElement: `Moon in ${moonSign}, House ${safeChart?.moon?.house ?? '—'}`,
        artworkElement: getMoonArtworkElement(moonSign),
        icon: "🌙",
        explanation: getMoonArtistNote(moonSign, moonVisuals),
      },
      {
        chartElement: `${risingSign} Rising`,
        artworkElement: getRisingArtworkElement(risingSign),
        icon: "⬆️",
        explanation: getRisingArtistNote(risingSign, risingVisuals),
      },
      {
        chartElement: `${dominantElement} Dominant`,
        artworkElement: getElementArtworkElement(dominantElement),
        icon: getElementIcon(dominantElement),
        explanation: getElementArtistNote(dominantElement, elementBalance, palette),
      }
    ]
  };
}

function getDominantElement(elementBalance) {
  if (!elementBalance || typeof elementBalance !== 'object') return 'Water';
  const entries = Object.entries(elementBalance).filter(([, value]) => Number.isFinite(value));
  if (!entries.length) return 'Water';

  return entries.reduce((best, current) => (current[1] > best[1] ? current : best))[0];
}

function getElementIcon(element) {
  const icons = { 'Fire': '🔥', 'Water': '💧', 'Earth': '🌍', 'Air': '💨' };
  return icons[element] || '✨';
}

// ─── SUN: Artist's note on the central focal point ───

function getSunArtistNote(sign, visuals) {
  const notes = {
    'Aries': `Your ${sign} Sun blazes at the center — fierce rays and red poppies that refuse to be ignored.`,
    'Taurus': `A golden sun anchored in lush dahlias and roses. Your ${sign} Sun demanded something you could almost touch.`,
    'Gemini': `Twin suns and paired elements throughout — your ${sign} Sun's restless duality made visible.`,
    'Cancer': `A luminous sun wrapped in soft concentric ripples. Your ${sign} Sun turns the whole piece into a warm embrace.`,
    'Leo': `Your ${sign} Sun commands center stage — dramatic golden rays with a crown of bold sunflowers.`,
    'Virgo': `Every petal placed with quiet intention. Your ${sign} Sun speaks through precision, not volume.`,
    'Libra': `Rose-gold sun, perfect bilateral symmetry. Your ${sign} Sun wouldn't settle for anything less than harmony.`,
    'Scorpio': `Deep burgundy-purple at the core, pulling you in. Your ${sign} Sun doesn't radiate — it magnetizes.`,
    'Sagittarius': `A warm orange-gold sun reaching past open horizons. Your ${sign} Sun needed room to roam.`,
    'Capricorn': `Golden sun at the summit, crystalline and precise. Your ${sign} Sun climbs — the artwork follows.`,
    'Aquarius': `Unconventional geometry, nothing predictable. Your ${sign} Sun breaks every rule on purpose.`,
    'Pisces': `The sun glows through mist and water, edges dissolving. Your ${sign} Sun exists between worlds.`,
  };
  return notes[sign] || `Your ${sign} Sun shaped the heart of this piece.`;
}

function getMoonArtistNote(sign, visuals) {
  const notes = {
    'Aries': `Your ${sign} Moon burns bold — warm crescents with an ember glow that won't be tamed.`,
    'Taurus': `A full, ripe moon nestled in blooming botanicals. Your ${sign} Moon craves beauty you can feel.`,
    'Gemini': `Quicksilver moon phases shifting and splitting. Your ${sign} Moon never sits still.`,
    'Cancer': `The most luminous moon in the piece — protective, enveloping. Your ${sign} Moon is home.`,
    'Leo': `A golden heart-glow radiating warmth outward. Your ${sign} Moon needs to be seen and adored.`,
    'Virgo': `Hexagonal crescent patterns, quietly perfect. Your ${sign} Moon finds peace in order.`,
    'Libra': `A mirror-balanced moon, always seeking its reflection. Your ${sign} Moon wants equilibrium.`,
    'Scorpio': `Almost eclipsed, shadowed, magnetic. Your ${sign} Moon holds secrets that deepen the whole piece.`,
    'Sagittarius': `An ascending lunar arc reaching for the stars. Your ${sign} Moon is always chasing horizons.`,
    'Capricorn': `Geometric, architectural, disciplined. Your ${sign} Moon builds emotional foundations from stone.`,
    'Aquarius': `Lightning-zigzag moon, electric and unconventional. Your ${sign} Moon feels in frequencies.`,
    'Pisces': `Edges dissolving into water, boundaries vanishing. Your ${sign} Moon lives between dreaming and waking.`,
  };
  return notes[sign] || `Your ${sign} Moon shaped the emotional undertone of this piece.`;
}

function getRisingArtistNote(sign, visuals) {
  const notes = {
    'Aries': `Sharp lines breaking the frame — your ${sign} Rising makes an entrance before the art even begins.`,
    'Taurus': `Thick botanical framing, lush and grounded. Your ${sign} Rising wraps the whole piece in luxury.`,
    'Gemini': `Playful asymmetric pairs throughout. Your ${sign} Rising keeps the eye dancing.`,
    'Cancer': `Soft protective curves enclose everything. Your ${sign} Rising creates a safe harbor.`,
    'Leo': `Ornate, regal borders that command attention. Your ${sign} Rising is the red carpet of the piece.`,
    'Virgo': `Delicate fine linework, precise and intentional. Your ${sign} Rising whispers perfection.`,
    'Libra': `Sweeping Art Nouveau curves in perfect balance. Your ${sign} Rising insists on elegance.`,
    'Scorpio': `Layered hidden details revealing themselves slowly. Your ${sign} Rising has depth upon depth.`,
    'Sagittarius': `The composition pulls outward, expansive. Your ${sign} Rising refuses to be contained.`,
    'Capricorn': `Angular vertical structure, ambitious and rising. Your ${sign} Rising builds upward.`,
    'Aquarius': `Rule-breaking patterns that challenge convention. Your ${sign} Rising rewrites the rules.`,
    'Pisces': `Dissolving, boundary-less edges. Your ${sign} Rising exists in the liminal spaces.`,
  };
  return notes[sign] || `Your ${sign} Rising defined the first impression of this piece.`;
}

function getElementArtistNote(element, elementBalance, palette) {
  const total = Object.values(elementBalance).reduce((a, b) => a + b, 0);
  const percentage = Math.round((elementBalance[element] / total) * 100);
  const notes = {
    'Fire': `${percentage}% of your chart burns with Fire — so the palette blazes with reds, oranges, and golds throughout.`,
    'Water': `${percentage}% of your chart flows with Water — expect deep blues, purples, and teals rippling through every layer.`,
    'Earth': `${percentage}% of your chart is grounded in Earth — rich greens, warm browns, and natural textures anchor the piece.`,
    'Air': `${percentage}% of your chart breathes Air — light blues, whites, and airy pastels create spaciousness throughout.`,
  };
  return notes[element] || `Your dominant ${element} element defined the color story of this artwork.`;
}

// ─── Artwork element names (what the hotspot visually points to) ───

function getSunArtworkElement(sign) {
  const names = {
    'Aries': 'The blazing central rays',
    'Taurus': 'The golden sun anchored in dahlias',
    'Gemini': 'The twin sun motif',
    'Cancer': 'The luminous concentric ripples',
    'Leo': 'The crowned golden sun',
    'Virgo': 'The precisely placed petals',
    'Libra': 'The rose-gold symmetrical sun',
    'Scorpio': 'The deep burgundy core',
    'Sagittarius': 'The warm orange-gold horizon',
    'Capricorn': 'The crystalline summit sun',
    'Aquarius': 'The unconventional geometry',
    'Pisces': 'The dissolving, mist-wrapped glow',
  };
  return names[sign] || 'The central sun element';
}

function getMoonArtworkElement(sign) {
  const names = {
    'Aries': 'The bold, warm crescents',
    'Taurus': 'The full moon in blooming botanicals',
    'Gemini': 'The quicksilver moon phases',
    'Cancer': 'The luminous protective moon',
    'Leo': 'The golden heart-glow',
    'Virgo': 'The hexagonal crescent patterns',
    'Libra': 'The mirror-balanced moon',
    'Scorpio': 'The shadowed, almost-eclipsed moon',
    'Sagittarius': 'The ascending lunar arc',
    'Capricorn': 'The geometric, architectural moon',
    'Aquarius': 'The lightning-zigzag moon',
    'Pisces': 'The dissolving, water-edged moon',
  };
  return names[sign] || 'The lunar mood element';
}

function getRisingArtworkElement(sign) {
  const names = {
    'Aries': 'The sharp, frame-breaking lines',
    'Taurus': 'The thick botanical framing',
    'Gemini': 'The playful asymmetric pairs',
    'Cancer': 'The soft protective curves',
    'Leo': 'The ornate regal borders',
    'Virgo': 'The delicate fine linework',
    'Libra': 'The sweeping Art Nouveau curves',
    'Scorpio': 'The layered hidden details',
    'Sagittarius': 'The outward-pulling composition',
    'Capricorn': 'The angular vertical structure',
    'Aquarius': 'The rule-breaking patterns',
    'Pisces': 'The dissolving, boundary-less edges',
  };
  return names[sign] || 'The overall compositional style';
}

function getElementArtworkElement(element) {
  const names = {
    'Fire': 'The warm reds, oranges, and golds',
    'Water': 'The flowing blues, purples, and teals',
    'Earth': 'The rich greens and warm browns',
    'Air': 'The airy blues, whites, and pastels',
  };
  return names[element] || 'The color palette';
}

// ─── Supporting lookup functions (used by visualCues, not shown to user directly) ───

function getSunSymbolicCue(sign) {
  const cues = {
    'Aries': 'Ram horn V-shapes, forward-thrusting energy, breakthrough patterns',
    'Taurus': 'Crescent horn curves, botanical abundance, garden imagery',
    'Gemini': 'Twin elements, paired patterns, communication symbols (birds, butterflies)',
    'Cancer': 'Shell-like protective curves, tidal patterns, nest formations',
    'Leo': 'Crown formations, pride rock positioning, regal emblems',
    'Virgo': 'Wheat stalks, hexagonal patterns, healing herbs',
    'Libra': 'Scales balance, mirrored forms, golden mean proportions',
    'Scorpio': 'Scorpion tail S-curves, phoenix transformation, serpent spirals',
    'Sagittarius': 'Arrow patterns, centaur bow arcs, adventure pathways',
    'Capricorn': 'Mountain peaks, stair-step ascension, crystalline structures',
    'Aquarius': 'Lightning bolts, water-bearer waves, futuristic geometry',
    'Pisces': 'Two fish forms, infinity symbols (∞), dissolving boundaries'
  };
  return cues[sign] || 'Symbolic solar imagery';
}

function getMoonSymbolicCue(sign) {
  const cues = {
    'Aries': 'Heat shimmer, ram horn edges, warrior spirit energy',
    'Taurus': 'Sensual curves, garden blooming from lunar surface',
    'Gemini': 'Twin moons, butterfly wings, mental curiosity patterns',
    'Cancer': 'Shell protection, crab carapace markings, tidal pools',
    'Leo': 'Heart shapes, regal warmth, generous emotional glow',
    'Virgo': 'Wheat integration, hexagonal patterns, healing herb garden',
    'Libra': 'Mirror reflections, scales symbolism, aesthetic proportions',
    'Scorpio': 'Scorpion tail curve, phoenix phases, serpent coiling',
    'Sagittarius': 'Arrows to stars, centaur quest, adventure pathways',
    'Capricorn': 'Mountain framing, goat climb positioning, Saturn rings',
    'Aquarius': 'Water-bearer waves, lightning zigzags, community stars',
    'Pisces': 'Two fish swimming opposite, infinity flow, Neptune trident'
  };
  return cues[sign] || 'Lunar symbolic patterns';
}

function getRisingVisualCue(sign) {
  const cues = {
    'Aries': 'Bold, sharp lines and dynamic composition breaking through frame',
    'Taurus': 'Thick botanical details and grounded, substantial feel',
    'Gemini': 'Light, varied details with playful asymmetry and paired elements',
    'Cancer': 'Soft curves and protective circular framing with shell motifs',
    'Leo': 'Ornate, confident presentation with generous space and regal borders',
    'Virgo': 'Delicate botanical line work with perfect symmetry',
    'Libra': 'Balanced, mirrored elements with elegant Art Nouveau curves',
    'Scorpio': 'Deep shadows and mysterious layered details with hidden elements',
    'Sagittarius': 'Expansive composition with adventurous directional elements',
    'Capricorn': 'Geometric, structured details with angular mountain forms',
    'Aquarius': 'Unconventional patterns and innovative geometric design',
    'Pisces': 'Soft, dissolving edges with ethereal, boundary-less quality'
  };
  return cues[sign] || 'Distinctive aesthetic presentation';
}

function getRisingSymbolicCue(sign) {
  const cues = {
    'Aries': 'Ram horns in borders, breakthrough energy, forward thrust',
    'Taurus': 'Bull strength in borders, botanical abundance framing',
    'Gemini': 'Communication symbols (birds, butterflies), dual framing',
    'Cancer': 'Protective shells, nest-like borders, tidal wave patterns',
    'Leo': 'Crown formations, throne-like frames, mane flourishes',
    'Virgo': 'Wheat borders, hexagonal patterns, harvest field organization',
    'Libra': 'Scales balance, mirrored symmetry, justice symbolism',
    'Scorpio': 'Scorpion tail curves, phoenix rising, serpent spirals in borders',
    'Sagittarius': 'Arrows in borders, centaur bow arcs, distant horizons',
    'Capricorn': 'Mountain peaks, ascending stairs, sea-goat duality',
    'Aquarius': 'Water-bearer waves, lightning bolts, futuristic frames',
    'Pisces': 'Two fish in borders, infinity symbols, dissolving boundaries'
  };
  return cues[sign] || 'Symbolic framing elements';
}

function getElementalVisualCue(elementBalance, dominantElement) {
  const balance = Object.entries(elementBalance)
    .map(([el, count]) => `${el}: ${count}`)
    .join(', ');

  const cues = {
    'Fire': `Warm reds, oranges, and golds dominate throughout (${balance})`,
    'Water': `Cool blues, purples, and teals flow throughout (${balance})`,
    'Earth': `Natural greens, browns, and earth tones ground the piece (${balance})`,
    'Air': `Light blues, whites, and airy pastels create spaciousness (${balance})`
  };
  return cues[dominantElement] || `Balanced elemental expression (${balance})`;
}
