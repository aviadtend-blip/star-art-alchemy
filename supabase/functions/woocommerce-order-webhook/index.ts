import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ------------------------------------------------------------------ */
/*  HMAC Verification                                                  */
/* ------------------------------------------------------------------ */

async function verifyWooCommerceHmac(secret: string, rawBody: string, signatureHeader: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === signatureHeader;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** WooCommerce variation ID → canonical canvas size */
const VARIATION_TO_SIZE: Record<number, string> = {
  12: "12x18",
  13: "16x24",
  14: "20x30",
};

/** Legacy size aliases → canonical sizes */
const SIZE_ALIASES: Record<string, string> = {
  "12x16": "12x18",
  "18x24": "16x24",
  "24x32": "20x30",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getMeta(metaData: any[], key: string): string {
  const item = metaData?.find((m: any) => m.key === key);
  return item?.value || "";
}

/** Try to get metadata from order-level meta first, then from line item meta */
function getMetaWithLineItems(order: any, key: string): string {
  // 1. Order-level meta
  const orderMeta = getMeta(order.meta_data || [], key);
  if (orderMeta) return orderMeta;

  // 2. Line item meta (set by MU plugin)
  for (const item of (order.line_items || [])) {
    const itemMeta = getMeta(item.meta_data || [], key);
    if (itemMeta) return itemMeta;
  }

  return "";
}

function storagePathFromUrl(publicUrl: string): string {
  const marker = "/object/public/artworks/";
  const idx = publicUrl.indexOf(marker);
  if (idx !== -1) return publicUrl.substring(idx + marker.length);
  return publicUrl.split("/").pop() || "";
}

function extractHotspots(artworkAnalysis: any): any[] | null {
  if (!artworkAnalysis) return null;
  const elements = artworkAnalysis.elements || artworkAnalysis.hotspots || [];
  if (!Array.isArray(elements) || elements.length === 0) return null;
  const emojiMap: Record<string, string> = { sun: "☀️", moon: "🌙", rising: "⬆️", element: "🔥" };
  return elements.slice(0, 4).map((el: any) => ({
    title: el.title || el.label || "",
    explanation: el.explanation || el.description || el.copy || "",
    emoji: el.emoji || emojiMap[el.key?.toLowerCase?.()] || "✨",
  }));
}

async function sendKlaviyoEvent(apiKey: string, metricName: string, email: string, properties: Record<string, any>): Promise<void> {
  try {
    const res = await fetch("https://a.klaviyo.com/api/events/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        revision: "2024-10-15",
      },
      body: JSON.stringify({
        data: {
          type: "event",
          attributes: {
            metric: { data: { type: "metric", attributes: { name: metricName } } },
            profile: { data: { type: "profile", attributes: { email } } },
            properties,
          },
        },
      }),
    });
    const text = await res.text();
    console.log(`wc-webhook: Klaviyo ${metricName} ${res.status} ${text.substring(0, 120)}`);
  } catch (e: any) {
    console.error(`wc-webhook: Klaviyo ${metricName} error (non-fatal):`, e.message);
  }
}

