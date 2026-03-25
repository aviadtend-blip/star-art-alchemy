/**
 * Server-side hotspot validation for analyze-artwork edge function.
 * Mirrors logic from src/lib/explanations/hotspotAnalysis.js
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
  'transcendent', 'enigmatic', 'arcane',
];

const ABSTRACT_LABEL_PATTERNS = [
  /^the\s+(central|emotional|overall|primary|secondary)\s/i,
  /\b(atmosphere|composition|framing|feel\s*&?\s*weight|overall feel)\b/i,
  /^(central focus|secondary detail|framing details|overall surface)$/i,
];

const SUBJECT_BANNED_WORDS = [
  'cosmic', 'celestial', 'mystical', 'ethereal', 'sacred', 'divine',
  'between worlds', 'subconscious', 'guardian', 'transcendent',
  'enigmatic', 'arcane', 'blueprint',
];

export function getDominantElement(elementBalance: Record<string, number>): string {
  if (!elementBalance || typeof elementBalance !== 'object') return 'Water';
  const entries = Object.entries(elementBalance).filter(([, v]) => Number.isFinite(v));
  if (!entries.length) return 'Water';
  return entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
}

function hasBannedNoun(text: string): boolean {
  if (!text) return true;
  const lower = text.toLowerCase();
  return BANNED_NOUNS.some(noun => lower.includes(noun));
}

function hasBannedLanguage(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => lower.includes(word));
}

function isAbstractLabel(label: string): boolean {
  if (!label) return true;
  return ABSTRACT_LABEL_PATTERNS.some(p => p.test(label.trim()));
}

function isLiteralLabel(label: string): boolean {
  if (!label || typeof label !== 'string') return false;
  const trimmed = label.trim();
  const words = trimmed.split(/\s+/);
  if (words.length < 2 || words.length > 6) return false;
  if (hasBannedNoun(trimmed)) return false;
  if (isAbstractLabel(trimmed)) return false;
  return true;
}

function isValidEvidence(evidence: string): boolean {
  return !!evidence && typeof evidence === 'string' && evidence.length >= 15;
}

function clampPos(val: number): number | null {
  if (typeof val !== 'number' || !Number.isFinite(val)) return null;
  return Math.max(5, Math.min(95, val));
}

function normalizePosition(pos: any): { top: string; left: string } | null {
  if (!pos || typeof pos.top !== 'number' || typeof pos.left !== 'number') return null;
  const top = clampPos(pos.top);
  const left = clampPos(pos.left);
  if (top === null || left === null) return null;
  return { top: `${top}%`, left: `${left}%` };
}

function normalizeFocusBox(box: any): { top: number; left: number; bottom: number; right: number } | null {
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

function mentionsCorrectPlacement(explanation: string, slotKey: string, ctx: any): boolean {
  if (!explanation) return false;
  const lower = explanation.toLowerCase();
  switch (slotKey) {
    case 'sun': { const s = (ctx.sunSign || '').toLowerCase(); return lower.includes(`${s} sun`) || lower.includes(`sun in ${s}`); }
    case 'moon': { const s = (ctx.moonSign || '').toLowerCase(); return lower.includes(`${s} moon`) || lower.includes(`moon in ${s}`); }
    case 'rising': { const s = (ctx.rising || '').toLowerCase(); return lower.includes(`${s} rising`) || lower.includes(`rising in ${s}`); }
    case 'element': { const e = (ctx.dominantElement || '').toLowerCase(); return lower.includes(`${e} dominant`) || lower.includes(`dominant ${e}`) || lower.includes(`${e} dominance`) || lower.includes(`${e} element`); }
    default: return false;
  }
}

function mentionsWrongPlacement(explanation: string, slotKey: string, ctx: any): boolean {
  if (!explanation) return false;
  const lower = explanation.toLowerCase();
  const allSigns = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const allElements = ['fire','water','earth','air'];
  switch (slotKey) {
    case 'sun': { const c = (ctx.sunSign || '').toLowerCase(); return allSigns.some(s => s !== c && (lower.includes(`${s} sun`) || lower.includes(`sun in ${s}`))); }
    case 'moon': { const c = (ctx.moonSign || '').toLowerCase(); return allSigns.some(s => s !== c && (lower.includes(`${s} moon`) || lower.includes(`moon in ${s}`))); }
    case 'rising': { const c = (ctx.rising || '').toLowerCase(); return allSigns.some(s => s !== c && (lower.includes(`${s} rising`) || lower.includes(`rising in ${s}`))); }
    case 'element': { const c = (ctx.dominantElement || '').toLowerCase(); return allElements.some(e => e !== c && (lower.includes(`${e} dominant`) || lower.includes(`dominant ${e}`))); }
    default: return false;
  }
}

function positionDistance(a: any, b: any): number {
  if (!a || !b) return Infinity;
  const p = (v: any) => typeof v === 'string' ? parseFloat(v) : v;
  const dT = p(a.top) - p(b.top);
  const dL = p(a.left) - p(b.left);
  return Math.sqrt(dT * dT + dL * dL);
}

/**
 * Validate subjectExplanation: 28-40 words, concrete, no mystical language.
 */
