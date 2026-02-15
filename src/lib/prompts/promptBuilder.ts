// Prompt builder - constructs AI image generation prompts from chart data
import { zodiacSigns, planets, elements, aspects } from "../data/canonicalDefinitions";
import type { ChartData } from "../astrology/chartCalculator";

export function buildArtworkPrompt(chartData: ChartData): string {
  const sun = zodiacSigns[chartData.sunSign as keyof typeof zodiacSigns];
  const moon = zodiacSigns[chartData.moonSign as keyof typeof zodiacSigns];
  const rising = zodiacSigns[chartData.risingSign as keyof typeof zodiacSigns];
  const dominantEl = elements[chartData.dominantElement as keyof typeof elements];

  const aspectDescriptions = chartData.aspects
    .map((a) => {
      const aspectDef = aspects[a.type as keyof typeof aspects];
      return `${a.planet1}-${a.planet2} ${a.type}: ${aspectDef?.visual}`;
    })
    .join("; ");

  const prompt = [
    `A mystical celestial artwork embodying the essence of a ${sun?.symbol} ${chartData.sunSign} Sun,`,
    `${moon?.symbol} ${chartData.moonSign} Moon, and ${rising?.symbol} ${chartData.risingSign} Rising.`,
    `Dominant element: ${chartData.dominantElement} — ${dominantEl?.texture}.`,
    `Color palette emphasizing ${dominantEl?.palette.join(", ")}.`,
    `Visual motifs: ${sun?.motif}; ${moon?.motif}; ${rising?.motif}.`,
    `Planetary aspects rendered as: ${aspectDescriptions}.`,
    `Style: ethereal digital painting, cosmic art, sacred geometry, high detail.`,
    `Dark background with luminous celestial elements. Ultra high resolution.`,
  ].join(" ");

  return prompt;
}

export function buildExplanation(chartData: ChartData): string[] {
  const sun = zodiacSigns[chartData.sunSign as keyof typeof zodiacSigns];
  const moon = zodiacSigns[chartData.moonSign as keyof typeof zodiacSigns];
  const rising = zodiacSigns[chartData.risingSign as keyof typeof zodiacSigns];

  return [
    `Your Sun in ${chartData.sunSign} (${sun?.symbol}) represents your core identity — expressed through motifs of ${sun?.motif}.`,
    `Your Moon in ${chartData.moonSign} (${moon?.symbol}) reflects your emotional landscape — visualized as ${moon?.motif}.`,
    `Your Rising sign ${chartData.risingSign} (${rising?.symbol}) shapes the artwork's outer frame — rendered with ${rising?.motif}.`,
    `The dominant ${chartData.dominantElement} element infuses the piece with ${elements[chartData.dominantElement as keyof typeof elements]?.texture} energy.`,
  ];
}
