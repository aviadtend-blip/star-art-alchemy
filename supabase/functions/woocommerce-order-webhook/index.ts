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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getMeta(metaData: any[], key: string): string {
  const item = metaData?.find((m: any) => m.key === key);
  return item?.value || "";
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
/*  Resolve canonical canvas size from WC line items                   */
/* ------------------------------------------------------------------ */

function resolveCanvasSize(order: any): string {
  const lineItem = order.line_items?.[0];
  if (!lineItem) return "16x24"; // default

  // Tier 1: variation_id → canonical size
  const variationId = lineItem.variation_id;
  if (variationId && VARIATION_TO_SIZE[variationId]) {
    console.log(`wc-webhook: size from variation_id ${variationId} → ${VARIATION_TO_SIZE[variationId]}`);
    return VARIATION_TO_SIZE[variationId];
  }

  // Tier 2: order meta canvas_size
  const metaData = order.meta_data || [];
  const metaSize = getMeta(metaData, "canvas_size") || getMeta(metaData, "_canvas_size");
  if (metaSize) {
    const normalized = metaSize.toLowerCase().replace(/[^0-9x]/g, "");
    const SIZE_ALIASES: Record<string, string> = { "12x16": "12x18", "18x24": "16x24", "24x32": "20x30" };
    const canonical = SIZE_ALIASES[normalized] || normalized;
    if (["12x18", "16x24", "20x30"].includes(canonical)) {
      console.log(`wc-webhook: size from meta "${metaSize}" → ${canonical}`);
      return canonical;
    }
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

  // Step 1 — Immediate confirmation via Klaviyo
  if (klaviyoKey) {
    await sendKlaviyoEvent(klaviyoKey, "Digital Purchase Confirmed", customerEmail, {
      order_number: wcOrderNumber,
      resolution,
      style_id: meta.styleId,
      sun_sign: meta.sunSign,
      moon_sign: meta.moonSign,
      rising_sign: meta.risingSign,
      artwork_url: meta.artworkUrl,
      product_type: "digital",
    });
  } else {
    console.warn("wc-webhook: KLAVIYO_API_KEY not set, skipping confirmation event");
  }

  // Step 2 — Resolve artwork and prepare download
  let permanentUrl = "";
  let apiframeTaskId = "";
  let artworkId = "";
  let artworkAnalysis: any = null;

  const { data: orderRow } = await supabase
    .from("orders")
    .select("id, generated_image_url, artwork_analysis")
    .eq("id", celestialOrderId)
    .maybeSingle();

  if (orderRow) {
    permanentUrl = orderRow.generated_image_url || "";
    artworkAnalysis = orderRow.artwork_analysis;
  }

  const { data: artworkRow } = await supabase
    .from("artworks")
    .select("id, artwork_url, apiframe_task_id, artwork_analysis")
    .eq("session_id", celestialOrderId)
    .maybeSingle();

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
      console.log(`wc-webhook: upscale task=${upscaleTaskId}`);

      let upscaledImageUrl = "";
      for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const pollRes = await fetch("https://api.apiframe.pro/fetch", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiframeKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ task_id: upscaleTaskId }),
        });
        const pollData = await pollRes.json();
        console.log(`wc-webhook: upscale poll ${i + 1}: ${pollData.status}`);
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
      console.log(`wc-webhook: upscale complete, signed URL ready`);
    } catch (e: any) {
      console.error("wc-webhook: upscale failed, falling back to standard:", e.message);
      fallbackResolution = true;
    }
  }

  // Standard resolution or fallback
  if (!signedUrl && permanentUrl) {
    const filePath = storagePathFromUrl(permanentUrl);
    if (filePath) {
      const { data: signedData, error: signErr } = await supabase.storage.from("artworks").createSignedUrl(filePath, 2592000);
      if (signErr) {
        console.error("wc-webhook: signed URL error for standard:", signErr.message);
      } else {
        signedUrl = signedData.signedUrl;
      }
    }
  }

  // Step 3 — Delivery email via Klaviyo
  if (klaviyoKey && signedUrl) {
    const deliveryProps: Record<string, any> = {
      download_url: signedUrl,
      resolution: fallbackResolution ? "Standard" : resolution,
      artwork_url: permanentUrl || meta.artworkUrl,
      order_number: wcOrderNumber,
      expiry_days: 30,
      sun_sign: meta.sunSign,
      moon_sign: meta.moonSign,
      rising_sign: meta.risingSign,
      customer_name: customerName,
    };
    const hotspots = extractHotspots(artworkAnalysis);
    if (hotspots) deliveryProps.hotspots = hotspots;
    if (fallbackResolution) deliveryProps.fallback_resolution = true;
    await sendKlaviyoEvent(klaviyoKey, "Digital File Ready", customerEmail, deliveryProps);
  }

  // Step 4 — Update database
  const updatePayload: Record<string, any> = {
    fulfilled_at: new Date().toISOString(),
    fulfillment_status: "submitted",
    fulfillment_type: "digital",
  };
  if (signedUrl) updatePayload.digital_download_url = signedUrl;

  const { error: updateErr } = await supabase.from("orders").update(updatePayload).eq("id", celestialOrderId);
  if (updateErr) {
    console.error("wc-webhook: orders update error:", updateErr.message);
  } else {
    console.log(`wc-webhook: ✅ digital order ${celestialOrderId} fulfilled`);
  }
}

