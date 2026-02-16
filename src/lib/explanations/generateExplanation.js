import { SUN_CANONICAL, MOON_CANONICAL, RISING_AESTHETIC, ELEMENTAL_PALETTE } from '@/data/canonicalDefinitions';

export function generateChartExplanation(chartData) {
  const sunDef = SUN_CANONICAL[chartData.sun.sign];
  const moonDef = MOON_CANONICAL[chartData.moon.sign];
  const risingDef = RISING_AESTHETIC[chartData.rising];
  
  const dominantElement = getDominantElement(chartData.element_balance);
  const palette = ELEMENTAL_PALETTE[dominantElement + '-dominant'];
  
  return {
    overview: `Your birth chart artwork is uniquely designed based on your specific astrological placements. Every element you see was carefully chosen to represent your cosmic blueprint.`,
    
    elements: [
      {
        title: `Sun in ${chartData.sun.sign}`,
        subtitle: "Your Core Identity & Life Force",
        icon: "☀️",
        explanation: `The ${getSunVisualDescription(chartData.sun.sign)} represents your Sun in ${chartData.sun.sign}. This placement shapes your core identity and creative life force. ${sunDef.description || 'Core identity expression'}.`,
        visualCues: [
          getSunVisualCue(chartData.sun.sign),
          getSunSymbolicCue(chartData.sun.sign)
        ],
        meaning: `Sun in ${chartData.sun.sign} means you express your identity through ${getSunMeaning(chartData.sun.sign)}.`
      },
      {
        title: `Moon in ${chartData.moon.sign}`,
        subtitle: "Your Emotional Nature & Inner World",
        icon: "🌙",
        explanation: `The ${getMoonVisualDescription(chartData.moon.sign)} represents your Moon in ${chartData.moon.sign}. This governs your emotional nature and subconscious patterns. ${moonDef.description || 'Emotional processing'}.`,
        visualCues: [
          getMoonVisualCue(chartData.moon.sign),
          getMoonSymbolicCue(chartData.moon.sign)
        ],
        meaning: `Moon in ${chartData.moon.sign} means you process emotions through ${getMoonMeaning(chartData.moon.sign)}.`
      },
      {
        title: `${chartData.rising} Rising`,
        subtitle: "Your Outer Presentation & First Impression",
        icon: "⬆️",
        explanation: `The overall aesthetic and detail style reflects your ${chartData.rising} rising sign. ${risingDef.energy}. Your rising sign influences how you present yourself to the world.`,
        visualCues: [
          getRisingVisualCue(chartData.rising),
          getRisingSymbolicCue(chartData.rising)
        ],
        meaning: `${chartData.rising} Rising means others first perceive you as ${getRisingMeaning(chartData.rising)}.`
      },
      {
        title: `${dominantElement} Dominant`,
        subtitle: "Your Elemental Energy",
        icon: getElementIcon(dominantElement),
        explanation: `Your chart is ${dominantElement}-dominant with ${chartData.element_balance[dominantElement]} placements. This influences the overall color palette and energy of your artwork. ${palette.energy}.`,
        visualCues: [
          getElementalVisualCue(chartData.element_balance, dominantElement),
          `Overall atmosphere: ${palette.energy}`
        ],
        meaning: `${dominantElement} dominance means you approach life through ${getElementalMeaning(dominantElement)}.`
      }
    ]
  };
}

function getDominantElement(elementBalance) {
  return Object.keys(elementBalance).reduce((a, b) => 
    elementBalance[a] > elementBalance[b] ? a : b
  );
}

function getElementIcon(element) {
  const icons = { 'Fire': '🔥', 'Water': '💧', 'Earth': '🌍', 'Air': '💨' };
  return icons[element] || '✨';
}

function getSunVisualDescription(sign) {
  const descriptions = {
    'Aries': 'fierce, dynamic sun with sharp energetic rays',
    'Taurus': 'grounded sun with substantial presence and warm glow',
    'Gemini': 'bright, quick-moving sun with varied rays',
    'Cancer': 'nurturing sun with soft, embracing rays',
    'Leo': 'majestic sun with proud mane-like corona',
    'Virgo': 'precise, refined sun with symmetrical rays',
    'Libra': 'harmonious, balanced sun with perfect symmetry',
    'Scorpio': 'intense, smoldering sun with penetrating energy',
    'Sagittarius': 'adventurous sun with far-reaching rays',
    'Capricorn': 'dignified sun with structured, crystalline form',
    'Aquarius': 'innovative sun with unconventional patterns',
    'Pisces': 'ethereal sun glowing through water or mist'
  };
  return descriptions[sign] || 'radiant sun';
}

function getSunVisualCue(sign) {
  const cues = {
    'Aries': 'Sharp, angular rays with fiery red-orange tones thrusting forward',
    'Taurus': 'Thick, substantial rays with honey-gold coloring and botanical elements',
    'Gemini': 'Varied ray lengths creating dynamic patterns, possibly dual suns',
    'Cancer': 'Soft, curved rays with silvery undertones in protective arrangement',
    'Leo': 'Long flowing rays forming a magnificent mane-like corona',
    'Virgo': 'Perfectly symmetrical rays with delicate botanical details',
    'Libra': 'Balanced, mirrored rays in rose-gold tones',
    'Scorpio': 'Deep gold rays with burgundy undertones and magnetic pull',
    'Sagittarius': 'Far-reaching rays pointing toward distant horizons',
    'Capricorn': 'Geometric, structured rays in cool platinum-gold',
    'Aquarius': 'Unconventional ray patterns with aqua hints',
    'Pisces': 'Diffused, iridescent rays dissolving into atmosphere'
  };
  return cues[sign] || 'Radiant golden rays';
}

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

