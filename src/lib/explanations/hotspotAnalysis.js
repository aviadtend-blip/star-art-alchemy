/**
 * Shared sanitization / validation logic for hotspot analysis.
 * Used by the frontend (analyzeArtwork.js) to validate AI responses.
 */

const BANNED_NOUNS = [
  'guardian', 'messenger', 'sentinel', 'watcher', 'sorceress',
  'mechanism', 'beacon', 'oracle', 'harbinger', 'vessel',
  'tapestry', 'gateway', 'portal', 'emissary',
];

const BANNED_WORDS = [
  'represent', 'symbolize', 'vibrant', 'intricate', 'tapestry',
  'journey', 'essence', 'energy', 'manifest', 'celestial',
  'cosmic', 'mystical', 'ethereal', 'sacred', 'divine',
  'transcendent', 'enigmatic', 'arcane', 'celestial blueprint',
];

const ABSTRACT_LABEL_PATTERNS = [
  /^the\s+(central|emotional|overall|primary|secondary)\s/i,
  /\b(atmosphere|composition|framing|feel\s*&?\s*weight|overall feel)\b/i,
  /^(central focus|secondary detail|framing details|overall surface)$/i,
];

/**
 * Generic fallback titles that must never appear as UI-facing hotspot titles.
 * These are category names, not concrete visible labels.
 */
const BANNED_GENERIC_TITLES = [
  'central figure',
  'secondary shape',
  'outer edge',
  'lower texture',
  'main subject',
  'secondary detail',
  'framing details',
  'overall surface',
  'central focus',
  'emotional atmosphere',
  'composition & framing',
  'overall feel & weight',
  'primary element',
];

const SUBJECT_BANNED_WORDS = [
  'cosmic', 'celestial', 'mystical', 'ethereal', 'sacred', 'divine',
  'between worlds', 'subconscious', 'guardian', 'transcendent',
  'enigmatic', 'arcane', 'blueprint',
];

const PLACEMENT_KEYS = ['sun', 'moon', 'rising', 'element'];

/**
 * Get the dominant element from an element balance object.
 */
export function getDominantElement(elementBalance) {
  if (!elementBalance || typeof elementBalance !== 'object') return 'Water';
  const entries = Object.entries(elementBalance).filter(([, v]) => Number.isFinite(v));
  if (!entries.length) return 'Water';
  return entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
}

/**
 * Check if a label contains banned metaphor nouns.
 */
function hasBannedNoun(text) {
  if (!text) return true;
  const lower = text.toLowerCase();
  return BANNED_NOUNS.some(noun => lower.includes(noun));
}

/**
 * Check if text contains banned mystical language.
 */
function hasBannedLanguage(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => lower.includes(word));
}

/**
 * Check if a label is abstract (should be rejected as a hotspot title).
 */
export function isAbstractLabel(label) {
  if (!label) return true;
  return ABSTRACT_LABEL_PATTERNS.some(p => p.test(label.trim()));
}

/**
 * Check if a title is a banned generic fallback label.
 */
export function isBannedGenericTitle(title) {
  if (!title) return true;
  return BANNED_GENERIC_TITLES.includes(title.trim().toLowerCase());
}

/**
 * Check if a label is literal and 1-6 words.
 * Allows apostrophes and 1-word labels (e.g. "Dove", "Bull's Horns").
 */
function isLiteralLabel(label) {
  if (!label || typeof label !== 'string') return false;
  const trimmed = label.trim();
  // Allow apostrophes, letters, spaces, hyphens
  const words = trimmed.split(/\s+/);
  if (words.length < 1 || words.length > 6) return false;
  if (hasBannedNoun(trimmed)) return false;
  if (isAbstractLabel(trimmed)) return false;
  if (isBannedGenericTitle(trimmed)) return false;
  return true;
}

/**
 * Validate visible evidence — must be concrete and at least 15 chars.
 */
function isValidEvidence(evidence) {
  return evidence && typeof evidence === 'string' && evidence.length >= 15;
}

/**
 * Clamp a position value to 5-95 range.
 */
function clampPosition(val) {
  if (typeof val !== 'number' || !Number.isFinite(val)) return null;
  return Math.max(5, Math.min(95, val));
}

/**
 * Normalize a position object to { top: "X%", left: "Y%" }.
 */
function normalizePosition(pos) {
  if (!pos || typeof pos.top !== 'number' || typeof pos.left !== 'number') return null;
  const top = clampPosition(pos.top);
  const left = clampPosition(pos.left);
  if (top === null || left === null) return null;
  return { top: `${top}%`, left: `${left}%` };
}

