/**
 * Generates static chart-based explanations as fallback for when AI vision
 * is unavailable or returns null mappings.
 *
 * KEY DESIGN PRINCIPLE:
 * - artworkElement uses LITERAL spatial labels only:
 *     Sun → "Central Focus"
 *     Moon → "Secondary Detail"
 *     Rising → "Framing Details"
 *     Element → "Overall Surface"
 * - explanation text describes the PERSON first, not the artwork
 * - No claims about specific visual motifs, creatures, colors, or symbols
 * - No cheesy / mystical wording
 */

import { getDominantElement } from './hotspotAnalysis';

export function generateChartExplanation(chartData) {
  const safeChart = chartData || {};
  const sunSign = safeChart?.sun?.sign || 'Pisces';
  const moonSign = safeChart?.moon?.sign || 'Scorpio';
  const risingSign = typeof safeChart?.rising === 'string'
    ? safeChart.rising
    : safeChart?.rising?.sign || 'Leo';

  const elementBalance = safeChart?.element_balance || safeChart?.elements || {
    Fire: 1, Water: 1, Earth: 1, Air: 1,
  };

  const dominantElement = getDominantElement(elementBalance);

  return {
    overview: `Every visual choice in this piece was shaped by your birth chart — the composition, mood, subjects, and textures all trace back to your data.`,

    elements: [
      {
        chartElement: `Sun in ${sunSign}, House ${safeChart?.sun?.house ?? '—'}`,
        artworkElement: 'Central Focus',
        icon: '☀️',
        explanation: getSunFallback(sunSign),
      },
      {
        chartElement: `Moon in ${moonSign}, House ${safeChart?.moon?.house ?? '—'}`,
        artworkElement: 'Secondary Detail',
        icon: '🌙',
        explanation: getMoonFallback(moonSign),
      },
      {
        chartElement: `${risingSign} Rising`,
        artworkElement: 'Framing Details',
        icon: '⬆️',
        explanation: getRisingFallback(risingSign),
      },
      {
        chartElement: `${dominantElement} Dominant`,
        artworkElement: 'Overall Surface',
        icon: getElementIcon(dominantElement),
        explanation: getElementFallback(dominantElement, elementBalance),
      }
    ]
  };
}

function getElementIcon(element) {
  const icons = { 'Fire': '🔥', 'Water': '💧', 'Earth': '🌍', 'Air': '💨' };
  return icons[element] || '✨';
}

// ─── SUN FALLBACK: Describe the person, plain language ───

function getSunFallback(sign) {
  const notes = {
    'Aries': `You lead with instinct — your Aries Sun means you act before most people have finished thinking. That forward drive shaped the center of this piece.`,
    'Taurus': `You trust what you can touch and build things that last. Your Taurus Sun grounds the center of this piece with that same steady, deliberate quality.`,
    'Gemini': `Your mind runs on parallel tracks, curious about everything. Your Gemini Sun brings a layered, restless quality to the center of this piece.`,
    'Cancer': `You feel first and think later, and you remember everything. Your Cancer Sun wraps the center of this piece in something warm and protective.`,
    'Leo': `You hold attention naturally — not by demanding it, but by earning it. Your Leo Sun drives the center of this piece.`,
    'Virgo': `You notice what others miss. Your Virgo Sun brings quiet precision to the center of this piece.`,
    'Libra': `You seek balance instinctively — in decisions, relationships, aesthetics. Your Libra Sun shapes the center of this piece toward harmony.`,
    'Scorpio': `You don't do surface-level anything. Your Scorpio Sun pulls the center of this piece toward depth and intensity.`,
    'Sagittarius': `You need room to roam, in ideas and geography alike. Your Sagittarius Sun pushes the center of this piece toward openness.`,
    'Capricorn': `You play the long game and you're usually right to. Your Capricorn Sun builds the center of this piece upward, structured and deliberate.`,
    'Aquarius': `You think differently and you know it. Your Aquarius Sun breaks the expected pattern at the center of this piece.`,
    'Pisces': `You live between worlds, absorbing everything. Your Pisces Sun softens the center of this piece into something fluid.`,
  };
  return notes[sign] || `Your ${sign} Sun shaped the center of this piece.`;
}