function getSunMeaning(sign) {
  const meanings = {
    'Aries': 'bold action, pioneering initiative, and courageous self-expression',
    'Taurus': 'steady reliability, sensual pleasure, and building lasting value',
    'Gemini': 'curious communication, mental versatility, and quick adaptability',
    'Cancer': 'nurturing protection, emotional depth, and creating safe spaces',
    'Leo': 'confident creativity, generous warmth, and natural leadership',
    'Virgo': 'helpful service, analytical precision, and practical perfection',
    'Libra': 'harmonious balance, aesthetic beauty, and diplomatic relating',
    'Scorpio': 'intense transformation, deep passion, and powerful regeneration',
    'Sagittarius': 'adventurous exploration, philosophical seeking, and optimistic expansion',
    'Capricorn': 'disciplined achievement, patient mastery, and earned authority',
    'Aquarius': 'innovative vision, humanitarian progress, and unique individuality',
    'Pisces': 'compassionate transcendence, mystical sensitivity, and spiritual surrender'
  };
  return meanings[sign] || 'unique solar expression';
}

function getMoonVisualDescription(sign) {
  const descriptions = {
    'Aries': 'bold crescent moon with dynamic energy',
    'Taurus': 'full, grounded moon with warm glow',
    'Gemini': 'quick-changing moon showing multiple phases',
    'Cancer': 'luminous full moon with powerful emotional presence',
    'Leo': 'proud moon with warm golden glow',
    'Virgo': 'precise crescent with clear definition',
    'Libra': 'harmonious moon in perfect balance',
    'Scorpio': 'mysterious dark moon or eclipse',
    'Sagittarius': 'adventurous ascending moon',
    'Capricorn': 'crystalline moon with geometric structure',
    'Aquarius': 'innovative moon with unusual configuration',
    'Pisces': 'dissolving moon merging with water'
  };
  return descriptions[sign] || 'luminous moon';
}

function getMoonVisualCue(sign) {
  const cues = {
    'Aries': 'Sharp crescent with red-orange glow and flame-like aura',
    'Taurus': 'Full moon with honeyed warmth and botanical growth',
    'Gemini': 'Multiple crescents or changing phases, communication symbols',
    'Cancer': 'Large, luminous full moon with tidal influence and protective shells',
    'Leo': 'Moon with warm golden-silver coloring and heart-centered glow',
    'Virgo': 'Clearly defined moon with botanical elements and precise details',
    'Libra': 'Balanced moon in rose-silver tones with partnership imagery',
    'Scorpio': 'Dark moon with burgundy undertones and transformative shadows',
    'Sagittarius': 'Rising or traveling moon with adventurous positioning',
    'Capricorn': 'Moon with crystalline facets and mountain imagery',
    'Aquarius': 'Moon in geometric patterns with electric aqua tints',
    'Pisces': 'Iridescent moon blending with water and spiritual mist'
  };
  return cues[sign] || 'Luminous silver moon';
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

function getMoonMeaning(sign) {
  const meanings = {
    'Aries': 'quick instinctive reactions and independent emotional courage',
    'Taurus': 'steady comfort-seeking and sensual emotional security',
    'Gemini': 'curious mental processing and communicative feelings',
    'Cancer': 'deep nurturing instincts and protective emotional care',
    'Leo': 'warm-hearted dramatic expression and generous feelings',
    'Virgo': 'analytical emotional processing and helpful purity',
    'Libra': 'harmonious relationship-seeking and aesthetic sensitivity',
    'Scorpio': 'intense transformative depth and passionate emotional power',
    'Sagittarius': 'optimistic philosophical exploration and freedom-seeking feelings',
    'Capricorn': 'disciplined emotional control and mature responsibility',
    'Aquarius': 'progressive detachment and humanitarian collective feelings',
    'Pisces': 'compassionate transcendence and mystical emotional receptivity'
  };
  return meanings[sign] || 'unique emotional expression';
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

function getRisingMeaning(sign) {
  const meanings = {
    'Aries': 'bold, dynamic, and courageously direct',
    'Taurus': 'grounded, reliable, and sensually present',
    'Gemini': 'quick, curious, and intellectually engaging',
    'Cancer': 'nurturing, protective, and emotionally receptive',
    'Leo': 'confident, warm, and magnetically charismatic',
    'Virgo': 'helpful, refined, and analytically observant',
    'Libra': 'charming, balanced, and aesthetically graceful',
    'Scorpio': 'intense, mysterious, and magnetically powerful',
    'Sagittarius': 'optimistic, adventurous, and philosophically open',
    'Capricorn': 'dignified, mature, and professionally competent',
    'Aquarius': 'unique, progressive, and intellectually innovative',
    'Pisces': 'empathetic, dreamy, and spiritually sensitive'
  };
  return meanings[sign] || 'distinctively present';
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

function getElementalMeaning(element) {
  const meanings = {
    'Fire': 'passionate action, creative inspiration, and bold initiative',
    'Water': 'emotional depth, intuitive feeling, and flowing adaptability',
    'Earth': 'practical grounding, material stability, and tangible building',
    'Air': 'intellectual thinking, social communication, and conceptual understanding'
  };
  return meanings[element] || 'balanced elemental expression';
}
