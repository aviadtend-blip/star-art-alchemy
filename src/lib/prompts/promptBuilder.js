import buildInterpretationLayer from './buildInterpretationLayer.js';
import getAIInterpretation from './getAIInterpretation.js';


export async function buildConcretePrompt(chartData, style, isPortraitEdition = false) {
  chartData = buildInterpretationLayer(chartData);

  // Get the AI scene narrative
  const aiNarrative = await getAIInterpretation(chartData, isPortraitEdition);

  // AI narrative already encodes all zodiac symbolism — no prefix needed
  const contentPrompt = aiNarrative;

  // Trim to ~500 chars max (before params)
  const trimmed = contentPrompt.length > 500 ? contentPrompt.substring(0, 497) + '...' : contentPrompt;

  if (import.meta.env.DEV) {
    console.log('🎨 Built prompt:', {
      sun: chartData.sun.sign,
      moon: chartData.moon.sign,
      rising: chartData.rising,
      style: style?.id,
      length: trimmed.length,
      prompt: trimmed,
    });
  }

  return trimmed;
}

// Keep backward-compatible export name
export const buildCanonicalPrompt = buildConcretePrompt;
