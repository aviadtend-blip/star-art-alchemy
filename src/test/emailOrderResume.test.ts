import { describe, expect, it } from "vitest";

import {
  EMAIL_ORDER_RESUME_URL,
  buildEmailOrderResumeUrl,
  buildResumeSessionState,
} from "@/lib/emailOrderResume";

describe("emailOrderResume", () => {
  it("builds a deep link for the saved artwork size page", () => {
    expect(
      buildEmailOrderResumeUrl({
        artworkId: "art_123",
        sessionId: "session_456",
        fallbackUrl: "https://celestialartworks.com/shop",
      }),
    ).toBe(`${EMAIL_ORDER_RESUME_URL}?artwork_id=art_123&session_id=session_456`);
  });

  it("falls back when there is no recoverable artwork context", () => {
    expect(
      buildEmailOrderResumeUrl({
        artworkId: "",
        sessionId: "",
        fallbackUrl: "https://celestialartworks.com/shop",
      }),
    ).toBe("https://celestialartworks.com/shop");
  });

  it("builds restorable generator state from artwork and capture data", () => {
    const restored = buildResumeSessionState({
      artwork: {
        id: "art_123",
        session_id: "session_456",
        customer_name: "Aviad Shahar",
        artwork_url: "https://cdn.example.com/final.jpg",
        is_portrait_edition: false,
        birth_data: {
          year: 1990,
          month: 3,
          day: 13,
          hour: 11,
          minute: 45,
          city: "Tel Aviv",
          nation: "IL",
        },
        chart_data: {
          sun: { sign: "Aries" },
          moon: { sign: "Cancer" },
          rising: "Leo",
          element_balance: { fire: 5, water: 4 },
        },
        artwork_analysis: { summary: "A radiant chart." },
      },
      capture: {
        email: "user@example.com",
        first_name: "Aviad",
        sun_sign: "Aries",
        moon_sign: "Cancer",
        rising_sign: "Leo",
      },
    });

    expect(restored.generatorState.generatedImage).toBe("https://cdn.example.com/final.jpg");
    expect(restored.generatorState.artworkId).toBe("art_123");
    expect(restored.generatorState.chartData.sun.sign).toBe("Aries");
    expect(restored.generatorState.chartData.birth_date).toBe("1990-03-13");
    expect(restored.birthDetails.customerEmail).toBe("user@example.com");
    expect(restored.capturedFirstName).toBe("Aviad");
  });
});