/**
 * Normalize a focus box to 0-1 fractions.
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

/**
 * Check if a slot explanation mentions the correct placement.
 */
function mentionsCorrectPlacement(explanation, slotKey, chartContext) {
  if (!explanation || typeof explanation !== 'string') return false;
  const lower = explanation.toLowerCase();
  const { sunSign, moonSign, rising, dominantElement } = chartContext;

  switch (slotKey) {
    case 'sun': {
      const sign = (sunSign || '').toLowerCase();
      return lower.includes(`${sign} sun`) || lower.includes(`sun in ${sign}`);
    }
    case 'moon': {
      const sign = (moonSign || '').toLowerCase();
      return lower.includes(`${sign} moon`) || lower.includes(`moon in ${sign}`);
    }
    case 'rising': {
      const sign = (rising || '').toLowerCase();
      return lower.includes(`${sign} rising`) || lower.includes(`rising in ${sign}`);
    }
    case 'element': {
      const el = (dominantElement || '').toLowerCase();
      return lower.includes(`${el} dominant`) || lower.includes(`dominant ${el}`) ||
             lower.includes(`${el} dominance`) || lower.includes(`${el} element`);
    }
    default:
      return false;
  }
}

/**
 * Check if a slot explanation mentions a WRONG placement.
 */
function mentionsWrongPlacement(explanation, slotKey, chartContext) {
  if (!explanation || typeof explanation !== 'string') return false;
  const lower = explanation.toLowerCase();
  const { sunSign, moonSign, rising, dominantElement } = chartContext;

  const allSigns = ['aries','taurus','gemini','cancer','leo','virgo','libra',
                    'scorpio','sagittarius','capricorn','aquarius','pisces'];
  const allElements = ['fire','water','earth','air'];

  switch (slotKey) {
    case 'sun': {
      const correctSign = (sunSign || '').toLowerCase();
      return allSigns.some(s => s !== correctSign && (
        lower.includes(`${s} sun`) || lower.includes(`sun in ${s}`)
      ));
    }
    case 'moon': {
      const correctSign = (moonSign || '').toLowerCase();
      return allSigns.some(s => s !== correctSign && (
        lower.includes(`${s} moon`) || lower.includes(`moon in ${s}`)
      ));
    }
    case 'rising': {
      const correctSign = (rising || '').toLowerCase();
      return allSigns.some(s => s !== correctSign && (
        lower.includes(`${s} rising`) || lower.includes(`rising in ${s}`)
      ));
    }
    case 'element': {
      const correctEl = (dominantElement || '').toLowerCase();
      return allElements.some(e => e !== correctEl && (
        lower.includes(`${e} dominant`) || lower.includes(`dominant ${e}`)
      ));
    }
    default:
      return false;
  }
}

/**
 * Euclidean distance between two position objects (percentage values).
 */
function positionDistance(posA, posB) {
  if (!posA || !posB) return Infinity;
  const parseNum = (v) => typeof v === 'string' ? parseFloat(v) : v;
  const dTop = parseNum(posA.top) - parseNum(posB.top);
  const dLeft = parseNum(posA.left) - parseNum(posB.left);
  return Math.sqrt(dTop * dTop + dLeft * dLeft);
}

/**
 * Validate subjectExplanation: concrete, 15-50 words, no mystical language.
 */
export function validateSubjectExplanation(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (trimmed.length < 20) return null;

  const lower = trimmed.toLowerCase();
  if (SUBJECT_BANNED_WORDS.some(w => lower.includes(w))) return null;

  const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 3) return null;

  const words = trimmed.split(/\s+/);
  if (words.length < 15 || words.length > 50) return null;

  return trimmed;
}

/**
 * Find the nearest unused observed region to a given position.
 * Returns the region's literalLabel or null.
 */
export function findNearestUnusedRegionLabel(regions, usedRegionIds, targetPosition) {
  if (!regions || !regions.length || !targetPosition) return null;
  const unused = regions.filter(r => !usedRegionIds.has(r.id) && isLiteralLabel(r.literalLabel));
  if (!unused.length) return null;

  let bestRegion = null;
  let bestDist = Infinity;
  for (const r of unused) {
    const dist = positionDistance(r.position, targetPosition);
    if (dist < bestDist) {
      bestDist = dist;
      bestRegion = r;
    }
  }
  return bestRegion ? bestRegion.literalLabel : null;
}

/**
 * Sanitize and validate a raw AI analysis response.
 *
 * @param {object} rawAnalysis - The raw AI JSON response
 * @param {object} chartContext - { sunSign, moonSign, rising, dominantElement }
 * @returns {object} Sanitized analysis with validated slots
 */
