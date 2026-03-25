import { describe, it, expect } from 'vitest';
import { sanitizeAiHotspotAnalysis, getDominantElement, isAbstractLabel, validateSubjectExplanation, isBannedGenericTitle, findNearestUnusedRegionLabel } from '@/lib/explanations/hotspotAnalysis';

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

describe('isAbstractLabel', () => {
  it('rejects abstract labels', () => {
    expect(isAbstractLabel('The Emotional Atmosphere')).toBe(true);
    expect(isAbstractLabel('The Composition & Framing')).toBe(true);
    expect(isAbstractLabel('The Overall Feel & Weight')).toBe(true);
    expect(isAbstractLabel('Central Focus')).toBe(true);
    expect(isAbstractLabel('Secondary Detail')).toBe(true);
    expect(isAbstractLabel('Framing Details')).toBe(true);
    expect(isAbstractLabel('Overall Surface')).toBe(true);
  });

  it('accepts concrete labels', () => {
    expect(isAbstractLabel('White Dove')).toBe(false);
    expect(isAbstractLabel('Stone Archway')).toBe(false);
    expect(isAbstractLabel('Lower Waterline')).toBe(false);
    expect(isAbstractLabel('Stacked Books')).toBe(false);
    expect(isAbstractLabel('Upper Left Glow')).toBe(false);
    expect(isAbstractLabel('Horned Bull')).toBe(false);
  });
});

describe('isBannedGenericTitle', () => {
  it('rejects banned generic fallback titles', () => {
    expect(isBannedGenericTitle('Central Figure')).toBe(true);
    expect(isBannedGenericTitle('Secondary Shape')).toBe(true);
    expect(isBannedGenericTitle('Outer Edge')).toBe(true);
    expect(isBannedGenericTitle('Lower Texture')).toBe(true);
    expect(isBannedGenericTitle('Main Subject')).toBe(true);
    expect(isBannedGenericTitle('central figure')).toBe(true);
  });

  it('accepts concrete titles', () => {
    expect(isBannedGenericTitle('White Dove')).toBe(false);
    expect(isBannedGenericTitle('Bull\'s Horns')).toBe(false);
    expect(isBannedGenericTitle('Clock Face')).toBe(false);
    expect(isBannedGenericTitle('Moon Disk')).toBe(false);
    expect(isBannedGenericTitle('Lower Reflection')).toBe(false);
    expect(isBannedGenericTitle('Right Reeds')).toBe(false);
  });
});

describe('validateSubjectExplanation', () => {
  it('accepts a valid concrete subject explanation', () => {
    const text = 'A seated woman holding an open book dominates the center of this piece. Her posture and the surrounding stone columns reflect the grounded authority of your Capricorn Rising.';
    expect(validateSubjectExplanation(text)).toBe(text);
  });

  it('rejects mystical language', () => {
    const text = 'A celestial guardian watches over the cosmic blueprint of your soul, channeling divine energy through the ethereal plane of existence.';
    expect(validateSubjectExplanation(text)).toBeNull();
  });

  it('rejects too-short explanations', () => {
    expect(validateSubjectExplanation('A figure.')).toBeNull();
    expect(validateSubjectExplanation('')).toBeNull();
    expect(validateSubjectExplanation(null)).toBeNull();
  });

  it('allows explanations between 15-50 words', () => {
    const text = 'A large horned bull stands at the center of the composition, surrounded by scattered petals and flowing water. Your Taurus Sun shaped this grounded, sturdy central figure.';
    expect(validateSubjectExplanation(text)).toBe(text);
  });
});

