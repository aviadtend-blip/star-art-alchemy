import { supabase } from '@/integrations/supabase/client';
import { generateChartExplanation } from './generateExplanation';

/**
 * Analyzes the actual generated artwork image using AI vision,
 * producing artist's notes grounded in what's really in the image.
 *
 * Falls back to the static rule-based explanations if the AI call fails.
 *
 * @param {string} imageUrl - URL of the generated artwork
 * @param {object} chartData - The natal chart data
 * @returns {Promise<object>} Explanation object matching generateChartExplanation shape
 */
export async function analyzeArtwork(imageUrl, chartData) {
  // Always prepare the static fallback
  const fallback = generateChartExplanation(chartData);

  if (!imageUrl || !chartData) {
    return fallback;
  }

  try {
    const { data, error } = await supabase.functions.invoke('analyze-artwork', {
      body: { imageUrl, chartData },
    });

    if (error) throw error;
    if (!data?.analysis) throw new Error('Empty analysis response');

    const { analysis } = data;

    console.log('🎨 AI artwork analysis received');

    // Build the explanation object in the same shape as generateChartExplanation,
    // but with AI-generated text that references the actual image
    const dominantElement = getDominantElement(chartData.element_balance);

    return {
      overview: fallback.overview,
      elements: [
        {
          ...fallback.elements[0],
          explanation: analysis.sun.explanation,
          meaning: analysis.sun.insight,
          aiPosition: normalizePosition(analysis.sun.position),
        },
        {
          ...fallback.elements[1],
          explanation: analysis.moon.explanation,
          meaning: analysis.moon.insight,
          aiPosition: normalizePosition(analysis.moon.position),
        },
        {
          ...fallback.elements[2],
          explanation: analysis.rising.explanation,
          meaning: analysis.rising.insight,
          aiPosition: normalizePosition(analysis.rising.position),
        },
        {
          ...fallback.elements[3],
          explanation: analysis.element.explanation,
          meaning: analysis.element.insight,
          aiPosition: normalizePosition(analysis.element.position),
        },
      ],
    };
  } catch (err) {
    console.error('Artwork analysis failed, using static fallback:', err);
    return fallback;
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

function getDominantElement(elementBalance) {
  return Object.keys(elementBalance).reduce((a, b) =>
    elementBalance[a] > elementBalance[b] ? a : b
  );
}