async function subscribeToKlaviyo(email: string): Promise<void> {
  const klaviyoKey = Deno.env.get("KLAVIYO_API_KEY");
  if (!klaviyoKey) {
    console.warn("wc-webhook: KLAVIYO_API_KEY not set, skipping subscription");
    return;
  }
  try {
    const res = await fetch("https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        revision: "2024-10-15",
        Authorization: `Klaviyo-API-Key ${klaviyoKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            custom_source: "Purchase",
            profiles: {
              data: [{
                type: "profile",
                attributes: {
                  email,
                  subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } },
                },
              }],
            },
          },
          relationships: { list: { data: { type: "list", id: "UGDZis" } } },
        },
      }),
    });
    const body = await res.text();
    console.log(`wc-webhook: Klaviyo subscribe ${res.status} ${body.substring(0, 200)}`);
  } catch (e: any) {
    console.error("wc-webhook: Klaviyo subscribe error (non-fatal):", e.message);
  }
}

/* ------------------------------------------------------------------ */
/*  Resolve canonical canvas size from WC order                        */
/* ------------------------------------------------------------------ */

function resolveCanvasSize(order: any): string {
  const lineItem = order.line_items?.[0];
  if (!lineItem) return "16x24";

  // Tier 1: explicit canvas_size from order/line-item meta (set by MU plugin)
  const metaSize = getMetaWithLineItems(order, "canvas_size");
  if (metaSize) {
    const normalized = metaSize.toLowerCase().replace(/[^0-9x]/g, "");
    const canonical = SIZE_ALIASES[normalized] || normalized;
    if (["12x18", "16x24", "20x30"].includes(canonical)) {
      console.log(`wc-webhook: size from meta "canvas_size"="${metaSize}" → ${canonical}`);
      return canonical;
    }
  }

  // Tier 2: variation_id → canonical size
  const variationId = lineItem.variation_id;
  if (variationId && VARIATION_TO_SIZE[variationId]) {
    console.log(`wc-webhook: size from variation_id ${variationId} → ${VARIATION_TO_SIZE[variationId]}`);
    return VARIATION_TO_SIZE[variationId];
  }

  // Tier 3: SKU parsing
  const sku = (lineItem.sku || "").toLowerCase();
  const sizeMatch = sku.match(/(12x18|16x24|20x30)/i);
  if (sizeMatch) {
    console.log(`wc-webhook: size from SKU "${sku}" → ${sizeMatch[1]}`);
    return sizeMatch[1].toLowerCase();
  }

  console.warn(`wc-webhook: could not resolve size, defaulting to 16x24. variation_id=${variationId}, sku=${sku}`);
  return "16x24";
}

/* ------------------------------------------------------------------ */
/*  Resolve Celestial order ID from WC order                           */
/* ------------------------------------------------------------------ */

/**
 * Resolution order:
 *   1. Explicit metadata on the WC order (set by MU plugin from query params)
 *   2. Fallback: match by billing email + recent pending Supabase order
 */
async function resolveCelestialOrderId(order: any): Promise<{ id: string; source: string } | null> {
  // --- Tier 1: Explicit metadata ---
  const explicitId = getMetaWithLineItems(order, "celestial_order_id")
    || getMetaWithLineItems(order, "_celestial_order_id");

  if (explicitId) {
    console.log(`wc-webhook: RESOLVED celestialOrderId=${explicitId} source=explicit_metadata`);
    return { id: explicitId, source: "explicit_metadata" };
  }

  // --- Tier 2: Fallback by email ---
  const billingEmail = order.billing?.email || "";
  const canvasSize = getMetaWithLineItems(order, "canvas_size") || "";
  const customerNameMeta = getMetaWithLineItems(order, "customer_name") || "";

  console.log(`wc-webhook: no explicit celestial_order_id, trying email fallback | email="${billingEmail}" size="${canvasSize}"`);

  if (!billingEmail || billingEmail === "guest@celestialartworks.com") {
    console.warn(`wc-webhook: no usable billing email for fallback on WC order ${order.id}`);
    return null;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const sb = createClient(supabaseUrl, serviceKey);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: candidates } = await sb
    .from("orders")
    .select("id, canvas_size, chart_data, created_at")
    .eq("customer_email", billingEmail)
    .is("shopify_order_id", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!candidates || candidates.length === 0) {
    console.warn(`wc-webhook: no fallback match for email="${billingEmail}"`);
    return null;
  }

  let match = candidates[0];
  if (canvasSize) {
    const sizeMatch = candidates.find((c: any) => c.canvas_size === canvasSize);
    if (sizeMatch) match = sizeMatch;
  }
  if (customerNameMeta && candidates.length > 1) {
    const nameMatch = candidates.find((c: any) =>
      c.chart_data?.customer_name?.toLowerCase() === customerNameMeta.toLowerCase()
    );
    if (nameMatch) match = nameMatch;
  }

  console.log(`wc-webhook: RESOLVED celestialOrderId=${match.id} source=email_fallback (created ${match.created_at})`);
  return { id: match.id, source: "email_fallback" };
}

/* ------------------------------------------------------------------ */
/*  Digital fulfillment                                                */
/* ------------------------------------------------------------------ */

async function handleDigitalFulfillment(
  order: any,
  celestialOrderId: string,
  meta: { resolution: string; styleId: string; sunSign: string; moonSign: string; risingSign: string; artworkUrl: string },
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const klaviyoKey = Deno.env.get("KLAVIYO_API_KEY") ?? "";
  const apiframeKey = Deno.env.get("APIFRAME_API_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceKey);

  const customerEmail = order.billing?.email || "";
  const customerName = `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim();
  const wcOrderNumber = String(order.number ?? "");
  const resolution = meta.resolution === "high_resolution" ? "High Resolution" : "Standard";

  if (klaviyoKey) {
    await sendKlaviyoEvent(klaviyoKey, "Digital Purchase Confirmed", customerEmail, {
      order_number: wcOrderNumber, resolution,
      style_id: meta.styleId, sun_sign: meta.sunSign, moon_sign: meta.moonSign,
      rising_sign: meta.risingSign, artwork_url: meta.artworkUrl, product_type: "digital",
    });
  }

  let permanentUrl = "";
  let apiframeTaskId = "";
  let artworkId = "";
  let artworkAnalysis: any = null;

  const { data: orderRow } = await supabase
    .from("orders").select("id, generated_image_url, artwork_analysis")
    .eq("id", celestialOrderId).maybeSingle();
  if (orderRow) {
    permanentUrl = orderRow.generated_image_url || "";
    artworkAnalysis = orderRow.artwork_analysis;
  }

  const { data: artworkRow } = await supabase
    .from("artworks").select("id, artwork_url, apiframe_task_id, artwork_analysis")
    .eq("session_id", celestialOrderId).maybeSingle();
  if (artworkRow) {
    artworkId = artworkRow.id;
    apiframeTaskId = artworkRow.apiframe_task_id || "";
    if (!artworkAnalysis) artworkAnalysis = artworkRow.artwork_analysis;
    if (!permanentUrl) permanentUrl = artworkRow.artwork_url || "";
  }
  if (!permanentUrl) permanentUrl = meta.artworkUrl;

  let signedUrl = "";
  let fallbackResolution = false;

  if (meta.resolution === "high_resolution" && apiframeTaskId && apiframeKey) {
    try {
      console.log(`wc-webhook: digital upscale starting, task=${apiframeTaskId}`);
      const upscaleRes = await fetch("https://api.apiframe.pro/upscale-highres", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiframeKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ parent_task_id: apiframeTaskId, type: "4x" }),
      });
      const upscaleData = await upscaleRes.json();
      if (!upscaleData.task_id) throw new Error(`Upscale submit failed: ${JSON.stringify(upscaleData)}`);
      const upscaleTaskId = upscaleData.task_id;

      let upscaledImageUrl = "";
      for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const pollRes = await fetch("https://api.apiframe.pro/fetch", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiframeKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ task_id: upscaleTaskId }),
        });
        const pollData = await pollRes.json();
        if (pollData.status === "finished") {
          upscaledImageUrl = pollData.image_url || pollData.image_urls?.[0] || pollData.output || "";
          break;
        }
        if (pollData.status === "failed") throw new Error("Upscale failed");
      }
      if (!upscaledImageUrl) throw new Error("Upscale timed out");

      const imgRes = await fetch(upscaledImageUrl);
      if (!imgRes.ok) throw new Error(`Download failed: ${imgRes.status}`);
      const imgBuf = await imgRes.arrayBuffer();
      const filePath = `${artworkId || celestialOrderId}_4x.png`;
      await supabase.storage.from("artworks").upload(filePath, imgBuf, { contentType: "image/png", upsert: true });

      const { data: signedData, error: signErr } = await supabase.storage.from("artworks").createSignedUrl(filePath, 2592000);
      if (signErr) throw new Error(`Signed URL error: ${signErr.message}`);
      signedUrl = signedData.signedUrl;
    } catch (e: any) {
      console.error("wc-webhook: upscale failed, falling back to standard:", e.message);
      fallbackResolution = true;
    }
  }

  if (!signedUrl && permanentUrl) {
    const filePath = storagePathFromUrl(permanentUrl);
    if (filePath) {
      const { data: signedData, error: signErr } = await supabase.storage.from("artworks").createSignedUrl(filePath, 2592000);
      if (!signErr) signedUrl = signedData.signedUrl;
    }
  }

  if (klaviyoKey && signedUrl) {
    const deliveryProps: Record<string, any> = {
      download_url: signedUrl,
      resolution: fallbackResolution ? "Standard" : resolution,
      artwork_url: permanentUrl || meta.artworkUrl,
      order_number: wcOrderNumber, expiry_days: 30,
      sun_sign: meta.sunSign, moon_sign: meta.moonSign, rising_sign: meta.risingSign,
      customer_name: customerName,
    };
    const hotspots = extractHotspots(artworkAnalysis);
    if (hotspots) deliveryProps.hotspots = hotspots;
    if (fallbackResolution) deliveryProps.fallback_resolution = true;
    await sendKlaviyoEvent(klaviyoKey, "Digital File Ready", customerEmail, deliveryProps);
  }

  const updatePayload: Record<string, any> = {
    fulfilled_at: new Date().toISOString(),
    fulfillment_status: "submitted",
    fulfillment_type: "digital",
  };
  if (signedUrl) updatePayload.digital_download_url = signedUrl;

  const { error: updateErr } = await supabase.from("orders").update(updatePayload).eq("id", celestialOrderId);
  if (updateErr) console.error("wc-webhook: orders update error:", updateErr.message);
  else console.log(`wc-webhook: ✅ digital order ${celestialOrderId} fulfilled`);
}

