import { generateChartExplanation } from './generateExplanation';

const WORKING_FUNCTIONS_URL = 'https://kdfojrmzhpfphvgwgeov.supabase.co/functions/v1';

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
  const fallbackWithSource = {
    ...fallback,
    analyzedImageUrl: imageUrl || null,
  };

  if (!imageUrl || !chartData) {
    return fallbackWithSource;
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
    return {
      analyzedImageUrl: imageUrl,
      overview: fallback.overview,
      subjectExplanation: analysis.subjectExplanation || null,
      elements: [
        {
          ...fallback.elements[0],
          artworkElement: analysis.sun.artworkElement || fallback.elements[0].artworkElement,
          explanation: analysis.sun.explanation,
          aiPosition: normalizePosition(analysis.sun.position),
        },
        {
          ...fallback.elements[1],
          artworkElement: analysis.moon.artworkElement || fallback.elements[1].artworkElement,
          explanation: analysis.moon.explanation,
          aiPosition: normalizePosition(analysis.moon.position),
        },
        {
          ...fallback.elements[2],
          artworkElement: analysis.rising.artworkElement || fallback.elements[2].artworkElement,
          explanation: analysis.rising.explanation,
          aiPosition: normalizePosition(analysis.rising.position),
        },
        {
          ...fallback.elements[3],
          artworkElement: analysis.element.artworkElement || fallback.elements[3].artworkElement,
          explanation: analysis.element.explanation,
          aiPosition: normalizePosition(analysis.element.position),
        },
      ],
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
