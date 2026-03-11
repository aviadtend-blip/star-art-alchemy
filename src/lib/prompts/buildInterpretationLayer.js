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

// Sanitize values before they are interpolated into AI prompts
function sanitizeForPrompt(value) {
  if (!value || typeof value !== 'string') return 'Unknown';
  return value.replace(/[^a-zA-Z0-9\s\-.,()°]/g, '').substring(0, 100);
}

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

  // 3. CORE PARADOX (sanitized for prompt safety)
  const risingClean = sanitizeForPrompt(chartData.rising);
  const sunSignClean = sanitizeForPrompt(chartData.sun?.sign);
  const moonSignClean = sanitizeForPrompt(chartData.moon?.sign);
  const sunQuality = SUN_SIGN_QUALITIES[chartData.sun?.sign] || 'essential nature';
  interpretation.coreParadox = `${risingClean} Rising intensity on the surface, ${sunSignClean} ${sunQuality} at the core, ${moonSignClean} emotional restlessness underneath`;

  // 4. ADMIRED SUBJECTS (gender + element → subject pool)
  const ADMIRED_SUBJECTS = {
    male: {
      fire:  ['armored knight', 'lion', 'eagle', 'phoenix', 'dragon', 'bull charging through flames', 'mountain lion'],
      earth: ['bull', 'ancient stag', 'stone guardian', 'armored titan', 'mountain lion', 'bear'],
      air:   ['hawk in flight', 'winged scholar', 'eagle soaring', 'centaur archer', 'raven', 'griffin'],
      water: ['sea serpent', 'leviathan', 'great whale', 'armored warrior', 'wolf at the shore'],
    },
    female: {
      fire:  ['lioness', 'phoenix', 'warrior queen', 'eagle', 'valkyrie', 'flame dancer'],
      earth: ['earth goddess', 'white deer', 'white owl', 'she-wolf', 'forest guardian', 'moon mare'],
      air:   ['swan queen', 'winged oracle', 'white raven', 'celestial dancer', 'silver hawk'],
      water: ['sea goddess', 'moon goddess', 'selkie', 'cosmic mermaid', 'pearl serpent'],
    },
    neutral: {
      fire:  ['phoenix', 'lion', 'eagle', 'dragon', 'sun guardian'],
      earth: ['bull', 'bear', 'ancient wolf', 'forest sovereign'],
      air:   ['eagle', 'raven', 'griffin', 'winged sage'],
      water: ['great whale', 'sea serpent', 'moon guardian'],
    }
  };

  const genderKey = chartData.gender === 'male' ? 'male'
                  : chartData.gender === 'female' ? 'female'
                  : 'neutral';
  const elementKey = (chartData.dominant_element || 'fire').toLowerCase();
  const subjectPool = ADMIRED_SUBJECTS[genderKey]?.[elementKey]
                   || ADMIRED_SUBJECTS.neutral[elementKey]
                   || ADMIRED_SUBJECTS.neutral.fire;
  interpretation.suggestedSubjects = subjectPool;

  // 5. DIGNITY FLAGS
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