function getMoonFallback(sign) {
  const notes = {
    'Aries': `Your first emotional response is action — you feel it, you do something. Your Aries Moon gives the secondary details here an underlying urgency.`,
    'Taurus': `You need tangible comfort to feel safe. Your Taurus Moon adds a grounded, steady quality to the details in this piece.`,
    'Gemini': `Your moods shift quickly and your feelings want words. Your Gemini Moon keeps the secondary details restless and alive.`,
    'Cancer': `You feel everything deeply, especially for people you've chosen. Your Cancer Moon makes the details in this piece tender and close.`,
    'Leo': `You need to be seen and valued by the people who matter. Your Leo Moon adds warmth to the secondary details here.`,
    'Virgo': `You process feelings by organizing them. Your Virgo Moon adds a quiet, intentional quality to the details in this piece.`,
    'Libra': `You want emotional fairness — to give what you get. Your Libra Moon smooths the secondary details into something balanced.`,
    'Scorpio': `You feel things at a depth most people can't name. Your Scorpio Moon adds an undercurrent of intensity beneath the surface here.`,
    'Sagittarius': `Your emotional default is optimism. Your Sagittarius Moon lifts the secondary details toward something open and expansive.`,
    'Capricorn': `You process emotions slowly and privately. Your Capricorn Moon gives the details here a contained, structured quality.`,
    'Aquarius': `You feel things differently than people expect. Your Aquarius Moon adds an unconventional quality to the details in this piece.`,
    'Pisces': `You absorb emotions from everyone around you. Your Pisces Moon dissolves the boundaries in the details of this piece.`,
  };
  return notes[sign] || `Your ${sign} Moon shaped the emotional details of this piece.`;
}

function getRisingFallback(sign) {
  const notes = {
    'Aries': `People sense your directness before you speak. Your Aries Rising shapes the framing of this piece — bold, forward, no preamble.`,
    'Taurus': `You come across as grounded and unhurried. Your Taurus Rising gives this piece a substantial, inviting frame from the first glance.`,
    'Gemini': `You seem lighter and more playful than your chart might suggest. Your Gemini Rising keeps the framing here moving.`,
    'Cancer': `People sense softness and protectiveness in you immediately. Your Cancer Rising wraps the framing of this piece in something sheltering.`,
    'Leo': `You walk into a room and the room notices. Your Leo Rising gives this piece a confident, generous framing.`,
    'Virgo': `You present as thoughtful and precise. Your Virgo Rising brings intentional, detailed framing to this piece.`,
    'Libra': `You make everything look effortless. Your Libra Rising gives this piece an elegantly balanced frame.`,
    'Scorpio': `People sense your intensity before you say a word. Your Scorpio Rising gives this piece depth in the framing — layers that reveal themselves slowly.`,
    'Sagittarius': `You seem open, like you're always headed somewhere. Your Sagittarius Rising pulls the framing outward, expansive.`,
    'Capricorn': `You project competence and quiet authority. Your Capricorn Rising gives this piece angular, upward-building structure.`,
    'Aquarius': `You don't present like anyone else. Your Aquarius Rising breaks conventional framing — the edges here follow their own rules.`,
    'Pisces': `You seem a little otherworldly — present but not entirely here. Your Pisces Rising dissolves the edges of this piece.`,
  };
  return notes[sign] || `Your ${sign} Rising shaped the framing of this piece.`;
}

function getElementFallback(element, elementBalance) {
  const total = Object.values(elementBalance).reduce((a, b) => a + b, 0);
  const percentage = Math.round((elementBalance[element] / total) * 100);
  const notes = {
    'Fire': `${percentage}% of your chart runs on Fire — initiative, passion, forward momentum. That dominant Fire element shapes the overall weight and movement of this piece.`,
    'Water': `${percentage}% of your chart flows with Water — intuition, depth, emotional intelligence. That dominant Water element shapes the overall mood and fluidity here.`,
    'Earth': `${percentage}% of your chart is grounded in Earth — practicality, patience, tangible results. That dominant Earth element shapes the overall weight and presence of this piece.`,
    'Air': `${percentage}% of your chart breathes Air — ideas, connections, mental agility. That dominant Air element shapes the overall spaciousness here.`,
  };
  return notes[element] || `Your dominant ${element} element shaped the overall feel of this piece.`;
}