/* ------------------------------------------------------------------ */
/*  Canvas fulfillment — delegates to fulfill-order                    */
/* ------------------------------------------------------------------ */

async function handleCanvasFulfillment(
  order: any,
  celestialOrderId: string,
  meta: { sunSign: string; moonSign: string; risingSign: string; artworkUrl: string },
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceKey);

  const customerName = `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim() || order.billing?.email || "Customer";
  const customerEmail = order.billing?.email || "";
  const wcOrderId = String(order.id ?? "");
  const wcOrderNumber = String(order.number ?? "");
  const shipping = order.shipping || {};

  // Resolve canonical canvas size from WC line item
  const canvasSize = resolveCanvasSize(order);
  console.log(`wc-webhook: canvas fulfillment | celestialId=${celestialOrderId} | wcOrder=${wcOrderNumber} | size=${canvasSize}`);

  // Update the canvas_size on the order row before calling fulfill-order
  await supabase.from("orders").update({
    canvas_size: canvasSize,
    fulfillment_status: "submitting",
  }).eq("id", celestialOrderId);

  // Delegate to fulfill-order edge function which handles:
  //   - insert card generation
  //   - Prodigi SKU resolution
  //   - Prodigi submission
  //   - fulfillment_status updates
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

  console.log(`wc-webhook: calling fulfill-order for ${celestialOrderId}`);

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
    console.log(`wc-webhook: ✅ canvas order ${celestialOrderId} → Prodigi ${fulfillData.prodigiOrderId || "unknown"}`);
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
      console.log(`wc-webhook: SKIP | status=${status} is not processing/completed`);
      return;
    }

    const metaData = order.meta_data || [];
    console.log("wc-webhook: order meta_data keys:", metaData.map((m: any) => m.key).join(", "));

    let celestialOrderId = getMeta(metaData, "celestial_order_id") || getMeta(metaData, "_celestial_order_id");
    const funnelType = getMeta(metaData, "funnel_type") || getMeta(metaData, "_funnel_type");
    const artworkUrl = getMeta(metaData, "artwork_url") || getMeta(metaData, "_artwork_url");
    const styleId = getMeta(metaData, "style_id") || getMeta(metaData, "_style_id");
    const sunSign = getMeta(metaData, "sun_sign") || getMeta(metaData, "_sun_sign");
    const moonSign = getMeta(metaData, "moon_sign") || getMeta(metaData, "_moon_sign");
    const risingSign = getMeta(metaData, "rising_sign") || getMeta(metaData, "_rising_sign");
    const resolution = getMeta(metaData, "resolution") || getMeta(metaData, "_resolution");

    // Fallback: if no celestial_order_id in metadata, try to match by billing email + recent pending order
    if (!celestialOrderId) {
      const billingEmail = order.billing?.email || "";
      const canvasSize = getMeta(metaData, "canvas_size") || getMeta(metaData, "_canvas_size") || "";
      const customerNameMeta = getMeta(metaData, "customer_name") || "";
      console.log(`wc-webhook: no celestial_order_id on WC order ${wcOrderId}, attempting fallback match | email="${billingEmail}" size="${canvasSize}"`);

      if (billingEmail && billingEmail !== "guest@celestialartworks.com") {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const sb = createClient(supabaseUrl, serviceKey);

        // Find the most recent pending order for this email within the last 24 hours
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: candidates } = await sb
          .from("orders")
          .select("id, canvas_size, chart_data, created_at")
          .eq("customer_email", billingEmail)
          .is("shopify_order_id", null)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(5);

        if (candidates && candidates.length > 0) {
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
          celestialOrderId = match.id;
          console.log(`wc-webhook: FALLBACK MATCH | celestialOrderId=${celestialOrderId} (created ${match.created_at})`);
        } else {
          console.warn(`wc-webhook: SKIP | no fallback match for email="${billingEmail}" on WC order ${wcOrderId}`);
          return;
        }
      } else {
        console.warn(`wc-webhook: SKIP | no celestial_order_id and no usable billing email on WC order ${wcOrderId}`);
        return;
      }
    }

    console.log(`wc-webhook: RESOLVED celestialOrderId=${celestialOrderId} | funnel=${funnelType || "canvas"}`);

    // Update orders table with WC order details
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    // Duplicate-fulfillment guard
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("fulfillment_status, shopify_order_id")
      .eq("id", celestialOrderId)
      .maybeSingle();

    if (existingOrder?.fulfillment_status === "submitted" || existingOrder?.fulfillment_status === "fulfilled") {
      console.log(`wc-webhook: SKIP DUPLICATE | order ${celestialOrderId} already ${existingOrder.fulfillment_status}`);
      return;
    }
    if (existingOrder?.shopify_order_id && existingOrder.shopify_order_id !== String(order.id)) {
      console.log(`wc-webhook: SKIP DUPLICATE | order ${celestialOrderId} already linked to WC order ${existingOrder.shopify_order_id}`);
      return;
    }

    const customerEmail = order.billing?.email || "";
    const { error: linkErr } = await supabase.from("orders").update({
      shopify_order_id: String(order.id),
      shopify_order_number: wcOrderNumber,
      customer_email: customerEmail || undefined,
    }).eq("id", celestialOrderId);

    if (linkErr) console.error("wc-webhook: order link error:", linkErr.message);

    console.log(`wc-webhook: PROCESSING | wcOrder=${wcOrderNumber} | funnel=${funnelType || "canvas"} | celestialId=${celestialOrderId}`);

    // Subscribe customer to Klaviyo
    await subscribeToKlaviyo(customerEmail);

    if (funnelType === "digital") {
      console.log(`wc-webhook: CALLING handleDigitalFulfillment for ${celestialOrderId}`);
      await handleDigitalFulfillment(order, celestialOrderId, {
        resolution, styleId, sunSign, moonSign, risingSign, artworkUrl,
      });

      // Fire Klaviyo events via Client API
      const customerName = `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim();
      const klaviyoUrl = "https://a.klaviyo.com/client/events/?company_id=XEPXRf";
      const klaviyoHeaders = { "Content-Type": "application/json", Accept: "application/json", revision: "2024-10-15" };

      try {
        const res1 = await fetch(klaviyoUrl, {
          method: "POST",
          headers: klaviyoHeaders,
          body: JSON.stringify({
            data: {
              type: "event",
              attributes: {
                profile: { data: { type: "profile", attributes: { email: customerEmail } } },
                metric: { data: { type: "metric", attributes: { name: "Digital Purchase Confirmed" } } },
                properties: {
                  customer_name: customerName, order_number: wcOrderNumber, artwork_url: artworkUrl,
                  resolution, sun_sign: sunSign, moon_sign: moonSign, rising_sign: risingSign,
                },
                time: new Date().toISOString(),
                unique_id: `digital-purchase-confirmed-${order.id}-${Date.now()}`,
              },
            },
          }),
        });
        const body1 = await res1.text();
        console.log(`wc-webhook: Klaviyo Digital Purchase Confirmed ${res1.status} ${body1.substring(0, 200)}`);
      } catch (e: any) {
        console.error("wc-webhook: Klaviyo Digital Purchase Confirmed error:", e.message);
      }

      try {
        const res2 = await fetch(klaviyoUrl, {
          method: "POST",
          headers: klaviyoHeaders,
          body: JSON.stringify({
            data: {
              type: "event",
              attributes: {
                profile: { data: { type: "profile", attributes: { email: customerEmail } } },
                metric: { data: { type: "metric", attributes: { name: "Digital File Ready" } } },
                properties: {
                  customer_name: customerName, order_number: wcOrderNumber, artwork_url: artworkUrl,
                  download_url: artworkUrl,
                  resolution: resolution === "high_resolution" ? "High Resolution" : "Standard",
                  sun_sign: sunSign, moon_sign: moonSign, rising_sign: risingSign, expiry_days: 30,
                },
                time: new Date().toISOString(),
                unique_id: `digital-file-ready-${order.id}-${Date.now()}`,
              },
            },
          }),
        });
        const body2 = await res2.text();
        console.log(`wc-webhook: Klaviyo Digital File Ready ${res2.status} ${body2.substring(0, 200)}`);
      } catch (e: any) {
        console.error("wc-webhook: Klaviyo Digital File Ready error:", e.message);
      }
    } else {
      console.log(`wc-webhook: CALLING handleCanvasFulfillment for ${celestialOrderId}`);
      await handleCanvasFulfillment(order, celestialOrderId, {
        sunSign, moonSign, risingSign, artworkUrl,
      });
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

  console.log(`wc-webhook: AUTHENTICATED | topic=${webhookTopic} | orderId=${order.id}`);

  // Return 200 immediately, process async
  EdgeRuntime.waitUntil(processOrder(order));
  return new Response("ok", { status: 200 });
});
