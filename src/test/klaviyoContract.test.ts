import { describe, expect, it } from "vitest";

import {
  KLAVIYO_DEFAULTS,
  buildEmailCapturedEventAttributes,
  buildKlaviyoIdentifyAttributes,
} from "@/lib/klaviyoContract";

const EXPECTED_TOP_LEVEL_KEYS = ["email", "first_name", "properties"];
const EXPECTED_PROFILE_PROPERTY_KEYS = [
  "artwork_download_url",
  "artwork_expiry_date",
  "artwork_id",
  "artwork_image_url",
  "artwork_primary_url",
  "artwork_url",
  "artwork_variation_url",
  "capture_date",
  "capture_date_display",
  "capture_timestamp",
  "cosmic10_expiry",
  "delivery_cutoff_date",
  "discount_amount",
  "discount_code",
  "discount_code_active",
  "dominant_element",
  "download_url",
  "element_balance",
  "email_mockup_large",
  "email_mockup_medium",
  "email_mockup_small",
  "email_mockup_url",
  "email_story_moon_copy",
  "email_story_moon_crop_url",
  "email_story_moon_title",
  "email_story_rising_copy",
  "email_story_rising_crop_url",
  "email_story_rising_title",
  "email_story_subject_explanation",
  "email_story_sun_copy",
  "email_story_sun_crop_url",
  "email_story_sun_title",
  "expiry_date",
  "first_name_fallback",
  "greeting_name",
  "image_url",
  "moon",
  "moon_sign",
  "moon_sign_interpretation",
  "nurture_branch",
  "peak_season",
  "preview_image_url",
  "product_url",
  "rising",
  "rising_sign",
  "rising_sign_interpretation",
  "season_gifting_copy",
  "session_id",
  "sun",
  "sun_sign",
  "sun_sign_interpretation",
];
const EXPECTED_EVENT_ONLY_KEYS = ["capture_source", "event_name", "event_timestamp", "email"];

