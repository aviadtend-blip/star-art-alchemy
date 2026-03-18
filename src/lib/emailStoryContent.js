import { generateChartExplanation } from '@/lib/explanations/generateExplanation';

const DEFAULT_SUBJECT_EXPLANATION = 'A one-of-a-kind artwork, uniquely crafted from your celestial blueprint.';

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getRisingSign(chartData) {
  if (typeof chartData?.rising === 'string') return chartData.rising;
  return chartData?.rising?.sign || '';
}

function hasStorySource(chartData) {
  return Boolean(
    chartData?.sun?.sign ||
    chartData?.moon?.sign ||
    getRisingSign(chartData)
  );
}

function readStoredArtworkAnalysis() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem('celestial_generator_state');
    return raw ? JSON.parse(raw)?.artworkAnalysis || null : null;
  } catch {
    return null;
  }
}

function getStoryElementFields(element, fallbackTitle) {
  return {
    title: normalizeText(element?.artworkElement) || normalizeText(element?.subtitle) || fallbackTitle,
    copy: normalizeText(element?.explanation),
  };
}

export function buildEmailStoryContent({ chartData, artworkAnalysis } = {}) {
  const sunSign = chartData?.sun?.sign || '';
  const moonSign = chartData?.moon?.sign || '';
  const risingSign = getRisingSign(chartData);

  const resolvedExplanation =
    artworkAnalysis ||
    readStoredArtworkAnalysis() ||
    (hasStorySource(chartData) ? generateChartExplanation(chartData) : null);

  const storyElements = Array.isArray(resolvedExplanation?.elements)
    ? resolvedExplanation.elements
    : Array.isArray(resolvedExplanation?.hotspots)
      ? resolvedExplanation.hotspots
      : [];

  const sunStory = getStoryElementFields(storyElements[0], sunSign ? `Your ${sunSign} Sun` : '');
  const moonStory = getStoryElementFields(storyElements[1], moonSign ? `Your ${moonSign} Moon` : '');
  const risingStory = getStoryElementFields(storyElements[2], risingSign ? `Your ${risingSign} Rising` : '');

  return {
    emailStorySubjectExplanation:
      normalizeText(resolvedExplanation?.subjectExplanation) || DEFAULT_SUBJECT_EXPLANATION,
    emailStorySunTitle: sunStory.title,
    emailStorySunCopy: sunStory.copy,
    emailStoryMoonTitle: moonStory.title,
    emailStoryMoonCopy: moonStory.copy,
    emailStoryRisingTitle: risingStory.title,
    emailStoryRisingCopy: risingStory.copy,
  };
}
