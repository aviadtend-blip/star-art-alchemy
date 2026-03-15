import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import EmailCaptureModal from "@/components/EmailCaptureModal";

const {
  invokeMock,
  fromMock,
  selectMock,
  eqMock,
  maybeSingleMock,
  orderMock,
  limitMock,
  identifyProfileMock,
  trackEmailCapturedMock,
  detectPeakSeasonMock,
  getAlternateVariationMock,
} = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  fromMock: vi.fn(),
  selectMock: vi.fn(),
  eqMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  orderMock: vi.fn(),
  limitMock: vi.fn(),
  identifyProfileMock: vi.fn(),
  trackEmailCapturedMock: vi.fn(),
  detectPeakSeasonMock: vi.fn(() => "holiday"),
  getAlternateVariationMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
    functions: {
      invoke: invokeMock,
    },
  },
}));

vi.mock("@/lib/klaviyo", () => ({
  identifyProfile: identifyProfileMock,
  trackEmailCaptured: trackEmailCapturedMock,
  detectPeakSeason: detectPeakSeasonMock,
}));

vi.mock("@/lib/api/replicateClient", () => ({
  getAlternateVariation: getAlternateVariationMock,
}));

describe("EmailCaptureModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invokeMock.mockResolvedValue({ error: null });
    getAlternateVariationMock.mockReturnValue(null);
    maybeSingleMock.mockResolvedValue({ data: null });
    limitMock.mockReturnValue({ maybeSingle: maybeSingleMock });
    orderMock.mockReturnValue({ limit: limitMock });
    eqMock.mockReturnValue({
      maybeSingle: maybeSingleMock,
      order: orderMock,
    });
    selectMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ select: selectMock });
    sessionStorage.clear();
  });

  it("submits normalized data for the Klaviyo nurture flow", async () => {
    getAlternateVariationMock.mockReturnValue({
      imageUrl: "https://project.supabase.co/storage/v1/object/public/artworks/variation-2.jpg",
      variationNumber: 2,
      totalVariations: 4,
    });

    sessionStorage.setItem(
      "celestial_generator_state",
      JSON.stringify({
        generatedImage: "https://project.supabase.co/storage/v1/object/public/artworks/final.jpg",
        artworkId: "art_from_state",
      }),
    );
    sessionStorage.setItem("celestial_session_id", "session_123");

    render(
      <EmailCaptureModal
        isOpen
        onClose={vi.fn()}
        artworkUrl="https://temp.example.com/preview.jpg"
        formData={{ name: "Aviad Shahar" }}
        chartData={{
          sun: { sign: "Aries" },
          moon: { sign: "Cancer" },
          rising: "Leo",
          element_balance: { fire: 6, water: 2, air: 1, earth: 1 },
        }}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
      target: { value: " User@Example.com " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send My Preview ✦" }));

    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));

    const invokeArgs = invokeMock.mock.calls[0][1];
    const expectedProfileData = {
      email: "User@Example.com",
      firstName: "Aviad",
      sunSign: "Aries",
      moonSign: "Cancer",
      risingSign: "Leo",
      artworkUrl: "https://project.supabase.co/storage/v1/object/public/artworks/final.jpg",
      artworkVariationUrl:
        "https://project.supabase.co/storage/v1/object/public/artworks/variation-2.jpg",
      emailMockupUrl: "https://project.supabase.co/storage/v1/object/public/artworks/final.jpg",
      artworkId: "art_from_state",
      sessionId: "session_123",
      captureTimestamp: expect.any(String),
      peakSeason: "holiday",
      dominantElement: "fire",
      elementBalance: { fire: 6, water: 2, air: 1, earth: 1 },
    };

    expect(invokeMock.mock.calls[0][0]).toBe("capture-email");
    expect(invokeArgs.body).toEqual({
      ...expectedProfileData,
      sessionId: "session_123",
    });
    expect(identifyProfileMock).toHaveBeenCalledWith(expectedProfileData);
    expect(trackEmailCapturedMock).toHaveBeenCalledWith(expectedProfileData);
  });

  it("applies sparse-input fallbacks without dropping the Klaviyo contract fields", async () => {
    render(
      <EmailCaptureModal
        isOpen
        onClose={vi.fn()}
        artworkUrl=""
        formData={{}}
        chartData={{}}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
      target: { value: " sparse@example.com " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send My Preview ✦" }));

    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));

    const invokeArgs = invokeMock.mock.calls[0][1];
    expect(invokeArgs.body).toEqual({
      email: "sparse@example.com",
      firstName: "",
      sunSign: undefined,
      moonSign: undefined,
      risingSign: undefined,
      artworkUrl: "",
      artworkVariationUrl: "",
      emailMockupUrl: "",
      artworkId: null,
      sessionId: null,
      captureTimestamp: expect.any(String),
      peakSeason: "holiday",
      dominantElement: undefined,
      elementBalance: undefined,
    });
    expect(identifyProfileMock).toHaveBeenCalledWith({
      email: "sparse@example.com",
      firstName: "",
      sunSign: undefined,
      moonSign: undefined,
      risingSign: undefined,
      artworkUrl: "",
      artworkVariationUrl: "",
      emailMockupUrl: "",
      artworkId: null,
      sessionId: null,
      captureTimestamp: expect.any(String),
      peakSeason: "holiday",
      dominantElement: undefined,
      elementBalance: undefined,
    });
    expect(trackEmailCapturedMock).toHaveBeenCalledWith({
      email: "sparse@example.com",
      firstName: "",
      sunSign: undefined,
      moonSign: undefined,
      risingSign: undefined,
      artworkUrl: "",
      artworkVariationUrl: "",
      emailMockupUrl: "",
      artworkId: null,
      captureTimestamp: expect.any(String),
      peakSeason: "holiday",
      dominantElement: undefined,
      elementBalance: undefined,
    });
  });
});
