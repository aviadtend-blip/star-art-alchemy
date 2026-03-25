/**
 * Generates static chart-based explanations as fallback for when AI vision
 * is unavailable or returns null mappings.
 *
 * KEY DESIGN PRINCIPLE:
 * - artworkElement uses HONEST spatial labels ("The central focal point",
 *   "The surrounding atmosphere") instead of invented visual claims
 *   ("twin sun motif", "quicksilver moon phases").
 * - explanation text is personality-driven from chart data, NOT visual claims
 *   about specific objects that may or may not exist in the artwork.
 * - Colors and art style are NEVER referenced (colors = style choice, not chart).
 */

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

  const dominantElement = getDominantElement(elementBalance);

  return {
    overview: `Every visual choice in this piece was inspired by your birth chart — from the composition and mood to the subjects and textures.`,

    elements: [
      {
        chartElement: `Sun in ${sunSign}, House ${safeChart?.sun?.house ?? '—'}`,
        artworkElement: 'The Central Focus',
        icon: "☀️",
        explanation: getSunArtistNote(sunSign),
      },
      {
        chartElement: `Moon in ${moonSign}, House ${safeChart?.moon?.house ?? '—'}`,
        artworkElement: 'The Emotional Atmosphere',
        icon: "🌙",
        explanation: getMoonArtistNote(moonSign),
      },
      {
        chartElement: `${risingSign} Rising`,
        artworkElement: 'The Composition & Framing',
        icon: "⬆️",
        explanation: getRisingArtistNote(risingSign),
      },
      {
        chartElement: `${dominantElement} Dominant`,
        artworkElement: 'The Overall Feel & Weight',
        icon: getElementIcon(dominantElement),
        explanation: getElementArtistNote(dominantElement, elementBalance),
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

// ─── SUN: Personality-driven notes (no visual claims) ───

function getSunArtistNote(sign) {
  const notes = {
    'Aries': `You lead with instinct, not permission — your ${sign} Sun charges forward before others have even decided. That boldness shapes the center of this piece.`,
    'Taurus': `You build things that last and trust what you can touch. Your ${sign} Sun grounds this piece — steady, deliberate, unapologetically sensual.`,
    'Gemini': `Your mind runs in parallel tracks — curious about everything, bored by nothing for long. Your ${sign} Sun creates a restless, layered quality at the heart of this piece.`,
    'Cancer': `You feel first and think later — and you remember everything. Your ${sign} Sun wraps the center of this artwork in something protective and warm.`,
    'Leo': `You were born to hold attention, not because you demand it but because you earn it. Your ${sign} Sun commands the center of this piece.`,
    'Virgo': `You notice what others miss — the small inconsistency, the better way to do something. Your ${sign} Sun brings quiet precision to the core of this piece.`,
    'Libra': `You instinctively seek balance in everything — relationships, aesthetics, decisions. Your ${sign} Sun shapes the harmonious center of this artwork.`,
    'Scorpio': `You don't do surface-level anything. Your ${sign} Sun pulls you — and this piece — toward depth, intensity, and what's hidden underneath.`,
    'Sagittarius': `You need room to roam, in both ideas and geography. Your ${sign} Sun pushes the center of this piece toward openness and horizon.`,
    'Capricorn': `You play the long game and you're usually right to. Your ${sign} Sun builds upward — structured, deliberate, reaching for the summit.`,
    'Aquarius': `You think differently and you know it — you'd rather be right than conventional. Your ${sign} Sun breaks the expected pattern at the center of this piece.`,
    'Pisces': `You live between worlds — absorbing everything, boundaries optional. Your ${sign} Sun softens the core of this piece into something dreamlike.`,
  };
  return notes[sign] || `Your ${sign} Sun shaped the heart of this piece.`;
}

function getMoonArtistNote(sign) {
  const notes = {
    'Aries': `Your emotional first response is action — you feel it, you do something about it. Your ${sign} Moon gives this piece an underlying urgency.`,
    'Taurus': `You need comfort to feel safe — real, tangible comfort. Your ${sign} Moon adds a lush, grounded emotional texture to this artwork.`,
    'Gemini': `Your moods shift fast and your feelings need words. Your ${sign} Moon keeps the emotional undertone of this piece restless and alive.`,
    'Cancer': `You feel everything deeply, especially for the people you've chosen. Your ${sign} Moon makes the emotional heart of this piece tender and protective.`,
    'Leo': `You need to be seen and valued, especially by the people who matter. Your ${sign} Moon adds warmth and generosity to the emotional layer of this piece.`,
    'Virgo': `You process feelings by organizing them — naming them, understanding them. Your ${sign} Moon adds a quiet, intentional quality to the mood of this piece.`,
    'Libra': `You want emotional fairness — to give what you get, to feel balance. Your ${sign} Moon smooths the emotional tone of this piece into something graceful.`,
    'Scorpio': `You feel things at a depth most people can't even name. Your ${sign} Moon adds an undercurrent of intensity beneath the surface of this piece.`,
    'Sagittarius': `Your emotional default is optimism — you genuinely believe it'll work out. Your ${sign} Moon lifts the emotional tone of this piece toward something expansive.`,
    'Capricorn': `You process emotions slowly and privately — feelings are earned, not given freely. Your ${sign} Moon gives this piece a contained, structured emotional quality.`,
    'Aquarius': `You feel things differently than people expect — detached isn't the right word, just independent. Your ${sign} Moon adds an unconventional emotional frequency to this piece.`,
    'Pisces': `You absorb emotions from everyone around you — empathy without an off switch. Your ${sign} Moon dissolves the boundaries in the emotional layer of this piece.`,
  };
  return notes[sign] || `Your ${sign} Moon shaped the emotional undertone of this piece.`;
}

function getRisingArtistNote(sign) {
  const notes = {
    'Aries': `People sense your directness before you even speak. Your ${sign} Rising shapes the first impression of this artwork — bold, forward, no preamble.`,
    'Taurus': `You come across as grounded and unhurried — people feel safe around you. Your ${sign} Rising gives this piece a substantial, inviting quality from the first glance.`,
    'Gemini': `You seem lighter and more playful than your chart might suggest. Your ${sign} Rising keeps the composition of this piece moving — nothing stays fixed.`,
    'Cancer': `People sense softness and protectiveness in you immediately. Your ${sign} Rising wraps the composition of this piece in something sheltering.`,
    'Leo': `You walk into a room and the room notices. Your ${sign} Rising gives this piece a confident, generous framing that commands attention.`,
    'Virgo': `You present as thoughtful and precise — people trust your eye for detail. Your ${sign} Rising brings delicate, intentional framing to this piece.`,
    'Libra': `You make everything look effortless — charm, aesthetics, social grace. Your ${sign} Rising gives this piece an elegantly balanced composition.`,
    'Scorpio': `People sense your intensity before you say a word. Your ${sign} Rising gives this piece depth upon depth — layers that reveal themselves slowly.`,
    'Sagittarius': `You seem open, adventurous, like you're always headed somewhere. Your ${sign} Rising pulls the composition of this piece outward, expansive and uncontained.`,
    'Capricorn': `You project competence and quiet authority. Your ${sign} Rising gives this piece angular, upward-building structure.`,
    'Aquarius': `You don't present like anyone else, and you never will. Your ${sign} Rising breaks conventional composition — the framing here follows its own rules.`,
    'Pisces': `You seem a little otherworldly — present but not entirely here. Your ${sign} Rising dissolves the edges of this piece into something liminal.`,
  };
  return notes[sign] || `Your ${sign} Rising defined the first impression of this piece.`;
}

function getElementArtistNote(element, elementBalance) {
  const total = Object.values(elementBalance).reduce((a, b) => a + b, 0);
  const percentage = Math.round((elementBalance[element] / total) * 100);
  const notes = {
    'Fire': `${percentage}% of your chart runs on Fire — initiative, passion, and forward momentum. That intensity shapes the overall weight and movement of this piece.`,
    'Water': `${percentage}% of your chart flows with Water — intuition, depth, and emotional intelligence. That sensitivity shapes the overall mood and fluidity of this piece.`,
    'Earth': `${percentage}% of your chart is grounded in Earth — practicality, patience, and tangible results. That steadiness shapes the overall weight and presence of this piece.`,
    'Air': `${percentage}% of your chart breathes Air — ideas, connections, and mental agility. That lightness shapes the overall spaciousness and movement of this piece.`,
  };
  return notes[element] || `Your dominant ${element} element defined the overall feel of this artwork.`;
}
