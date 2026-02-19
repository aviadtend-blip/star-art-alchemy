/**
 * Adds an `interpretation` layer to chartData without modifying existing fields.
 * @param {object} chartData - The natal chart data object
 * @returns {object} chartData with an added `interpretation` key
 */

const SUN_SIGN_QUALITIES = {
  Virgo: 'analytical precision',
  Leo: 'expressive pride',
  Scorpio: 'probing depth',
  Gemini: 'mercurial curiosity',
  Taurus: 'grounded steadiness',
  Aries: 'bold directness',
  Libra: 'relational harmony',
  Capricorn: 'structured ambition',
  Aquarius: 'detached idealism',
  Sagittarius: 'expansive seeking',
  Cancer: 'protective nurturing',
  Pisces: 'dissolving empathy',
};

export default function buildInterpretationLayer(chartData) {
  const interpretation = {};

  // 1. ASPECT WEIGHTS
  interpretation.aspectWeights = (chartData.aspects || []).map((aspect) => {
    let priority;
    if (aspect.orb <= 1) priority = 'critical';
    else if (aspect.orb <= 3) priority = 'high';
    else if (aspect.orb <= 5) priority = 'medium';
    else priority = 'ignore';
    return { ...aspect, type: aspect.type || aspect.aspect, priority };
  });

  // 2. STELLIUM DETECTION
  if (chartData.stelliums && chartData.stelliums.length > 0) {
    const s = chartData.stelliums[0];
    const planets = s.planets.join(' + ');
    interpretation.dominantFeature = `${planets} stellium in ${s.sign} (House ${s.house}) — gravitational center of this chart`;
  } else if (chartData.dominant_signature) {
    const { element, modality } = chartData.dominant_signature;
    interpretation.dominantFeature = `${element}-${modality} dominant chart — ${element} energy filters all expression`;
  } else if (chartData.dominant_element) {
    interpretation.dominantFeature = `${chartData.dominant_element}-${chartData.dominant_modality || 'Mixed'} dominant chart — ${chartData.dominant_element} energy filters all expression`;
  }

  // 3. CORE PARADOX
  const sunQuality = SUN_SIGN_QUALITIES[chartData.sun?.sign] || 'essential nature';
  interpretation.coreParadox = `${chartData.rising} Rising intensity on the surface, ${chartData.sun?.sign} ${sunQuality} at the core, ${chartData.moon?.sign} emotional restlessness underneath`;

  // 4. DIGNITY FLAGS
  interpretation.dignityFlags = [];
  // Build planet list from either array format or top-level keys
  const planetNames = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
  let planetList = [];
  if (Array.isArray(chartData.planets) && chartData.planets.length > 0) {
    planetList = chartData.planets;
  } else {
    planetList = planetNames
      .filter(name => chartData[name] && typeof chartData[name] === 'object')
      .map(name => ({ planet: name.charAt(0).toUpperCase() + name.slice(1), ...chartData[name] }));
  }
  for (const data of planetList) {
    const name = data.planet || data.name || 'Unknown';
    const dignity = (data.dignity || '').toLowerCase();
    if (dignity === 'fall' || dignity === 'detriment') {
      interpretation.dignityFlags.push({
        planet: name,
        dignity: data.dignity,
        impact: `${name} in ${data.dignity} — this planet's gifts are compromised and create a key tension in the personality`,
      });
    }
  }

  return { ...chartData, interpretation };
}
