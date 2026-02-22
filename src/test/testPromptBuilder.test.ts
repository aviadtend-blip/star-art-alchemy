import { describe, it, expect, vi } from "vitest";
import { buildConcretePrompt } from "@/lib/prompts/promptBuilder.js";

// Mock AI interpretation for unit tests
vi.mock('@/lib/prompts/getAIInterpretation.js', () => ({
  default: vi.fn().mockResolvedValue(
    'Mock AI narrative for testing. Tensions create contrast. Moon hides beneath rising. Unique feature stands out.'
  ),
}));

const testChart = {
  sun: { sign: "Leo", house: 5 },
  moon: { sign: "Pisces", house: 12 },
  rising: "Virgo",
  element_balance: { Fire: 3, Water: 4, Earth: 2, Air: 1 },
};

describe("buildConcretePrompt with lean reordered structure", () => {
  it("generates a prompt and logs it for inspection", async () => {
    const prompt = await buildConcretePrompt(testChart);

    console.log("========== GENERATED PROMPT ==========");
    console.log(prompt);
    console.log("========== END PROMPT ==========");

    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe("string");
  });

  it("starts with trigger word then WHO THIS PERSON IS", async () => {
    const prompt = await buildConcretePrompt(testChart);
    const lines = prompt.split("\n").filter(l => l.trim());
    expect(lines[0]).toContain("magicalpink");
    expect(prompt.indexOf("WHO THIS PERSON IS")).toBeLessThan(prompt.indexOf("SUN ("));
  });

  it("includes AI narrative in WHO THIS PERSON IS section", async () => {
    const prompt = await buildConcretePrompt(testChart);
    expect(prompt).toContain("Mock AI narrative");
  });

  it("includes Leo sun description without color hex codes", async () => {
    const prompt = await buildConcretePrompt(testChart);
    expect(prompt).toContain("SUN (Leo)");
    expect(prompt).toContain("radiant golden sun");
    expect(prompt).not.toMatch(/#[0-9A-Fa-f]{6}/);
  });

  it("includes Pisces moon atmosphere", async () => {
    const prompt = await buildConcretePrompt(testChart);
    expect(prompt).toContain("MOON (Pisces)");
    expect(prompt).toContain("dissolve");
  });

  it("includes Virgo rising compositional style", async () => {
    const prompt = await buildConcretePrompt(testChart);
    expect(prompt).toContain("RISING (Virgo)");
    expect(prompt).toContain("Precisely organized");
  });

  it("does not contain removed sections", async () => {
    const prompt = await buildConcretePrompt(testChart);
    expect(prompt).not.toContain("COLOR PALETTE");
    expect(prompt).not.toContain("SPECIFIC OBJECTS CHECKLIST");
    expect(prompt).not.toContain("Colors:");
    // Note: percentage refs in circleDescription come from upstream data, not promptBuilder
  });

  it("includes COMPOSITION and SPATIAL ARRANGEMENT", async () => {
    const prompt = await buildConcretePrompt(testChart);
    expect(prompt).toContain("COMPOSITION:");
    expect(prompt).toContain("SPATIAL ARRANGEMENT:");
  });
});