/* ------------------------------------------------------------------ */
/*  Canvas fulfillment — delegates to fulfill-order                    */
/* ------------------------------------------------------------------ */

async function handleCanvasFulfillment(
  order: any,
  celestialOrderId: string,
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceKey);

  const customerName = `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim() || order.billing?.email || "Customer";
  const customerEmail = order.billing?.email || "";
  const wcOrderId = String(order.id ?? "");
  const wcOrderNumber = String(order.number ?? "");
  const shipping = order.shipping || {};

  const canvasSize = resolveCanvasSize(order);
  console.log(`wc-webhook: canvas fulfillment | celestialId=${celestialOrderId} | wcOrder=${wcOrderNumber} | size=${canvasSize}`);

  // Pre-set status before calling fulfill-order
  await supabase.from("orders").update({
    canvas_size: canvasSize,
    fulfillment_status: "submitting",
  }).eq("id", celestialOrderId);

  // Delegate to fulfill-order (handles insert card, Prodigi, status updates)
  const fulfillPayload = {
    celestialOrderId,
    shopifyOrderId: wcOrderId,
    shopifyOrderNumber: wcOrderNumber,
    customerName,
    customerEmail,
    shippingAddress: {
      address1: shipping.address_1 || "",
      address2: shipping.address_2 || "",
      city: shipping.city || "",
      province: shipping.state || "",
      zip: shipping.postcode || "",
      country_code: shipping.country || "",
    },
    lineItems: [{
      sku: "",
      variant_title: canvasSize,
      properties: [
        { name: "canvas_size", value: canvasSize },
      ],
    }],
  };

  console.log(`wc-webhook: CALLING fulfill-order for ${celestialOrderId} | size=${canvasSize} | shipping=${shipping.city || "?"}, ${shipping.country || "?"}`);

  try {
    const fulfillRes = await fetch(`${supabaseUrl}/functions/v1/fulfill-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(fulfillPayload),
    });

    const fulfillText = await fulfillRes.text();
    console.log(`wc-webhook: fulfill-order response ${fulfillRes.status}: ${fulfillText.substring(0, 300)}`);

    if (!fulfillRes.ok) {
      throw new Error(`fulfill-order returned ${fulfillRes.status}: ${fulfillText.substring(0, 200)}`);
    }

    const fulfillData = JSON.parse(fulfillText);
    console.log(`wc-webhook: ✅ canvas order ${celestialOrderId} → Prodigi ${fulfillData.prodigiOrderId || "unknown"} | SKU=${fulfillData.sku || "?"}`);
  } catch (e: any) {
    console.error(`wc-webhook: ❌ canvas fulfillment failed for ${celestialOrderId}:`, e.message);
    await supabase.from("orders").update({
      fulfillment_status: "failed",
      fulfillment_error: e.message?.substring(0, 500),
    }).eq("id", celestialOrderId);
  }
}