describe("klaviyoContract", () => {
  it("builds consistent identify and event payloads with full data", () => {
    const input = {
      email: " USER@example.com ",
      firstName: "Aviad",
      sunSign: "Aries",
      moonSign: "Cancer",
      risingSign: "Leo",
      artworkUrl: "https://cdn.example.com/artwork.jpg",
      artworkVariationUrl: "https://cdn.example.com/variation.jpg",
      emailMockupUrl: "https://cdn.example.com/mockup.jpg",
      emailMockupSmallUrl: "https://cdn.example.com/mockup-small.jpg",
      emailMockupMediumUrl: "https://cdn.example.com/mockup-medium.jpg",
      emailMockupLargeUrl: "https://cdn.example.com/mockup-large.jpg",
      artworkId: "art_123",
      sessionId: "session_123",
      peakSeason: "holiday",
      dominantElement: "fire",
      elementBalance: { fire: 6, water: 3 },
      captureTimestamp: "2026-03-13T12:00:00.000Z",
      artworkExpiryDate: "2026-04-12T12:00:00.000Z",
      cosmic10Expiry: "2026-03-20T12:00:00.000Z",
    };

    const identify = buildKlaviyoIdentifyAttributes(input);
    const event = buildEmailCapturedEventAttributes(input);

    expect(identify.email).toBe("user@example.com");
    expect(identify.first_name).toBe("Aviad");
    expect(identify.properties.artwork_url).toBe("https://cdn.example.com/artwork.jpg");
    expect(identify.properties.artwork_variation_url).toBe("https://cdn.example.com/variation.jpg");
    expect(identify.properties.email_mockup_url).toBe("https://cdn.example.com/mockup.jpg");
    expect(identify.properties.email_mockup_small).toBe("https://cdn.example.com/mockup-small.jpg");
    expect(identify.properties.email_mockup_medium).toBe("https://cdn.example.com/mockup-medium.jpg");
    expect(identify.properties.email_mockup_large).toBe("https://cdn.example.com/mockup-large.jpg");
    expect(identify.properties.artwork_image_url).toBe("https://cdn.example.com/artwork.jpg");
    expect(identify.properties.preview_image_url).toBe("https://cdn.example.com/mockup.jpg");
    expect(identify.properties.session_id).toBe("session_123");
    expect(identify.properties.peak_season).toBe("holiday");
    expect(identify.properties.nurture_branch).toBe(KLAVIYO_DEFAULTS.nurtureBranch);
    expect(identify.properties.discount_code).toBe(KLAVIYO_DEFAULTS.discountCode);
    expect(identify.properties.discount_amount).toBe(KLAVIYO_DEFAULTS.discountAmount);
    expect(identify.properties.greeting_name).toBe("Aviad");
    expect(identify.properties.product_url).toBe(
      "https://celestialartworks.com/generate/size?artwork_id=art_123&session_id=session_123",
    );
    expect(identify.properties.sun).toBe("Aries");
    expect(identify.properties.moon).toBe("Cancer");
    expect(identify.properties.rising).toBe("Leo");
    expect(identify.properties.sun_sign_interpretation).toContain("Aries Sun");
    expect(event.properties.capture_source).toBe(KLAVIYO_DEFAULTS.captureSource);
    expect(event.properties.event_name).toBe("Email Captured");
    expect(event.properties.event_timestamp).toBe("2026-03-13T12:00:00.000Z");
    expect(event.properties.email).toBe("user@example.com");
    expect(event.properties.artwork_url).toBe(identify.properties.artwork_url);
    expect(Object.keys(identify).sort()).toEqual(EXPECTED_TOP_LEVEL_KEYS);
    expect(Object.keys(event).sort()).toEqual(EXPECTED_TOP_LEVEL_KEYS);
    expect(Object.keys(identify.properties).sort()).toEqual(EXPECTED_PROFILE_PROPERTY_KEYS);
    expect(Object.keys(event.properties).sort()).toEqual(
      [...EXPECTED_PROFILE_PROPERTY_KEYS, ...EXPECTED_EVENT_ONLY_KEYS].sort(),
    );
  });

  it("applies safe defaults when optional fields are missing", () => {
    const captureTimestamp = "2026-03-13T12:00:00.000Z";

    const identify = buildKlaviyoIdentifyAttributes({
      email: "user@example.com",
      captureTimestamp,
    });

    expect(identify.first_name).toBe(KLAVIYO_DEFAULTS.greetingName);
    expect(identify.properties.greeting_name).toBe(KLAVIYO_DEFAULTS.greetingName);
    expect(identify.properties.first_name_fallback).toBe(KLAVIYO_DEFAULTS.greetingName);
    expect(identify.properties.peak_season).toBe(KLAVIYO_DEFAULTS.peakSeason);
    expect(identify.properties.nurture_branch).toBe(KLAVIYO_DEFAULTS.nurtureBranch);
    expect(identify.properties.artwork_url).toBe("");
    expect(identify.properties.email_mockup_url).toBe("");
    expect(identify.properties.sun_sign_interpretation).toBe("");
    expect(identify.properties.moon_sign_interpretation).toBe("");
    expect(identify.properties.rising_sign_interpretation).toBe("");
    expect(identify.properties.capture_timestamp).toBe(captureTimestamp);
    expect(identify.properties.product_url).toBe(KLAVIYO_DEFAULTS.productUrl);
  });

  it("falls back to the available artwork url when only the mockup exists", () => {
    const identify = buildKlaviyoIdentifyAttributes({
      email: "user@example.com",
      emailMockupUrl: "https://cdn.example.com/mockup.jpg",
      captureTimestamp: "2026-03-13T12:00:00.000Z",
    });

    expect(identify.properties.artwork_url).toBe("https://cdn.example.com/mockup.jpg");
    expect(identify.properties.artwork_primary_url).toBe("https://cdn.example.com/mockup.jpg");
    expect(identify.properties.email_mockup_url).toBe("https://cdn.example.com/mockup.jpg");
  });

  it("falls back to the primary artwork when no separate variation exists", () => {
    const identify = buildKlaviyoIdentifyAttributes({
      email: "user@example.com",
      artworkUrl: "https://cdn.example.com/artwork.jpg",
      captureTimestamp: "2026-03-13T12:00:00.000Z",
    });

    expect(identify.properties.artwork_url).toBe("https://cdn.example.com/artwork.jpg");
    expect(identify.properties.artwork_variation_url).toBe("https://cdn.example.com/artwork.jpg");
  });
});