export function sanitizeAiHotspotAnalysis(rawAnalysis, chartContext) {
  if (!rawAnalysis) return { subjectExplanation: null, observedRegions: [], slots: {} };

  // 1. Validate observed regions
  let regions = Array.isArray(rawAnalysis.observedRegions) ? rawAnalysis.observedRegions : [];

  // Filter to valid regions
  regions = regions.filter(r => {
    if (!r || !r.id) return false;
    if (!isLiteralLabel(r.literalLabel)) return false;
    if (!isValidEvidence(r.visibleEvidence)) return false;
    if (hasBannedLanguage(r.literalLabel)) return false;
    return true;
  });

  // Normalize to 3-6 regions or empty
  if (regions.length < 3) {
    regions = [];
  } else if (regions.length > 6) {
    regions = regions.slice(0, 6);
  }

  // Clamp positions
  regions = regions.map(r => ({
    ...r,
    position: normalizePosition(r.position),
    focusBox: normalizeFocusBox(r.focusBox),
  }));

  // Build region lookup
  const regionMap = {};
  for (const r of regions) {
    regionMap[r.id] = r;
  }

  // 2. Validate each slot
  const rawSlots = rawAnalysis.chartMappings || {};
  const slots = {};
  const usedRegions = {}; // regionId -> { key, confidence }

  for (const key of PLACEMENT_KEYS) {
    const raw = rawSlots[key];
    if (!raw || !raw.regionId || !regionMap[raw.regionId]) {
      slots[key] = { mapped: false };
      continue;
    }

    const region = regionMap[raw.regionId];
    const explanation = raw.explanation;
    const confidence = typeof raw.confidence === 'number' ? raw.confidence : 0.5;

    // Validate title independently — reject banned generic titles
    const aiTitle = raw.artworkElement || region.literalLabel;
    const titleValid = aiTitle
      && !isAbstractLabel(aiTitle)
      && !hasBannedNoun(aiTitle)
      && !isBannedGenericTitle(aiTitle);

    // Validate explanation
    const explanationValid = explanation
      && !hasBannedLanguage(explanation)
      && !mentionsWrongPlacement(explanation, key, chartContext)
      && mentionsCorrectPlacement(explanation, key, chartContext);

    // Check for duplicate region usage — keep strongest
    if (usedRegions[raw.regionId]) {
      const existing = usedRegions[raw.regionId];
      if (confidence > existing.confidence) {
        // Null out the weaker slot
        slots[existing.key] = { mapped: false };
        usedRegions[raw.regionId] = { key, confidence };
      } else {
        slots[key] = {
          mapped: false,
          artworkElement: titleValid ? aiTitle : undefined,
        };
        continue;
      }
    } else {
      usedRegions[raw.regionId] = { key, confidence };
    }

    // Truncate explanation to 300 chars
    let cleanExplanation = explanation;
    if (cleanExplanation && cleanExplanation.length > 300) {
      cleanExplanation = cleanExplanation.substring(0, 297).replace(/\s+\S*$/, '') + '…';
    }

    if (explanationValid) {
      slots[key] = {
        mapped: true,
        regionId: raw.regionId,
        artworkElement: titleValid ? aiTitle : region.literalLabel,
        explanation: cleanExplanation,
        position: region.position,
        confidence,
        visibleEvidence: region.visibleEvidence,
        regionType: region.regionType || null,
      };
    } else {
      // Explanation failed but preserve title + position for partial merge
      slots[key] = {
        mapped: false,
        regionId: raw.regionId,
        artworkElement: titleValid ? aiTitle : undefined,
        explanation: null,
        position: region.position,
        confidence,
        visibleEvidence: region.visibleEvidence,
        regionType: region.regionType || null,
      };
    }
  }

  // 3. Proximity check — if two mapped hotspots are within 10% distance, null the weaker
  const mappedKeys = PLACEMENT_KEYS.filter(k => slots[k]?.mapped);
  for (let i = 0; i < mappedKeys.length; i++) {
    for (let j = i + 1; j < mappedKeys.length; j++) {
      const a = slots[mappedKeys[i]];
      const b = slots[mappedKeys[j]];
      if (!a.mapped || !b.mapped) continue;
      const dist = positionDistance(a.position, b.position);
      if (dist < 10) {
        // Null the weaker one
        if ((a.confidence || 0) >= (b.confidence || 0)) {
          slots[mappedKeys[j]] = { mapped: false };
        } else {
          slots[mappedKeys[i]] = { mapped: false };
        }
      }
    }
  }

  return {
    subjectExplanation: validateSubjectExplanation(rawAnalysis.subjectExplanation),
    observedRegions: regions,
    slots,
  };
}
