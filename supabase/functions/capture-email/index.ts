import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      email,
      firstName,
      sunSign,
      moonSign,
      risingSign,
      artworkUrl,
      emailMockupUrl,
      artworkId,
      sessionId,
      peakSeason,
      dominantElement,
      elementBalance,
    } = await req.json();

    if (!email) {
      throw new Error("Missing email");
    }

    console.log(`[capture-email] Processing capture for ${email}`);

    const now = new Date();
    const artworkExpiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const cosmic10Expiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Upsert into email_captures
    const { data: capture, error: upsertError } = await supabase
      .from("email_captures")
      .upsert(
        {
          email: email.trim().toLowerCase(),
          first_name: firstName || null,
          sun_sign: sunSign || null,
          moon_sign: moonSign || null,
          rising_sign: risingSign || null,
          artwork_url: artworkUrl || null,
          email_mockup_url: emailMockupUrl || null,
          artwork_id: artworkId || null,
          session_id: sessionId || null,
          peak_season: peakSeason || "default",
          dominant_element: dominantElement || null,
          element_balance: elementBalance || null,
          capture_timestamp: now.toISOString(),
          artwork_expiry_date: artworkExpiryDate.toISOString(),
          cosmic10_expiry: cosmic10Expiry.toISOString(),
          nurture_branch: "preview_only",
          status: "active",
          converted: false,
        },
        { onConflict: "email" }
      )
      .select("id")
      .single();

    if (upsertError) {
      console.error("[capture-email] Upsert error:", upsertError);
      throw new Error(`DB upsert failed: ${upsertError.message}`);
    }

    const captureId = capture?.id;
    console.log(`[capture-email] Upserted capture: ${captureId}`);

    // --- Klaviyo Client API integration (no private key needed) ---
    const KLAVIYO_COMPANY_ID = "XEPXRf";

    try {
      await syncToKlaviyoClientAPI({
        companyId: KLAVIYO_COMPANY_ID,
        email: email.trim().toLowerCase(),
        firstName,
        sunSign,
        moonSign,
        risingSign,
        artworkUrl,
        emailMockupUrl,
        artworkId,
        peakSeason,
        dominantElement,
        elementBalance,
        artworkExpiryDate,
        cosmic10Expiry,
        captureTimestamp: now,
      });
    } catch (klaviyoErr) {
      console.warn("[capture-email] Klaviyo Client API sync failed (non-blocking):", klaviyoErr);
    }

    return new Response(
      JSON.stringify({ success: true, captureId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[capture-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// ----------------------------------------------------------------
// Klaviyo Client API helpers (public key only)
// ----------------------------------------------------------------

interface KlaviyoClientSyncParams {
  companyId: string;
  email: string;
  firstName?: string;
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
  artworkUrl?: string;
  emailMockupUrl?: string;
  artworkId?: string;
  peakSeason?: string;
  dominantElement?: string;
  elementBalance?: any;
  artworkExpiryDate: Date;
  cosmic10Expiry: Date;
  captureTimestamp: Date;
}

async function syncToKlaviyoClientAPI(params: KlaviyoClientSyncParams) {
  const {
    companyId,
    email,
    firstName,
    sunSign,
    moonSign,
    risingSign,
    artworkUrl,
    emailMockupUrl,
    artworkId,
    peakSeason,
    dominantElement,
    elementBalance,
    artworkExpiryDate,
    cosmic10Expiry,
    captureTimestamp,
  } = params;

  const revision = "2024-10-15";
  const clientHeaders = {
    "Content-Type": "application/json",
    revision,
  };

  const profileProperties = {
    sun_sign: sunSign,
    moon_sign: moonSign,
    rising_sign: risingSign,
    artwork_url: artworkUrl,
    artwork_variation_url: artworkUrl,
    artwork_download_url: artworkUrl,
    email_mockup_url: emailMockupUrl,
    email_mockup_small: emailMockupUrl,
    email_mockup_medium: emailMockupUrl,
    email_mockup_large: emailMockupUrl,
    artwork_id: artworkId,
    peak_season: peakSeason || "default",
    dominant_element: dominantElement,
    element_balance: elementBalance,
    artwork_expiry_date: artworkExpiryDate.toISOString(),
    expiry_date: artworkExpiryDate.toISOString(),
    cosmic10_expiry: cosmic10Expiry.toISOString(),
    nurture_branch: "preview_only",
    discount_code_active: "COSMIC10",
    capture_timestamp: captureTimestamp.toISOString(),
    capture_date: captureTimestamp.toISOString(),
    product_url: "https://celestialartworks.com/shop",
    sun_sign_interpretation: sunSign ? getSignInterpretation("Sun", sunSign) : "",
    moon_sign_interpretation: moonSign ? getSignInterpretation("Moon", moonSign) : "",
    rising_sign_interpretation: risingSign ? getSignInterpretation("Rising", risingSign) : "",
    delivery_cutoff_date: "",
    season_gifting_copy: "",
  };

  // 1. Identify profile via Client API
  const identifyPayload = {
    data: {
      type: "profile",
      attributes: {
        email,
        first_name: firstName || undefined,
        properties: profileProperties,
      },
    },
  };

  const identifyRes = await fetch(
    `https://a.klaviyo.com/client/profiles/?company_id=${companyId}`,
    {
      method: "POST",
      headers: clientHeaders,
      body: JSON.stringify(identifyPayload),
    }
  );

  if (identifyRes.ok || identifyRes.status === 202) {
    console.log("[capture-email] Klaviyo Client API: profile identified");
  } else {
    const body = await identifyRes.text();
    console.warn(`[capture-email] Klaviyo identify failed (${identifyRes.status}): ${body}`);
  }

  // 2. Track "Email Captured" event via Client API
  const eventPayload = {
    data: {
      type: "event",
      attributes: {
        profile: {
          data: {
            type: "profile",
            attributes: {
              email,
              first_name: firstName || undefined,
              properties: profileProperties,
            },
          },
        },
        metric: {
          data: {
            type: "metric",
            attributes: { name: "Email Captured" },
          },
        },
        properties: {
          ...profileProperties,
          email,
          discount_code: "COSMIC10",
          discount_amount: 10,
          capture_source: "preview_download",
        },
        time: captureTimestamp.toISOString(),
        unique_id: `email-capture-${captureTimestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
      },
    },
  };

  const eventRes = await fetch(
    `https://a.klaviyo.com/client/events/?company_id=${companyId}`,
    {
      method: "POST",
      headers: clientHeaders,
      body: JSON.stringify(eventPayload),
    }
  );

  if (eventRes.ok || eventRes.status === 202) {
    console.log("[capture-email] Klaviyo Client API: 'Email Captured' event tracked");
  } else {
    const body = await eventRes.text();
    console.warn(`[capture-email] Klaviyo event failed (${eventRes.status}): ${body}`);
  }
}
