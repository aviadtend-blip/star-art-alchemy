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

const PRODIGI_SKU: Record<string, string> = {
  "CA-12x16": "GLOBAL-CFP-12X18",
  "CA-18x24": "GLOBAL-CFP-16X24",
  "CA-24x32": "GLOBAL-CFP-20X30",
};

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
    fulfillment_type: "digital",
  };
  if (signedUrl) updatePayload.digital_download_url = signedUrl;

  const { error: updateErr } = await supabase.from("orders").update(updatePayload).eq("id", celestialOrderId);
  if (updateErr) {
    console.error("wc-webhook: orders update error:", updateErr.message);
  } else {
    console.log(`wc-webhook: digital order ${celestialOrderId} fulfilled`);
  }
}

/* ------------------------------------------------------------------ */
/*  Canvas fulfillment                                                 */
/* ------------------------------------------------------------------ */

async function handleCanvasFulfillment(
  order: any,
  celestialOrderId: string,
  meta: { sunSign: string; moonSign: string; risingSign: string; artworkUrl: string },
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const prodigiKey = Deno.env.get("PRODIGI_API_KEY") ?? "";
  const prodigiSandbox = Deno.env.get("PRODIGI_SANDBOX") ?? "false";
  const supabase = createClient(supabaseUrl, serviceKey);

  const customerName = `${order.billing?.first_name || ""} ${order.billing?.last_name || ""}`.trim() || order.billing?.email || "Customer";
  const wcOrderNumber = String(order.number ?? "");
  const shipping = order.shipping || {};

  // Look up order row
  let artworkImageUrl = meta.artworkUrl;
  let insertCardUrl = "";

  if (celestialOrderId) {
    const { data: orderRow } = await supabase
      .from("orders")
      .select("generated_image_url, insert_card_url")
      .eq("id", celestialOrderId)
      .maybeSingle();

    if (orderRow) {
      if (orderRow.generated_image_url) artworkImageUrl = orderRow.generated_image_url;
      insertCardUrl = orderRow.insert_card_url || "";
    }
  }

  // Map SKU
  const lineItemSku = order.line_items?.[0]?.sku || "";
  const prodigiSku = PRODIGI_SKU[lineItemSku] || "GLOBAL-CFP-16X24";

  // Build Prodigi order
  const prodigiBaseUrl = prodigiSandbox === "true"
    ? "https://api.sandbox.prodigi.com/v4.0/Orders"
    : "https://api.prodigi.com/v4.0/Orders";

  const recipient: any = {
    name: customerName,
    address: {
      line1: shipping.address_1 || "",
      postalOrZipCode: shipping.postcode || "",
      townOrCity: shipping.city || "",
      stateOrCounty: shipping.state || "",
      countryCode: shipping.country || "",
    },
  };
  if (shipping.address_2) recipient.address.line2 = shipping.address_2;

  const prodigiPayload: any = {
    merchantReference: `CA-${wcOrderNumber}`,
    shippingMethod: "Standard",
    recipient,
    items: [{
      merchantReference: `ITEM-${wcOrderNumber}`,
      sku: prodigiSku,
      copies: 1,
      sizing: "fillPrintArea",
      assets: [{ printArea: "default", url: artworkImageUrl }],
    }],
  };

  if (insertCardUrl) {
    prodigiPayload.branding = {
      inserts: [{ url: insertCardUrl, type: "postcard" }],
    };
  }

  try {
    const prodigiRes = await fetch(prodigiBaseUrl, {
      method: "POST",
      headers: { "X-API-Key": prodigiKey, "Content-Type": "application/json" },
      body: JSON.stringify(prodigiPayload),
    });
    const prodigiData = await prodigiRes.json();
    console.log(`wc-webhook: Prodigi ${prodigiRes.status}`, JSON.stringify(prodigiData).substring(0, 200));

    if (celestialOrderId) {
      const updatePayload: Record<string, any> = {
        fulfilled_at: new Date().toISOString(),
        fulfillment_type: "canvas",
        prodigi_sku: prodigiSku,
      };
      if (prodigiData.order?.id) updatePayload.prodigi_order_id = prodigiData.order.id;

      await supabase.from("orders").update(updatePayload).eq("id", celestialOrderId);
      console.log(`wc-webhook: canvas order ${celestialOrderId} fulfilled`);
    }
  } catch (e: any) {
    console.error("wc-webhook: Prodigi submission error:", e.message);
    if (celestialOrderId) {
      await supabase.from("orders").update({ fulfillment_error: e.message }).eq("id", celestialOrderId);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Async processing                                                   */
/* ------------------------------------------------------------------ */

async function processOrder(order: any) {
  try {
    const status = order.status;
    if (status !== "processing" && status !== "completed") {
      console.log(`wc-webhook: skipping order ${order.id}, status=${status}`);
      return;
    }

    const metaData = order.meta_data || [];
    const celestialOrderId = getMeta(metaData, "_celestial_order_id");
    const funnelType = getMeta(metaData, "_funnel_type");
    const artworkUrl = getMeta(metaData, "_artwork_url");
    const styleId = getMeta(metaData, "_style_id");
    const sunSign = getMeta(metaData, "_sun_sign");
    const moonSign = getMeta(metaData, "_moon_sign");
    const risingSign = getMeta(metaData, "_rising_sign");
    const resolution = getMeta(metaData, "_resolution");

    if (!celestialOrderId) {
      console.warn(`wc-webhook: no _celestial_order_id on order ${order.id}, skipping`);
      return;
    }

    const wcOrderId = String(order.id ?? "");
    const wcOrderNumber = String(order.number ?? "");
    const customerEmail = order.billing?.email || "";

    // Update orders table with WC order details
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error: linkErr } = await supabase.from("orders").update({
      shopify_order_id: wcOrderId,
      shopify_order_number: wcOrderNumber,
      customer_email: customerEmail || undefined,
    }).eq("id", celestialOrderId);

    if (linkErr) console.error("wc-webhook: order link error:", linkErr.message);

    console.log(`wc-webhook: processing order ${wcOrderId} (${wcOrderNumber}), funnel=${funnelType}, celestialId=${celestialOrderId}`);

    if (funnelType === "digital") {
      await handleDigitalFulfillment(order, celestialOrderId, {
        resolution, styleId, sunSign, moonSign, risingSign, artworkUrl,
      });

      // Fire Klaviyo delivery events via notify-digital-delivery
      EdgeRuntime.waitUntil(
        fetch(`${supabaseUrl}/functions/v1/notify-digital-delivery`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
          body: JSON.stringify({ celestialOrderId }),
        })
          .then(r => r.text().then(t => console.log("wc-webhook: notify-digital-delivery", r.status, t.substring(0, 200))))
          .catch(e => console.error("wc-webhook: notify-digital-delivery error", e.message))
      );
    } else {
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
  const webhookSecret = Deno.env.get("WC_WEBHOOK_SECRET");
  if (!webhookSecret) return new Response("Server misconfiguration", { status: 500 });

  const signatureHeader = req.headers.get("X-WC-Webhook-Signature") ?? "";
  if (!await verifyWooCommerceHmac(webhookSecret, rawBody, signatureHeader)) {
    console.warn("wc-webhook: Invalid HMAC signature");
    return new Response("Unauthorized", { status: 401 });
  }

  let order: any;
  try {
    order = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Return 200 immediately, process async
  EdgeRuntime.waitUntil(processOrder(order));
  return new Response("ok", { status: 200 });
});
