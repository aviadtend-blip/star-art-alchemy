import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Shopify orders/create webhook handler.
 *
 * Flow:
 * 1. Verify HMAC signature
 * 2. Extract artwork_id from order line item properties
 * 3. Update artwork status to "purchased"
 * 4. Trigger async upscale via upscale-artwork function
 * 5. Return 200 quickly (Shopify requires response within 5s)
 */

serve(async (req) => {
  // Shopify webhooks are always POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const secret = Deno.env.get("SHOPIFY_WEBHOOK_SECRET");
    if (!secret) {
      console.error("[shopify-webhook] SHOPIFY_WEBHOOK_SECRET not configured");
      return new Response("Server misconfigured", { status: 500 });
    }

    // Read body as text for HMAC verification
    const body = await req.text();
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256");

    if (!hmacHeader) {
      console.error("[shopify-webhook] Missing HMAC header");
      return new Response("Unauthorized", { status: 401 });
    }

    // Verify HMAC-SHA256 signature
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(body)
    );
    const computed = btoa(String.fromCharCode(...new Uint8Array(signature)));

    if (computed !== hmacHeader) {
      console.error("[shopify-webhook] HMAC mismatch");
      return new Response("Unauthorized", { status: 401 });
    }

    console.log("[shopify-webhook] HMAC verified, processing order...");

    const order = JSON.parse(body);
    const shopifyOrderId = String(order.id);
    const orderNumber = order.name || `#${order.order_number}`;

    // Extract artwork_id from line item properties
    // Shopify stores cart attributes as note_attributes on the order
    let artworkId: string | null = null;

    // Check note_attributes (cart-level attributes)
    if (order.note_attributes && Array.isArray(order.note_attributes)) {
      const attr = order.note_attributes.find(
        (a: any) => a.name === "artwork_id"
      );
      if (attr) artworkId = attr.value;
    }

    // Fallback: check line item properties
    if (!artworkId && order.line_items) {
      for (const item of order.line_items) {
        if (item.properties && Array.isArray(item.properties)) {
          const prop = item.properties.find(
            (p: any) => p.name === "artwork_id"
          );
          if (prop) {
            artworkId = prop.value;
            break;
          }
        }
      }
    }

    if (!artworkId) {
      console.warn(
        "[shopify-webhook] No artwork_id found in order, skipping upscale"
      );
      // Still return 200 — this might be a non-artwork order
      return new Response("OK (no artwork_id)", { status: 200 });
    }

    console.log(
      `[shopify-webhook] Order ${orderNumber} for artwork ${artworkId}`
    );

    // Initialize Supabase client
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update artwork status to "purchased"
    const { data: artwork, error: updateError } = await supabase
      .from("artworks")
      .update({
        status: "purchased",
        shopify_order_id: shopifyOrderId,
        order_number: orderNumber,
        upscale_status: "pending",
      })
      .eq("id", artworkId)
      .select("id, artwork_url, apiframe_task_id")
      .single();

    if (updateError) {
      console.error("[shopify-webhook] DB update error:", updateError);
      // Still return 200 so Shopify doesn't retry
      return new Response("OK (db error logged)", { status: 200 });
    }

    if (!artwork) {
      console.warn(
        `[shopify-webhook] Artwork ${artworkId} not found in database`
      );
      return new Response("OK (artwork not found)", { status: 200 });
    }

    console.log(
      `[shopify-webhook] Artwork ${artworkId} marked as purchased, triggering upscale...`
    );

    // Fire-and-forget: trigger upscale (don't wait — Shopify needs a fast response)
    const upscaleUrl = `${SUPABASE_URL}/functions/v1/upscale-artwork`;
    fetch(upscaleUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        artworkId,
        shopifyOrderId,
      }),
    }).catch((err) =>
      console.error("[shopify-webhook] Failed to trigger upscale:", err)
    );

    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("[shopify-webhook] Unexpected error:", e);
    // Always return 200 to prevent Shopify from retrying
    return new Response("OK (error logged)", { status: 200 });
  }
});