describe('findNearestUnusedRegionLabel', () => {
  it('returns nearest unused region label', () => {
    const regions = [
      { ...makeRegion('r1', 'Stone Archway'), position: { top: '20%', left: '50%' } },
      { ...makeRegion('r2', 'Lower Waterline'), position: { top: '80%', left: '50%' } },
      { ...makeRegion('r3', 'Right Reeds'), position: { top: '50%', left: '90%' } },
    ];
    const used = new Set(['r1']);
    const target = { top: '75%', left: '50%' };
    expect(findNearestUnusedRegionLabel(regions, used, target)).toBe('Lower Waterline');
  });

  it('returns null when all regions used', () => {
    const regions = [makeRegion('r1', 'Stone Archway')];
    const used = new Set(['r1']);
    expect(findNearestUnusedRegionLabel(regions, used, { top: '50%', left: '50%' })).toBeNull();
  });

  it('returns null when no regions', () => {
    expect(findNearestUnusedRegionLabel([], new Set(), { top: '50%', left: '50%' })).toBeNull();
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
    expect(result.observedRegions).toEqual([]);
  });

  it('rejects regions with abstract labels', () => {
    const raw = {
      observedRegions: [
        makeRegion('r1', 'The Emotional Atmosphere'),
        makeRegion('r2', 'The Overall Feel & Weight'),
        makeRegion('r3', 'The Composition & Framing'),
      ],
      chartMappings: {},
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    expect(result.observedRegions).toEqual([]);
  });

  it('rejects regions with banned generic titles', () => {
    const raw = {
      observedRegions: [
        makeRegion('r1', 'Central Figure'),
        makeRegion('r2', 'Secondary Shape'),
        makeRegion('r3', 'Outer Edge'),
      ],
      chartMappings: {},
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    expect(result.observedRegions).toEqual([]);
  });

  it('accepts 3+ valid concrete regions', () => {
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

  it('accepts 1-word labels like Dove', () => {
    const raw = {
      observedRegions: [
        makeRegion('r1', 'Dove'),
        makeRegion('r2', 'Archway'),
        makeRegion('r3', 'Waterline'),
      ],
      chartMappings: {},
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    expect(result.observedRegions.length).toBe(3);
  });

  it('accepts labels with apostrophes', () => {
    const raw = {
      observedRegions: [
        makeRegion('r1', "Bull's Horns"),
        makeRegion('r2', 'Stone Archway'),
        makeRegion('r3', 'Moon Disk'),
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

  it('preserves AI title when explanation fails but title is concrete', () => {
    const raw = {
      observedRegions: [
        makeRegion('r1'), makeRegion('r2', 'Scattered Petals'), makeRegion('r3', 'Crescent Upper'),
      ],
      chartMappings: {
        sun: makeSlot('r1', 'Your Aries Sun drives this figure.', 0.8, 'Horned Bull'),
      },
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    // Explanation mentions wrong sign (Aries instead of Scorpio), so mapped=false
    expect(result.slots.sun.mapped).toBe(false);
    // But the concrete title survives
    expect(result.slots.sun.artworkElement).toBe('Horned Bull');
    // Position survives too
    expect(result.slots.sun.position).toBeTruthy();
  });

  it('does not preserve abstract title when explanation fails', () => {
    const raw = {
      observedRegions: [
        makeRegion('r1'), makeRegion('r2', 'Scattered Petals'), makeRegion('r3', 'Crescent Upper'),
      ],
      chartMappings: {
        sun: makeSlot('r1', 'Your Aries Sun drives this figure.', 0.8, 'The Emotional Atmosphere'),
      },
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    expect(result.slots.sun.mapped).toBe(false);
    expect(result.slots.sun.artworkElement).toBeUndefined();
  });

  it('does not preserve banned generic title when explanation fails', () => {
    const raw = {
      observedRegions: [
        makeRegion('r1'), makeRegion('r2', 'Scattered Petals'), makeRegion('r3', 'Crescent Upper'),
      ],
      chartMappings: {
        sun: makeSlot('r1', 'Your Aries Sun drives this figure.', 0.8, 'Central Figure'),
      },
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    expect(result.slots.sun.mapped).toBe(false);
    expect(result.slots.sun.artworkElement).toBeUndefined();
  });

  it('validates subjectExplanation and passes valid ones through', () => {
    const raw = {
      subjectExplanation: 'A seated woman with an open book dominates the center. Her composed posture and the surrounding stone columns reflect the grounded deliberation of your Capricorn Rising.',
      observedRegions: [
        makeRegion('r1'), makeRegion('r2', 'Scattered Petals'), makeRegion('r3', 'Crescent Upper'),
      ],
      chartMappings: {},
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    expect(result.subjectExplanation).toBeTruthy();
    expect(result.subjectExplanation).toContain('seated woman');
  });

  it('rejects mystical subjectExplanation', () => {
    const raw = {
      subjectExplanation: 'A celestial guardian watches over the cosmic blueprint.',
      observedRegions: [
        makeRegion('r1'), makeRegion('r2', 'Scattered Petals'), makeRegion('r3', 'Crescent Upper'),
      ],
      chartMappings: {},
    };
    const result = sanitizeAiHotspotAnalysis(raw, chartContext);
    expect(result.subjectExplanation).toBeNull();
  });

  it('produces physical spatial fallback labels from generateChartExplanation', async () => {
    const { generateChartExplanation } = await import('@/lib/explanations/generateExplanation');
    const chart = {
      sun: { sign: 'Scorpio', house: 8 },
      moon: { sign: 'Pisces', house: 12 },
      rising: 'Capricorn',
      element_balance: { Fire: 1, Water: 5, Earth: 3, Air: 1 },
    };
    const result = generateChartExplanation(chart);
    // New physical spatial fallbacks, not semantic category names
    expect(result.elements[0].artworkElement).toBe('Upper Focal Area');
    expect(result.elements[1].artworkElement).toBe('Secondary Focal Area');
    expect(result.elements[2].artworkElement).toBe('Outer Border');
    expect(result.elements[3].artworkElement).toBe('Lower Ground');

    // Verify none of the banned generic titles appear
    for (const el of result.elements) {
      expect(['Central Figure', 'Secondary Shape', 'Outer Edge', 'Lower Texture']).not.toContain(el.artworkElement);
    }
  });
});
