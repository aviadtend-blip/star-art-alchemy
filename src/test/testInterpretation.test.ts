import { describe, it, expect } from 'vitest';
import { buildConcretePrompt } from '@/lib/prompts/promptBuilder.js';

const testChartData = {
  sun: { sign: "Virgo", house: 5, degree: 0.5 },
  moon: { sign: "Gemini", house: 3, degree: 25.55 },
  rising: "Scorpio",
  planets: [
    { planet: "Venus", sign: "Virgo", house: 5, degree: 19.84, dignity: "fall" },
    { planet: "Jupiter", sign: "Virgo", house: 5, degree: 19.66, dignity: "detriment" },
    { planet: "Saturn", sign: "Aquarius", house: 10, degree: 13.95, dignity: "domicile", retrograde: true },
    { planet: "Mercury", sign: "Leo", house: 4, degree: 12.29, dignity: null },
    { planet: "Mars", sign: "Gemini", house: 2, degree: 18.09, dignity: null },
  ],
  aspects: [
    { planet1: "Venus", planet2: "Jupiter", type: "Conjunction", orb: 0.18 },
    { planet1: "Mercury", planet2: "Saturn", type: "Opposition", orb: 1.66 },
    { planet1: "Venus", planet2: "Mars", type: "Square", orb: 1.75 },
    { planet1: "Mars", planet2: "Jupiter", type: "Square", orb: 1.57 },
    { planet1: "Sun", planet2: "Moon", type: "Sextile", orb: 4.95 },
    { planet1: "Moon", planet2: "Mars", type: "Conjunction", orb: 7.46 },
  ],
  elemental_balance: { fire: 1, water: 1, earth: 3, air: 3 },
  modality_balance: { cardinal: 0, fixed: 3, mutable: 5 },
  dominant_signature: { element: "Earth", modality: "Mutable" },
  stelliums: [{ sign: "Virgo", house: 5, planets: ["Sun", "Venus", "Jupiter"] }],
  element_balance: { Fire: 1, Water: 1, Earth: 3, Air: 3 },
};

describe('buildConcretePrompt with interpretation layer', () => {
  it('produces the full prompt string', () => {
    const result = buildConcretePrompt(testChartData, { triggerWord: 'magicalpink' });
    console.log('=== FULL PROMPT OUTPUT ===');
    console.log(result);
    console.log('=== END PROMPT ===');
    expect(result).toContain('PERSONALITY EMPHASIS');
    expect(result).toContain('Sun + Venus + Jupiter stellium in Virgo');
    expect(result).toContain('Scorpio Rising intensity');
    expect(result).toContain('Venus Conjunction Jupiter');
  });
});