/* ------------------------------------------------------------------ */
/*  Async processing                                                   */
/* ------------------------------------------------------------------ */

async function processOrder(order: any) {
  try {
    const status = order.status;
    const wcOrderId = String(order.id ?? "");
    const wcOrderNumber = String(order.number ?? "");

    console.log(`wc-webhook: RECEIVED | wcOrderId=${wcOrderId} | number=${wcOrderNumber} | status=${status}`);

    // Only process paid/fulfillable statuses
    if (status !== "processing" && status !== "completed") {
      console.log(`wc-webhook: SKIP | status="${status}" is not processing/completed`);
      return;
    }

    // --- Resolve Celestial order ID ---
    const resolved = await resolveCelestialOrderId(order);
    if (!resolved) {
      console.warn(`wc-webhook: SKIP | could not resolve celestialOrderId for WC order ${wcOrderId}`);
      return;
    }
    const { id: celestialOrderId, source: resolutionSource } = resolved;

    // --- Resolve funnel type and metadata ---
    const funnelType = getMetaWithLineItems(order, "funnel_type") || getMetaWithLineItems(order, "_funnel_type");
    const artworkUrl = getMetaWithLineItems(order, "artwork_url") || getMetaWithLineItems(order, "_artwork_url");
    const styleId = getMetaWithLineItems(order, "style_id") || getMetaWithLineItems(order, "_style_id");
    const sunSign = getMetaWithLineItems(order, "sun_sign") || getMetaWithLineItems(order, "_sun_sign");
    const moonSign = getMetaWithLineItems(order, "moon_sign") || getMetaWithLineItems(order, "_moon_sign");
    const risingSign = getMetaWithLineItems(order, "rising_sign") || getMetaWithLineItems(order, "_rising_sign");
    const resolution = getMetaWithLineItems(order, "resolution") || getMetaWithLineItems(order, "_resolution");

    console.log(`wc-webhook: METADATA | source=${resolutionSource} | funnel=${funnelType || "canvas"} | artworkUrl=${artworkUrl ? "yes" : "no"} | celestialOrderId=${celestialOrderId}`);

    // --- Duplicate-fulfillment guard ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: existingOrder } = await supabase
      .from("orders")
      .select("fulfillment_status, shopify_order_id")
      .eq("id", celestialOrderId)
      .maybeSingle();

    if (existingOrder?.fulfillment_status === "submitted" || existingOrder?.fulfillment_status === "fulfilled") {
      console.log(`wc-webhook: SKIP DUPLICATE | ${celestialOrderId} already ${existingOrder.fulfillment_status}`);
      return;
    }
    if (existingOrder?.shopify_order_id && existingOrder.shopify_order_id !== wcOrderId) {
      console.log(`wc-webhook: SKIP DUPLICATE | ${celestialOrderId} already linked to WC order ${existingOrder.shopify_order_id}`);
      return;
    }

    // --- Link WC order to Celestial order ---
    const customerEmail = order.billing?.email || "";
    const { error: linkErr } = await supabase.from("orders").update({
      shopify_order_id: wcOrderId,
      shopify_order_number: wcOrderNumber,
      customer_email: customerEmail || undefined,
    }).eq("id", celestialOrderId);
    if (linkErr) console.error("wc-webhook: order link error:", linkErr.message);

    console.log(`wc-webhook: PROCESSING | wcOrder=${wcOrderNumber} | funnel=${funnelType || "canvas"} | celestialId=${celestialOrderId} | resolutionSource=${resolutionSource}`);

    await subscribeToKlaviyo(customerEmail);

    if (funnelType === "digital") {
      console.log(`wc-webhook: CALLING handleDigitalFulfillment for ${celestialOrderId}`);
      await handleDigitalFulfillment(order, celestialOrderId, {
        resolution, styleId, sunSign, moonSign, risingSign, artworkUrl,
      });

      // Fire Klaviyo client events
      const customerName = `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim();
      const klaviyoUrl = "https://a.klaviyo.com/client/events/?company_id=XEPXRf";
      const klaviyoHeaders = { "Content-Type": "application/json", Accept: "application/json", revision: "2024-10-15" };

      try {
        const res1 = await fetch(klaviyoUrl, {
          method: "POST", headers: klaviyoHeaders,
          body: JSON.stringify({
            data: { type: "event", attributes: {
              profile: { data: { type: "profile", attributes: { email: customerEmail } } },
              metric: { data: { type: "metric", attributes: { name: "Digital Purchase Confirmed" } } },
              properties: { customer_name: customerName, order_number: wcOrderNumber, artwork_url: artworkUrl, resolution, sun_sign: sunSign, moon_sign: moonSign, rising_sign: risingSign },
              time: new Date().toISOString(),
              unique_id: `digital-purchase-confirmed-${order.id}-${Date.now()}`,
            }},
          }),
        });
        await res1.text();
      } catch (e: any) { console.error("wc-webhook: Klaviyo DPC error:", e.message); }

      try {
        const res2 = await fetch(klaviyoUrl, {
          method: "POST", headers: klaviyoHeaders,
          body: JSON.stringify({
            data: { type: "event", attributes: {
              profile: { data: { type: "profile", attributes: { email: customerEmail } } },
              metric: { data: { type: "metric", attributes: { name: "Digital File Ready" } } },
              properties: { customer_name: customerName, order_number: wcOrderNumber, artwork_url: artworkUrl, download_url: artworkUrl, resolution: resolution === "high_resolution" ? "High Resolution" : "Standard", sun_sign: sunSign, moon_sign: moonSign, rising_sign: risingSign, expiry_days: 30 },
              time: new Date().toISOString(),
              unique_id: `digital-file-ready-${order.id}-${Date.now()}`,
            }},
          }),
        });
        await res2.text();
      } catch (e: any) { console.error("wc-webhook: Klaviyo DFR error:", e.message); }
    } else {
      console.log(`wc-webhook: CALLING handleCanvasFulfillment for ${celestialOrderId}`);
      await handleCanvasFulfillment(order, celestialOrderId);
    }
  } catch (e: any) {
    console.error("wc-webhook: processing error (non-fatal):", e.message, e.stack);
  }
}

/* ------------------------------------------------------------------ */
/*  Main handler                                                       */
/* ------------------------------------------------------------------ */

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawBody = await req.text();
  const webhookSecret = Deno.env.get("WC_WEBHOOK_SECRET") || Deno.env.get("WOOCOMMERCE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("wc-webhook: Neither WC_WEBHOOK_SECRET nor WOOCOMMERCE_WEBHOOK_SECRET is set");
    return new Response("Server misconfiguration", { status: 500 });
  }

  const signatureHeader = req.headers.get("X-WC-Webhook-Signature") ?? req.headers.get("x-wc-webhook-signature") ?? "";
  const webhookTopic = req.headers.get("X-WC-Webhook-Topic") ?? req.headers.get("x-wc-webhook-topic") ?? "unknown";

  if (!await verifyWooCommerceHmac(webhookSecret, rawBody, signatureHeader)) {
    let parsedOrderId = "unparseable";
    try { parsedOrderId = JSON.parse(rawBody)?.id ?? "missing"; } catch { /* ignore */ }
    console.warn(`wc-webhook: HMAC MISMATCH | topic=${webhookTopic} | orderId=${parsedOrderId} | sigPresent=${!!signatureHeader} | secretLen=${webhookSecret.length}`);
    return new Response("Unauthorized", { status: 401 });
  }

  let order: any;
  try {
    order = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  console.log(`wc-webhook: AUTHENTICATED | topic=${webhookTopic} | orderId=${order.id} | status=${order.status}`);

  EdgeRuntime.waitUntil(processOrder(order));
  return new Response("ok", { status: 200 });
});
