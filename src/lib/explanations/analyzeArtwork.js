import { supabase } from '@/integrations/supabase/client';
import { generateChartExplanation } from './generateExplanation';
import { sanitizeAiHotspotAnalysis, getDominantElement } from './hotspotAnalysis';

/**
 * Analyzes the actual generated artwork image using AI vision,
 * producing artist's notes grounded in what's really in the image.
 *
 * @param {string} imageUrl - URL of the generated artwork
 * @param {object} chartData - The natal chart data
 * @param {object} [options] - Optional: { promptUsed, styleId } or legacy string (generationPrompt)
 * @returns {Promise<object>} Explanation object matching generateChartExplanation shape
 */
export async function analyzeArtwork(imageUrl, chartData, options = {}) {
  // Handle legacy signature: analyzeArtwork(url, chart, promptString)
  let promptUsed = null;
  let styleId = null;
  if (typeof options === 'string') {
    promptUsed = options;
  } else if (options && typeof options === 'object') {
    promptUsed = options.promptUsed || null;
    styleId = options.styleId || null;
  }

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
    if (promptUsed) body.promptUsed = promptUsed;
    if (styleId) body.styleId = styleId;

    const { data, error } = await supabase.functions.invoke('analyze-artwork', {
      body,
    });

    if (error) throw error;
    if (!data?.analysis) throw new Error('Empty analysis response');

    const { analysis } = data;

    console.log('🎨 AI artwork analysis received');

    // Build chart context for client-side sanitization (double-check server output)
    const safeChart = chartData || {};
    const sunSign = safeChart?.sun?.sign || 'Unknown';
    const moonSign = safeChart?.moon?.sign || 'Unknown';
    const rising = typeof safeChart?.rising === 'string'
      ? safeChart.rising
      : safeChart?.rising?.sign || 'Unknown';
    const elementBalance = safeChart?.element_balance || safeChart?.elements || {};
    const dominantElement = getDominantElement(elementBalance);

    const chartContext = { sunSign, moonSign, rising, dominantElement };

    // The server already sanitized, but we also run client-side validation
    // to handle any edge cases. We reconstruct from the analysis shape.
    // The server returns: analysis.sun, analysis.moon, etc. with mapped flag.

    // Build elements array — merge AI results with fallback per-slot
    const placements = ['sun', 'moon', 'rising', 'element'];
    const elements = placements.map((key, i) => {
      const aiResult = analysis[key];
      const fallbackEl = fallback.elements[i];
      const isMapped = aiResult?.mapped && aiResult?.explanation && aiResult?.artworkElement;

      if (isMapped) {
        // AI confidently matched — use AI data
        return {
          ...fallbackEl,
          artworkElement: aiResult.artworkElement,
          explanation: aiResult.explanation,
          aiPosition: normalizePosition(aiResult.position),
          focusBox: normalizeFocusBox(aiResult.focusBox),
          source: 'ai',
          confidence: aiResult.confidence,
        };
      } else {
        // Not mapped — use chart-based fallback
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

function normalizePosition(pos) {
  if (!pos || typeof pos.top !== 'number' && typeof pos.top !== 'string') return null;
  const parseNum = (v) => typeof v === 'string' ? parseFloat(v) : v;
  const top = Math.max(5, Math.min(95, parseNum(pos.top)));
  const left = Math.max(5, Math.min(95, parseNum(pos.left)));
  return { top: `${top}%`, left: `${left}%` };
}

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
