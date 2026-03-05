import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Upscale an artwork to print-ready resolution using Apiframe's 4x upscaler.
 *
 * Flow:
 * 1. Read artwork record from DB (get permanent image URL)
 * 2. Submit 4x upscale to Apiframe
 * 3. Poll for completion
 * 4. Download upscaled image → upload to Supabase Storage
 * 5. Update DB record + Shopify order note
 */

const APIFRAME_API_KEY = Deno.env.get("APIFRAME_API_KEY");
const APIFRAME_UPSCALE_URL = "https://api.apiframe.pro/upscale-highres";
const APIFRAME_FETCH_URL = "https://api.apiframe.ai/fetch";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let artworkId: string | null = null;

  try {
    const body = await req.json();
    artworkId = body.artworkId;
    const shopifyOrderId = body.shopifyOrderId;

    if (!artworkId) {
      return new Response(
        JSON.stringify({ error: "Missing artworkId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!APIFRAME_API_KEY) {
      throw new Error("APIFRAME_API_KEY not configured");
    }

    console.log(`[upscale-artwork] Starting upscale for artwork ${artworkId}`);

    // 1. Get artwork record
    const { data: artwork, error: fetchError } = await supabase
      .from("artworks")
      .select("artwork_url, apiframe_task_id, upscale_status")
      .eq("id", artworkId)
      .single();

    if (fetchError || !artwork) {
      throw new Error(`Artwork ${artworkId} not found: ${fetchError?.message}`);
    }

    if (artwork.upscale_status === "completed") {
      console.log(`[upscale-artwork] Already upscaled, skipping`);
      return new Response(
        JSON.stringify({ message: "Already upscaled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!artwork.artwork_url) {
      throw new Error("No artwork_url found for upscaling");
    }

    // 2. Update status to processing
    await supabase
      .from("artworks")
      .update({ upscale_status: "processing" })
      .eq("id", artworkId);

    // 3. Submit upscale request to Apiframe
    console.log(`[upscale-artwork] Submitting 4x upscale to Apiframe...`);

    const upscaleResponse = await fetch(APIFRAME_UPSCALE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${APIFRAME_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: artwork.artwork_url,
        type: "4x",
      }),
    });

    const upscaleData = await upscaleResponse.json();

    if (upscaleData.errors || !upscaleData.task_id) {
      throw new Error(
        `Apiframe upscale failed: ${JSON.stringify(upscaleData.errors || upscaleData)}`
      );
    }

    const upscaleTaskId = upscaleData.task_id;
    console.log(`[upscale-artwork] Upscale task submitted: ${upscaleTaskId}`);

    // 4. Poll for completion (max 3 minutes, check every 3 seconds)
    const maxAttempts = 60;
    let attempts = 0;
    let result: any = null;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 3000));
      attempts++;

      const fetchResponse = await fetch(APIFRAME_FETCH_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${APIFRAME_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task_id: upscaleTaskId }),
      });

      result = await fetchResponse.json();
      console.log(
        `[upscale-artwork] Poll ${attempts}: status=${result.status}`
      );

      if (result.status === "finished") break;

      if (result.status === "failed") {
        throw new Error(
          `Upscale failed: ${result.message || "Unknown error"}`
        );
      }
    }

    if (!result || result.status !== "finished") {
      throw new Error("Upscale timed out after 3 minutes");
    }

    // 5. Get the upscaled image URL
    const upscaledCdnUrl =
      result.image_url || result.image_urls?.[0] || result.output;

    if (!upscaledCdnUrl) {
      throw new Error("No upscaled image URL in Apiframe response");
    }

    console.log(`[upscale-artwork] Upscale complete, downloading from CDN...`);

    // 6. Download upscaled image and upload to Supabase Storage
    const imageResponse = await fetch(upscaledCdnUrl);
    if (!imageResponse.ok) {
      throw new Error(
        `Failed to download upscaled image: ${imageResponse.status}`
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get("content-type") || "image/png";
    const extension = contentType.includes("webp")
      ? "webp"
      : contentType.includes("jpeg")
        ? "jpg"
        : "png";
    const filePath = `${artworkId}_upscaled.${extension}`;

    console.log(
      `[upscale-artwork] Uploading upscaled image: artworks/${filePath} (${imageBuffer.byteLength} bytes)`
    );

    const { error: uploadError } = await supabase.storage
      .from("artworks")
      .upload(filePath, imageBuffer, {
        contentType,
        upsert: true, // overwrite if re-upscaling
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get permanent public URL
    const { data: urlData } = supabase.storage
      .from("artworks")
      .getPublicUrl(filePath);
    const upscaledUrl = urlData?.publicUrl;

    // 7. Update artwork record
    await supabase
      .from("artworks")
      .update({
        upscaled_url: upscaledUrl,
        upscale_status: "completed",
      })
      .eq("id", artworkId);

    console.log(
      `[upscale-artwork] ✅ Complete! Upscaled URL: ${upscaledUrl}`
    );

    // 8. Update Shopify order note with upscaled URL (if we have the order ID and admin token)
    if (shopifyOrderId) {
      try {
        const adminToken = Deno.env.get("SHOPIFY_ADMIN_ACCESS_TOKEN");
        const storeDomain = Deno.env.get("SHOPIFY_STORE_DOMAIN");

        if (adminToken && storeDomain) {
          const orderResponse = await fetch(
            `https://${storeDomain}/admin/api/2024-10/orders/${shopifyOrderId}.json`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": adminToken,
              },
              body: JSON.stringify({
                order: {
                  id: shopifyOrderId,
                  note: `Upscaled artwork ready for printing: ${upscaledUrl}`,
                },
              }),
            }
          );

          if (orderResponse.ok) {
            console.log(
              `[upscale-artwork] Shopify order ${shopifyOrderId} updated with upscaled URL`
            );
          } else {
            console.warn(
              `[upscale-artwork] Failed to update Shopify order: ${orderResponse.status}`
            );
          }
        } else {
          console.warn(
            "[upscale-artwork] SHOPIFY_ADMIN_ACCESS_TOKEN not configured, skipping order update"
          );
        }
      } catch (shopifyErr) {
        // Non-fatal — artwork is still upscaled and stored
        console.warn(
          "[upscale-artwork] Shopify order update failed (non-blocking):",
          shopifyErr
        );
      }
    }

    return new Response(
      JSON.stringify({
        artworkId,
        upscaledUrl,
        upscale_status: "completed",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[upscale-artwork] Error:", e);

    // Update status to failed in DB
    if (artworkId) {
      const SUPABASE_URL_FALLBACK = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_KEY_FALLBACK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sbFallback = createClient(SUPABASE_URL_FALLBACK, SUPABASE_KEY_FALLBACK);
      await sbFallback
        .from("artworks")
        .update({ upscale_status: "failed" })
        .eq("id", artworkId)
        .catch(() => {});
    }

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
