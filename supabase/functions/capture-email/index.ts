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

    // --- Klaviyo server-side integration (non-blocking) ---
    const KLAVIYO_PRIVATE_KEY = Deno.env.get("KLAVIYO_PRIVATE_KEY");

    if (KLAVIYO_PRIVATE_KEY) {
      try {
        await syncToKlaviyo({
          apiKey: KLAVIYO_PRIVATE_KEY,
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
        console.warn("[capture-email] Klaviyo sync failed (non-blocking):", klaviyoErr);
      }
    } else {
      console.log("[capture-email] KLAVIYO_PRIVATE_KEY not set, skipping server-side sync");
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
// Klaviyo server-side helpers
// ----------------------------------------------------------------

interface KlaviyoSyncParams {
  apiKey: string;
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

async function syncToKlaviyo(params: KlaviyoSyncParams) {
  const {
    apiKey,
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
  const headers = {
    Authorization: `Klaviyo-API-Key ${apiKey}`,
    "Content-Type": "application/json",
    revision,
  };

  const customProperties = {
    sun_sign: sunSign,
    moon_sign: moonSign,
    rising_sign: risingSign,
    artwork_url: artworkUrl,
    email_mockup_url: emailMockupUrl,
    artwork_id: artworkId,
    peak_season: peakSeason || "default",
    dominant_element: dominantElement,
    element_balance: elementBalance,
    artwork_expiry_date: artworkExpiryDate.toISOString(),
    cosmic10_expiry: cosmic10Expiry.toISOString(),
    nurture_branch: "preview_only",
    discount_code_active: "COSMIC10",
    capture_timestamp: captureTimestamp.toISOString(),
  };

  // 1. Create or update profile
  let profileId: string | null = null;

  const profilePayload = {
    data: {
      type: "profile",
      attributes: {
        email,
        first_name: firstName || undefined,
        properties: customProperties,
      },
    },
  };

  const createRes = await fetch("https://a.klaviyo.com/api/profiles/", {
    method: "POST",
    headers,
    body: JSON.stringify(profilePayload),
  });

  if (createRes.status === 201) {
    const createData = await createRes.json();
    profileId = createData.data?.id;
    console.log(`[capture-email] Klaviyo profile created: ${profileId}`);
  } else if (createRes.status === 409) {
    // Duplicate — extract existing profile ID and PATCH
    const conflictData = await createRes.json();
    const duplicateId =
      conflictData.errors?.[0]?.meta?.duplicate_profile_id ||
      conflictData.errors?.[0]?.meta?.original?.id;

    if (duplicateId) {
      profileId = duplicateId;
      console.log(`[capture-email] Klaviyo profile exists (${duplicateId}), patching...`);

      const patchRes = await fetch(`https://a.klaviyo.com/api/profiles/${duplicateId}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          data: {
            type: "profile",
            id: duplicateId,
            attributes: {
              first_name: firstName || undefined,
              properties: customProperties,
            },
          },
        }),
      });

      const patchBody = await patchRes.text();
      if (!patchRes.ok) {
        console.warn(`[capture-email] Klaviyo PATCH failed (${patchRes.status}): ${patchBody}`);
      }
    } else {
      const body = await createRes.text();
      console.warn(`[capture-email] Klaviyo 409 but no duplicate ID found: ${body}`);
    }
  } else {
    const body = await createRes.text();
    console.warn(`[capture-email] Klaviyo profile create failed (${createRes.status}): ${body}`);
  }

  // 2. Track "Email Captured" event
  const eventPayload = {
    data: {
      type: "event",
      attributes: {
        metric: {
          data: {
            type: "metric",
            attributes: { name: "Email Captured" },
          },
        },
        profile: {
          data: {
            type: "profile",
            attributes: { email },
          },
        },
        properties: {
          ...customProperties,
          discount_code: "COSMIC10",
          capture_source: "preview_download",
        },
        time: captureTimestamp.toISOString(),
      },
    },
  };

  const eventRes = await fetch("https://a.klaviyo.com/api/events/", {
    method: "POST",
    headers,
    body: JSON.stringify(eventPayload),
  });

  const eventBody = await eventRes.text();
  if (eventRes.ok) {
    console.log("[capture-email] Klaviyo 'Email Captured' event tracked");
  } else {
    console.warn(`[capture-email] Klaviyo event failed (${eventRes.status}): ${eventBody}`);
  }

  // 3. Add to nurture list if configured
  const listId = Deno.env.get("KLAVIYO_NURTURE_LIST_ID");
  if (listId && profileId) {
    const listRes = await fetch(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: [{ type: "profile", id: profileId }],
      }),
    });

    const listBody = await listRes.text();
    if (listRes.ok || listRes.status === 204) {
      console.log(`[capture-email] Profile added to Klaviyo list ${listId}`);
    } else {
      console.warn(`[capture-email] Klaviyo list add failed (${listRes.status}): ${listBody}`);
    }
  }
}
