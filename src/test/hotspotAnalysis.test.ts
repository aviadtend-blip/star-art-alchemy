import { describe, it, expect } from 'vitest';
import { sanitizeAiHotspotAnalysis, getDominantElement } from '@/lib/explanations/hotspotAnalysis';

const chartContext = {
  sunSign: 'Scorpio',
  moonSign: 'Pisces',
  rising: 'Capricorn',
  dominantElement: 'Water',
};

function makeRegion(id, label = 'Large Dark Figure', evidence = 'A tall dark silhouette occupying center of image') {
  return {
    id,
    literalLabel: label,
    visibleEvidence: evidence,
    position: { top: 30, left: 50 },
    regionType: 'figure',
  };
}

function makeSlot(regionId, explanation, confidence = 0.8, artworkElement = 'Dark Figure Center') {
  return { regionId, explanation, confidence, artworkElement };
}

describe('getDominantElement', () => {
  it('returns the element with the highest count', () => {
    expect(getDominantElement({ Fire: 1, Water: 5, Earth: 3, Air: 1 })).toBe('Water');
  });

  it('falls back to Water for empty/null input', () => {
    expect(getDominantElement(null)).toBe('Water');
    expect(getDominantElement({})).toBe('Water');
  });
});

describe('sanitizeAiHotspotAnalysis', () => {
  it('returns empty for null input', () => {
    const result = sanitizeAiHotspotAnalysis(null, chartContext);
    expect(result.observedRegions).toEqual([]);
    expect(result.slots).toEqual({});
  });

  it('rejects regions with banned nouns in labels', () => {
    const raw = {
      observedRegions: [
        makeRegion('r1', 'Cosmic Guardian Figure'),
        makeRegion('r2', 'Scattered Petals'),
        makeRegion('r3', 'Crescent Moon Shape'),
      ],
      chartMappings: {},
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    // r1 should be rejected (guardian), leaving < 3 valid = all empty
    expect(result.observedRegions).toEqual([]);
  });

  it('accepts 3+ valid regions', () => {
    const raw = {
      observedRegions: [
        makeRegion('r1', 'Large Dark Figure'),
        makeRegion('r2', 'Scattered Flower Petals'),
        makeRegion('r3', 'Crescent Shape Upper'),
      ],
      chartMappings: {},
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    expect(result.observedRegions.length).toBe(3);
  });

  it('rejects slot with wrong sign in explanation', () => {
    const raw = {
      observedRegions: [
        makeRegion('r1'), makeRegion('r2', 'Scattered Petals'), makeRegion('r3', 'Crescent Upper'),
      ],
      chartMappings: {
        sun: makeSlot('r1', 'Your Aries Sun drives this bold figure forward.'),
      },
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    expect(result.slots.sun.mapped).toBe(false);
  });

  it('rejects slot with wrong element in explanation', () => {
    const raw = {
      observedRegions: [
        makeRegion('r1'), makeRegion('r2', 'Scattered Petals'), makeRegion('r3', 'Crescent Upper'),
      ],
      chartMappings: {
        element: makeSlot('r1', 'The dominant Fire element gives this piece warmth.'),
      },
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    expect(result.slots.element.mapped).toBe(false);
  });

  it('accepts slot with correct placement mentioned', () => {
    const raw = {
      observedRegions: [
        makeRegion('r1'), makeRegion('r2', 'Scattered Petals'), makeRegion('r3', 'Crescent Upper'),
      ],
      chartMappings: {
        sun: makeSlot('r1', 'Your Scorpio Sun pulls the center toward depth and intensity.'),
      },
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    expect(result.slots.sun.mapped).toBe(true);
    expect(result.slots.sun.explanation).toContain('Scorpio Sun');
  });

  it('keeps strongest slot when two map to same region', () => {
    const raw = {
      observedRegions: [
        makeRegion('r1'), makeRegion('r2', 'Scattered Petals'), makeRegion('r3', 'Crescent Upper'),
      ],
      chartMappings: {
        sun: makeSlot('r1', 'Your Scorpio Sun pulls this figure into depth.', 0.9),
        moon: makeSlot('r1', 'Your Pisces Moon dissolves around this figure.', 0.6),
      },
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    expect(result.slots.sun.mapped).toBe(true);
    expect(result.slots.moon.mapped).toBe(false);
  });

  it('keeps weaker slot unmapped when two hotspots are too close', () => {
    const raw = {
      observedRegions: [
        makeRegion('r1'),
        { ...makeRegion('r2', 'Scattered Petals'), position: { top: 33, left: 52 } },
        makeRegion('r3', 'Crescent Upper', 'A bright crescent shape visible in the upper left'),
      ],
      chartMappings: {
        sun: makeSlot('r1', 'Your Scorpio Sun pulls this figure into depth.', 0.9),
        moon: makeSlot('r2', 'Your Pisces Moon dissolves around these petals.', 0.6),
      },
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    // r1 at (30,50) and r2 at (33,52) — distance ~3.6, under 10 threshold
    expect(result.slots.sun.mapped).toBe(true);
    expect(result.slots.moon.mapped).toBe(false);
  });

  it('rejects explanation with banned mystical words', () => {
    const raw = {
      observedRegions: [
        makeRegion('r1'), makeRegion('r2', 'Scattered Petals'), makeRegion('r3', 'Crescent Upper'),
      ],
      chartMappings: {
        sun: makeSlot('r1', 'Your Scorpio Sun manifests cosmic energy through this celestial figure.'),
      },
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    expect(result.slots.sun.mapped).toBe(false);
  });

  it('produces deterministic fallback labels from generateChartExplanation', async () => {
    const { generateChartExplanation } = await import('@/lib/explanations/generateExplanation');
    const chart = {
      sun: { sign: 'Scorpio', house: 8 },
      moon: { sign: 'Pisces', house: 12 },
      rising: 'Capricorn',
      element_balance: { Fire: 1, Water: 5, Earth: 3, Air: 1 },
    };
    const result = generateChartExplanation(chart);
    expect(result.elements[0].artworkElement).toBe('Central Focus');
    expect(result.elements[1].artworkElement).toBe('Secondary Detail');
    expect(result.elements[2].artworkElement).toBe('Framing Details');
    expect(result.elements[3].artworkElement).toBe('Overall Surface');
  });
});
