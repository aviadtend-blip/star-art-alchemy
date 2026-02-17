import { describe, it, expect } from "vitest";
import { buildConcretePrompt } from "@/lib/prompts/promptBuilder.js";

// Test natal chart: Sun in Leo, Moon in Pisces, Rising Virgo, Water-dominant
const testChart = {
  sun: { sign: "Leo", house: 5 },
  moon: { sign: "Pisces", house: 12 },
  rising: "Virgo",
  element_balance: { Fire: 3, Water: 4, Earth: 2, Air: 1 },
};

describe("buildConcretePrompt with concrete visual instructions", () => {
  it("generates a prompt and logs it for inspection", () => {
    const prompt = buildConcretePrompt(testChart);

    console.log("========== GENERATED PROMPT ==========");
    console.log(prompt);
    console.log("========== END PROMPT ==========");

    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe("string");
  });

  it("includes Leo sun circle description", () => {
    const prompt = buildConcretePrompt(testChart);
    expect(prompt).toContain("radiant golden sun");
    expect(prompt).toContain("35-40%");
  });

  it("includes Pisces moon atmosphere", () => {
    const prompt = buildConcretePrompt(testChart);
    expect(prompt).toContain("blurred edges");
    expect(prompt).toContain("dissolve");
  });

  it("includes Virgo rising compositional style", () => {
    const prompt = buildConcretePrompt(testChart);
    expect(prompt).toContain("Precisely organized");
    expect(prompt).toContain("Hexagonal patterns");
  });

  it("includes Water-dominant palette", () => {
    const prompt = buildConcretePrompt(testChart);
    expect(prompt).toContain("Water-dominant");
    expect(prompt).toContain("Cool blues");
  });

  it("includes object checklist", () => {
    const prompt = buildConcretePrompt(testChart);
    expect(prompt).toContain("SPECIFIC OBJECTS CHECKLIST");
    expect(prompt).toContain("✓ 1 main sun circle");
  });

  it("includes spatial arrangement with percentages", () => {
    const prompt = buildConcretePrompt(testChart);
    expect(prompt).toContain("SPATIAL ARRANGEMENT");
    expect(prompt).toContain("occupies approximately");
  });
});
