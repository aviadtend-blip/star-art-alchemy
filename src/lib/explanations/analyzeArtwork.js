import { supabase } from '@/integrations/supabase/client';
import { generateChartExplanation } from './generateExplanation';
import { sanitizeAiHotspotAnalysis, getDominantElement, isAbstractLabel, isBannedGenericTitle, findNearestUnusedRegionLabel } from './hotspotAnalysis';

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

    // Collect observed regions for fallback title lookup
    const observedRegions = analysis.observedRegions || [];

    // Track which region IDs have been used as titles
    const usedRegionIds = new Set();

    // Build elements array with per-field merge
    const placements = ['sun', 'moon', 'rising', 'element'];
    const elements = placements.map((key, i) => {
      const aiResult = analysis[key];
      const fallbackEl = fallback.elements[i];
      const isMapped = aiResult?.mapped && aiResult?.explanation && aiResult?.artworkElement;

      // Per-field merge: title, position, and explanation are independent
      // AI title survives even if AI explanation fails
      const aiTitleValid = aiResult?.artworkElement
        && !isAbstractLabel(aiResult.artworkElement)
        && !isBannedGenericTitle(aiResult.artworkElement);

      const useAiTitle = isMapped
        ? true
        : aiTitleValid; // Keep concrete AI title even on explanation fallback

      const useAiPosition = aiResult?.position != null;

      // Determine the final title using the priority chain:
      // 1. Mapped AI region label (if valid)
      // 2. AI title from failed-explanation slot (if concrete)
      // 3. Nearest unused observed region label
      // 4. Last-resort physical spatial fallback
      let finalTitle;
      if (useAiTitle) {
        finalTitle = aiResult.artworkElement;
      } else if (observedRegions.length > 0) {
        // Try to find nearest unused observed region label
        const slotPosition = useAiPosition
          ? normalizePosition(aiResult.position)
          : null;
        const nearestLabel = findNearestUnusedRegionLabel(
          observedRegions,
          usedRegionIds,
          slotPosition
        );
        finalTitle = nearestLabel || fallbackEl.artworkElement;
      } else {
        finalTitle = fallbackEl.artworkElement;
      }

      // Track used region IDs
      if (aiResult?.regionId) {
        usedRegionIds.add(aiResult.regionId);
      }

      if (isMapped) {
        // Fully mapped — use AI data
        return {
          ...fallbackEl,
          artworkElement: finalTitle,
          explanation: aiResult.explanation,
          aiPosition: normalizePosition(aiResult.position),
          focusBox: normalizeFocusBox(aiResult.focusBox),
          source: 'ai',
          confidence: aiResult.confidence,
        };
      } else {
        // Partial or full fallback — merge per field
        return {
          ...fallbackEl,
          artworkElement: finalTitle,
          explanation: fallbackEl.explanation, // always use fallback explanation
          aiPosition: useAiPosition ? normalizePosition(aiResult.position) : null,
          source: useAiTitle ? 'partial' : (finalTitle !== fallbackEl.artworkElement ? 'region' : 'fallback'),
        };
      }
    });

    // Use AI subjectExplanation if valid, otherwise fallback
    const subjectExplanation = analysis.subjectExplanation || null;

    return {
      analyzedImageUrl: imageUrl,
      overview: fallback.overview,
      subjectExplanation,
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
