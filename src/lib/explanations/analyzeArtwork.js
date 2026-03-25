import { supabase } from '@/integrations/supabase/client';
import { generateChartExplanation } from './generateExplanation';

/**
 * Analyzes the actual generated artwork image using AI vision,
 * producing artist's notes grounded in what's really in the image.
 *
 * The new schema uses a two-phase approach:
 *   Phase 1: Gemini observes 2-4 visual regions with evidence
 *   Phase 2: Gemini maps chart placements to those regions (nullable)
 *
 * When a mapping is null (no confident match), the fallback provides
 * a chart-based personality explanation with an honest spatial label.
 *
 * @param {string} imageUrl - URL of the generated artwork
 * @param {object} chartData - The natal chart data
 * @param {string|null} generationPrompt - The prompt used to generate the artwork
 * @returns {Promise<object>} Explanation object matching generateChartExplanation shape
 */
export async function analyzeArtwork(imageUrl, chartData, generationPrompt = null) {
  // Always prepare the static fallback
  const fallback = generateChartExplanation(chartData);
  const fallbackWithSource = {
    ...fallback,
    analyzedImageUrl: imageUrl || null,
  };

  if (!imageUrl || !chartData) {
    return fallbackWithSource;
  }

  try {
    const body = { imageUrl, chartData };
    if (generationPrompt) body.generationPrompt = generationPrompt;

    const { data, error } = await supabase.functions.invoke('analyze-artwork', {
      body,
    });

    if (error) throw error;
    if (!data?.analysis) throw new Error('Empty analysis response');

    const { analysis } = data;

    console.log('🎨 AI artwork analysis received');

    // Build elements array. For each of the 4 placements, use AI mapping
    // if it was confident, otherwise fall back to chart-based explanation
    // with honest spatial labels.
    const placements = ['sun', 'moon', 'rising', 'element'];
    const elements = placements.map((key, i) => {
      const aiResult = analysis[key];
      const fallbackEl = fallback.elements[i];
      const isMapped = aiResult?.mapped && aiResult?.explanation && aiResult?.artworkElement;

      if (isMapped) {
        // AI confidently matched this placement to a visible region
        return {
          ...fallbackEl,
          artworkElement: aiResult.artworkElement,
          explanation: aiResult.explanation,
          aiPosition: normalizePosition(aiResult.position),
          focusBox: normalizeFocusBox(aiResult.focusBox),
          source: 'ai',
        };
      } else {
        // No confident AI match — use chart-based explanation with honest label
        return {
          ...fallbackEl,
          source: 'fallback',
        };
      }
    });

    return {
      analyzedImageUrl: imageUrl,
      overview: fallback.overview,
      subjectExplanation: analysis.subjectExplanation || null,
      elements,
      _observedRegions: analysis.observedRegions || null,
    };
  } catch (err) {
    console.error('Artwork analysis failed, using static fallback:', err);
    return fallbackWithSource;
  }
}

/**
 * Clamp and format AI-returned position into a valid { top, left } percentage object.
 * Returns null if the position is missing or invalid.
 */
function normalizePosition(pos) {
  if (!pos || typeof pos.top !== 'number' || typeof pos.left !== 'number') return null;
  const top = Math.max(5, Math.min(95, pos.top));
  const left = Math.max(5, Math.min(95, pos.left));
  return { top: `${top}%`, left: `${left}%` };
}

/**
 * Normalize a focusBox from the AI response into { top, left, bottom, right } as 0-1 fractions.
 * Returns null if invalid.
 */
function normalizeFocusBox(box) {
  if (!box || typeof box.top !== 'number' || typeof box.left !== 'number' ||
      typeof box.bottom !== 'number' || typeof box.right !== 'number') return null;
  const t = Math.max(0, Math.min(100, box.top)) / 100;
  const l = Math.max(0, Math.min(100, box.left)) / 100;
  const b = Math.max(0, Math.min(100, box.bottom)) / 100;
  const r = Math.max(0, Math.min(100, box.right)) / 100;
  if (b <= t || r <= l) return null;
  if ((r - l) < 0.05 || (b - t) < 0.05) return null;
  return { top: t, left: l, bottom: b, right: r };
}
