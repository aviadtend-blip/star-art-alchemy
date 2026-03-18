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
  createEmailMockupGalleryMock,
  createEmailStoryGalleryMock,
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
  createEmailMockupGalleryMock: vi.fn(),
  createEmailStoryGalleryMock: vi.fn(),
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

vi.mock("@/lib/emailMockupGallery", () => ({
  createEmailMockupGallery: createEmailMockupGalleryMock,
}));

vi.mock("@/lib/emailStoryGallery", () => ({
  createEmailStoryGallery: createEmailStoryGalleryMock,
}));

describe("EmailCaptureModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invokeMock.mockResolvedValue({ error: null });
    getAlternateVariationMock.mockReturnValue(null);
    createEmailMockupGalleryMock.mockResolvedValue({
      small: "",
      medium: "",
      large: "",
    });
    createEmailStoryGalleryMock.mockResolvedValue({
      sunCropUrl: "",
      moonCropUrl: "",
      risingCropUrl: "",
    });
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

  it("submits populated Email 2 story fields for the Klaviyo nurture flow", async () => {
    getAlternateVariationMock.mockReturnValue({
      imageUrl: "https://project.supabase.co/storage/v1/object/public/artworks/variation-2.jpg",
      variationNumber: 2,
      totalVariations: 4,
    });
    createEmailMockupGalleryMock.mockResolvedValue({
      small: "https://project.supabase.co/storage/v1/object/public/artworks/mockup-small.jpg",
      medium: "https://project.supabase.co/storage/v1/object/public/artworks/mockup-medium.jpg",
      large: "https://project.supabase.co/storage/v1/object/public/artworks/mockup-large.jpg",
    });
    createEmailStoryGalleryMock.mockResolvedValue({
      sunCropUrl: "https://project.supabase.co/storage/v1/object/public/artworks/story-sun.jpg",
      moonCropUrl: "https://project.supabase.co/storage/v1/object/public/artworks/story-moon.jpg",
      risingCropUrl: "https://project.supabase.co/storage/v1/object/public/artworks/story-rising.jpg",
    });

    sessionStorage.setItem(
      "celestial_generator_state",
      JSON.stringify({
        generatedImage: "https://project.supabase.co/storage/v1/object/public/artworks/final.jpg",
        artworkId: "art_from_state",
      }),
    );
    sessionStorage.setItem("celestial_session_id", "session_123");
    sessionStorage.setItem("celestial_artwork_id", "art_from_state");

    const artworkAnalysis = {
      subjectExplanation: "Every symbol in this piece connects back to your natal blueprint.",
      elements: [
        {
          artworkElement: "The blazing central crest",
          explanation: "Your Sun story is anchored in the artwork's central focal point.",
        },
        {
          artworkElement: "The tidal crescent arc",
          explanation: "Your Moon story appears in the softer lunar rhythm of the composition.",
        },
        {
          artworkElement: "The ascending outer frame",
          explanation: "Your Rising story shapes the first impression around the edge of the piece.",
        },
      ],
    };

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
        artworkAnalysis={artworkAnalysis}
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
      emailMockupUrl: "https://project.supabase.co/storage/v1/object/public/artworks/mockup-medium.jpg",
      emailMockupSmallUrl: "https://project.supabase.co/storage/v1/object/public/artworks/mockup-small.jpg",
      emailMockupMediumUrl: "https://project.supabase.co/storage/v1/object/public/artworks/mockup-medium.jpg",
      emailMockupLargeUrl: "https://project.supabase.co/storage/v1/object/public/artworks/mockup-large.jpg",
      artworkId: "art_from_state",
      sessionId: "session_123",
      captureTimestamp: expect.any(String),
      peakSeason: "holiday",
      dominantElement: "fire",
      elementBalance: { fire: 6, water: 2, air: 1, earth: 1 },
      emailStorySubjectExplanation: "Every symbol in this piece connects back to your natal blueprint.",
      emailStorySunTitle: "The blazing central crest",
      emailStorySunCopy: "Your Sun story is anchored in the artwork's central focal point.",
      emailStorySunCropUrl: "https://project.supabase.co/storage/v1/object/public/artworks/story-sun.jpg",
      emailStoryMoonTitle: "The tidal crescent arc",
      emailStoryMoonCopy: "Your Moon story appears in the softer lunar rhythm of the composition.",
      emailStoryMoonCropUrl: "https://project.supabase.co/storage/v1/object/public/artworks/story-moon.jpg",
      emailStoryRisingTitle: "The ascending outer frame",
      emailStoryRisingCopy: "Your Rising story shapes the first impression around the edge of the piece.",
      emailStoryRisingCropUrl: "https://project.supabase.co/storage/v1/object/public/artworks/story-rising.jpg",
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
      emailMockupSmallUrl: "",
      emailMockupMediumUrl: "",
      emailMockupLargeUrl: "",
      artworkId: null,
      sessionId: null,
      captureTimestamp: expect.any(String),
      peakSeason: "holiday",
      dominantElement: undefined,
      elementBalance: undefined,
      emailStorySubjectExplanation: "A one-of-a-kind artwork, uniquely crafted from your celestial blueprint.",
      emailStorySunTitle: "",
      emailStorySunCopy: "",
      emailStorySunCropUrl: "",
      emailStoryMoonTitle: "",
      emailStoryMoonCopy: "",
      emailStoryMoonCropUrl: "",
      emailStoryRisingTitle: "",
      emailStoryRisingCopy: "",
      emailStoryRisingCropUrl: "",
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
      emailMockupSmallUrl: "",
      emailMockupMediumUrl: "",
      emailMockupLargeUrl: "",
      artworkId: null,
      sessionId: null,
      captureTimestamp: expect.any(String),
      peakSeason: "holiday",
      dominantElement: undefined,
      elementBalance: undefined,
      emailStorySubjectExplanation: "A one-of-a-kind artwork, uniquely crafted from your celestial blueprint.",
      emailStorySunTitle: "",
      emailStorySunCopy: "",
      emailStorySunCropUrl: "",
      emailStoryMoonTitle: "",
      emailStoryMoonCopy: "",
      emailStoryMoonCropUrl: "",
      emailStoryRisingTitle: "",
      emailStoryRisingCopy: "",
      emailStoryRisingCropUrl: "",
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
      emailMockupSmallUrl: "",
      emailMockupMediumUrl: "",
      emailMockupLargeUrl: "",
      artworkId: null,
      sessionId: null,
      captureTimestamp: expect.any(String),
      peakSeason: "holiday",
      dominantElement: undefined,
      elementBalance: undefined,
      emailStorySubjectExplanation: "A one-of-a-kind artwork, uniquely crafted from your celestial blueprint.",
      emailStorySunTitle: "",
      emailStorySunCopy: "",
      emailStorySunCropUrl: "",
      emailStoryMoonTitle: "",
      emailStoryMoonCopy: "",
      emailStoryMoonCropUrl: "",
      emailStoryRisingTitle: "",
      emailStoryRisingCopy: "",
      emailStoryRisingCropUrl: "",
    });
  });
});
