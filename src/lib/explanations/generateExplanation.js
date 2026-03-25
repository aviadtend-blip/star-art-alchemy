/**
 * Generates static chart-based explanations as fallback for when AI vision
 * is unavailable or returns null mappings.
 *
 * KEY DESIGN PRINCIPLE:
 * - artworkElement uses PHYSICAL SPATIAL last-resort labels (never semantic categories):
 *     Sun → "Upper Focal Area"
 *     Moon → "Secondary Focal Area"
 *     Rising → "Outer Border"
 *     Element → "Lower Reflection"
 * - These should ONLY appear when no concrete observed-region label exists.
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
        artworkElement: 'Upper Focal Area',
        icon: '☀️',
        explanation: getSunFallback(sunSign),
      },
      {
        chartElement: `Moon in ${moonSign}, House ${safeChart?.moon?.house ?? '—'}`,
        artworkElement: 'Secondary Focal Area',
        icon: '🌙',
        explanation: getMoonFallback(moonSign),
      },
      {
        chartElement: `${risingSign} Rising`,
        artworkElement: 'Outer Border',
        icon: '⬆️',
        explanation: getRisingFallback(risingSign),
      },
      {
        chartElement: `${dominantElement} Dominant`,
        artworkElement: 'Lower Ground',
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
    'Aries': `You lead with instinct — your Aries Sun means you act before most people have finished thinking. That forward drive shaped the upper focal area in this piece.`,
    'Taurus': `You trust what you can touch and build things that last. Your Taurus Sun grounds the upper focal area with that same steady, deliberate quality.`,
    'Gemini': `Your mind runs on parallel tracks, curious about everything. Your Gemini Sun brings a layered, restless quality to the upper focal area.`,
    'Cancer': `You feel first and think later, and you remember everything. Your Cancer Sun wraps the upper focal area in something warm and protective.`,
    'Leo': `You hold attention naturally — not by demanding it, but by earning it. Your Leo Sun drives the upper focal area in this piece.`,
    'Virgo': `You notice what others miss. Your Virgo Sun brings quiet precision to the upper focal area.`,
    'Libra': `You seek balance instinctively — in decisions, relationships, aesthetics. Your Libra Sun shapes the upper focal area toward harmony.`,
    'Scorpio': `You don't do surface-level anything. Your Scorpio Sun pulls the upper focal area toward depth and intensity.`,
    'Sagittarius': `You need room to roam, in ideas and geography alike. Your Sagittarius Sun pushes the upper focal area toward openness.`,
    'Capricorn': `You play the long game and you're usually right to. Your Capricorn Sun builds the upper focal area upward, structured and deliberate.`,
    'Aquarius': `You think differently and you know it. Your Aquarius Sun breaks the expected pattern at the upper focal area.`,
    'Pisces': `You live between worlds, absorbing everything. Your Pisces Sun softens the upper focal area into something fluid.`,
  };
  return notes[sign] || `Your ${sign} Sun shaped the upper focal area of this piece.`;
}

function getMoonFallback(sign) {
  const notes = {
    'Aries': `Your first emotional response is action — you feel it, you do something. Your Aries Moon gives the secondary shapes here an underlying urgency.`,
    'Taurus': `You need tangible comfort to feel safe. Your Taurus Moon adds a grounded, steady quality to the secondary shapes in this piece.`,
    'Gemini': `Your moods shift quickly and your feelings want words. Your Gemini Moon keeps the secondary shapes restless and alive.`,
    'Cancer': `You feel everything deeply, especially for people you've chosen. Your Cancer Moon makes the secondary shapes tender and close.`,
    'Leo': `You need to be seen and valued by the people who matter. Your Leo Moon adds warmth to the secondary shapes here.`,
    'Virgo': `You process feelings by organizing them. Your Virgo Moon adds a quiet, intentional quality to the secondary shapes.`,
    'Libra': `You want emotional fairness — to give what you get. Your Libra Moon smooths the secondary shapes into something balanced.`,
    'Scorpio': `You feel things at a depth most people can't name. Your Scorpio Moon adds an undercurrent of intensity beneath the surface here.`,
    'Sagittarius': `Your emotional default is optimism. Your Sagittarius Moon lifts the secondary shapes toward something open and expansive.`,
    'Capricorn': `You process emotions slowly and privately. Your Capricorn Moon gives the secondary shapes a contained, structured quality.`,
    'Aquarius': `You feel things differently than people expect. Your Aquarius Moon adds an unconventional quality to the secondary shapes.`,
    'Pisces': `You absorb emotions from everyone around you. Your Pisces Moon dissolves the boundaries in the secondary shapes of this piece.`,
  };
  return notes[sign] || `Your ${sign} Moon shaped the secondary shapes of this piece.`;
}

function getRisingFallback(sign) {
  const notes = {
    'Aries': `People sense your directness before you speak. Your Aries Rising shapes the outer border of this piece — bold, forward, no preamble.`,
    'Taurus': `You come across as grounded and unhurried. Your Taurus Rising gives this piece a substantial, inviting edge from the first glance.`,
    'Gemini': `You seem lighter and more playful than your chart might suggest. Your Gemini Rising keeps the outer border here moving.`,
    'Cancer': `People sense softness and protectiveness in you immediately. Your Cancer Rising wraps the outer border of this piece in something sheltering.`,
    'Leo': `You walk into a room and the room notices. Your Leo Rising gives this piece a confident, generous edge.`,
    'Virgo': `You present as thoughtful and precise. Your Virgo Rising brings intentional, detailed edges to this piece.`,
    'Libra': `You make everything look effortless. Your Libra Rising gives this piece an elegantly balanced outer border.`,
    'Scorpio': `People sense your intensity before you say a word. Your Scorpio Rising gives this piece depth at the edges — layers that reveal themselves slowly.`,
    'Sagittarius': `You seem open, like you're always headed somewhere. Your Sagittarius Rising pulls the outer border outward, expansive.`,
    'Capricorn': `You project competence and quiet authority. Your Capricorn Rising gives this piece angular, upward-building structure at the edges.`,
    'Aquarius': `You don't present like anyone else. Your Aquarius Rising breaks conventional framing — the outer border here follows its own rules.`,
    'Pisces': `You seem a little otherworldly — present but not entirely here. Your Pisces Rising dissolves the outer border of this piece.`,
  };
  return notes[sign] || `Your ${sign} Rising shaped the outer border of this piece.`;
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