function validateSubjectExplanation(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (trimmed.length < 20) return null;

  const lower = trimmed.toLowerCase();
  if (SUBJECT_BANNED_WORDS.some(w => lower.includes(w))) return null;

  // Count sentences — max 2
  const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 3) return null;

  // Word count: allow 15-50 range (generous)
  const words = trimmed.split(/\s+/);
  if (words.length < 15 || words.length > 50) return null;

  return trimmed;
}

const PLACEMENT_KEYS = ['sun', 'moon', 'rising', 'element'];

export interface SanitizedSlot {
  mapped: boolean;
  regionId?: string;
  artworkElement?: string;
  explanation?: string | null;
  position?: { top: string; left: string } | null;
  confidence?: number;
  visibleEvidence?: string;
  regionType?: string | null;
}

export function sanitizeAiHotspotAnalysis(rawAnalysis: any, chartContext: any) {
  if (!rawAnalysis) return { subjectExplanation: null, observedRegions: [], slots: {} as Record<string, SanitizedSlot> };

  let regions: any[] = Array.isArray(rawAnalysis.observedRegions) ? rawAnalysis.observedRegions : [];

  regions = regions.filter((r: any) => {
    if (!r || !r.id) return false;
    if (!isLiteralLabel(r.literalLabel)) return false;
    if (!isValidEvidence(r.visibleEvidence)) return false;
    if (hasBannedLanguage(r.literalLabel)) return false;
    return true;
  });

  if (regions.length < 3) regions = [];
  else if (regions.length > 6) regions = regions.slice(0, 6);

  regions = regions.map((r: any) => ({
    ...r,
    position: normalizePosition(r.position),
    focusBox: normalizeFocusBox(r.focusBox),
  }));

  const regionMap: Record<string, any> = {};
  for (const r of regions) regionMap[r.id] = r;

  const rawSlots = rawAnalysis.chartMappings || {};
  const slots: Record<string, SanitizedSlot> = {};
  const usedRegions: Record<string, { key: string; confidence: number }> = {};

  for (const key of PLACEMENT_KEYS) {
    const raw = rawSlots[key];
    if (!raw || !raw.regionId || !regionMap[raw.regionId]) {
      slots[key] = { mapped: false }; continue;
    }
    const region = regionMap[raw.regionId];
    const explanation = raw.explanation;
    const confidence = typeof raw.confidence === 'number' ? raw.confidence : 0.5;

    // Validate the title (artworkElement) independently
    const aiTitle = raw.artworkElement || region.literalLabel;
    const titleValid = aiTitle && !isAbstractLabel(aiTitle) && !hasBannedNoun(aiTitle);

    // Validate the explanation
    const explanationValid = explanation
      && !hasBannedLanguage(explanation)
      && !mentionsWrongPlacement(explanation, key, chartContext)
      && mentionsCorrectPlacement(explanation, key, chartContext);

    // Check duplicate region usage — keep strongest
    if (usedRegions[raw.regionId]) {
      const existing = usedRegions[raw.regionId];
      if (confidence > existing.confidence) {
        slots[existing.key] = { mapped: false };
        usedRegions[raw.regionId] = { key, confidence };
      } else {
        // Still preserve title/position for fallback even if we lose the region
        slots[key] = {
          mapped: false,
          artworkElement: titleValid ? aiTitle : undefined,
        };
        continue;
      }
    } else {
      usedRegions[raw.regionId] = { key, confidence };
    }

    let clean = explanation;
    if (clean && clean.length > 300) clean = clean.substring(0, 297).replace(/\s+\S*$/, '') + '…';

    if (explanationValid) {
      slots[key] = {
        mapped: true,
        regionId: raw.regionId,
        artworkElement: titleValid ? aiTitle : region.literalLabel,
        explanation: clean,
        position: region.position,
        confidence,
        visibleEvidence: region.visibleEvidence,
        regionType: region.regionType || null,
      };
    } else {
      // Explanation failed, but preserve title + position for partial merge
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

  // Proximity dedup
  const mappedKeys = PLACEMENT_KEYS.filter(k => slots[k]?.mapped);
  for (let i = 0; i < mappedKeys.length; i++) {
    for (let j = i + 1; j < mappedKeys.length; j++) {
      const a = slots[mappedKeys[i]];
      const b = slots[mappedKeys[j]];
      if (!a.mapped || !b.mapped) continue;
      if (positionDistance(a.position, b.position) < 10) {
        if ((a.confidence || 0) >= (b.confidence || 0)) slots[mappedKeys[j]] = { mapped: false };
        else slots[mappedKeys[i]] = { mapped: false };
      }
    }
  }

  return {
    subjectExplanation: validateSubjectExplanation(rawAnalysis.subjectExplanation),
    observedRegions: regions,
    slots,
  };
}
