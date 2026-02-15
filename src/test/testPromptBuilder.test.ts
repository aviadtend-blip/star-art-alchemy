import { describe, it, expect } from "vitest";
import { buildCanonicalPrompt } from "@/lib/prompts/promptBuilder.js";

// Test natal chart: Sun in Leo, Moon in Pisces, Rising Virgo, Water-dominant
const testChart = {
  sun: { sign: "Leo", house: 5 },
  moon: { sign: "Pisces", house: 12 },
  rising: "Virgo",
  element_balance: { Fire: 3, Water: 4, Earth: 2, Air: 1 },
};

describe("buildCanonicalPrompt with zodiac symbolism", () => {
  it("generates a prompt and logs it for inspection", () => {
    const prompt = buildCanonicalPrompt(testChart);

    // Log the full prompt so we can visually inspect it
    console.log("========== GENERATED PROMPT ==========");
    console.log(prompt);
    console.log("========== END PROMPT ==========");

    // Basic sanity: prompt should be a non-empty string
    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe("string");
  });

  // --- These tests verify zodiac symbolism is woven into the prompt ---

  it("includes Leo sun SYMBOLIC IMAGERY", () => {
    const prompt = buildCanonicalPrompt(testChart);
    // We should see Leo's zodiacSymbolism text, e.g.:
    // "Mane-like corona. Crown or throne-like formations..."
    expect(prompt).toContain("SYMBOLIC IMAGERY");
  });

  it("includes Pisces moon EMOTIONAL SYMBOLISM", () => {
    const prompt = buildCanonicalPrompt(testChart);
    // We should see Pisces moon's zodiacSymbolism text, e.g.:
    // "Two fish swimming opposite directions around moon..."
    expect(prompt).toContain("EMOTIONAL SYMBOLISM");
  });

  it("includes Virgo rising PRESENTATION SYMBOLISM", () => {
    const prompt = buildCanonicalPrompt(testChart);
    // We should see Virgo rising's zodiacSymbolism text, e.g.:
    // "Wheat and harvest motifs in borders..."
    expect(prompt).toContain("PRESENTATION SYMBOLISM");
  });

  it("includes Water-dominant palette", () => {
    const prompt = buildCanonicalPrompt(testChart);
    // Water-dominant palette colors: #000080, #4682B4, #9370DB, etc.
    expect(prompt).toContain("Water-dominant");
  });
});
