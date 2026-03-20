import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function verifyShopifyHmac(secret: string, rawBody: string, hmacHeader: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === hmacHeader;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function extractLineItemProperty(lineItems: any[], key: string): string | null {
  for (const item of lineItems) {
    for (const attr of (item.properties ?? [])) {
      if (attr.name === key) return attr.value;
    }
  }
  return null;
}

function extractNoteAttribute(noteAttributes: any[], key: string): string | null {
  for (const attr of noteAttributes) {
    if (attr.name === key) return attr.value;
  }
  return null;
}

function extractResolution(lineItems: any[]): string {
  for (const item of lineItems) {
    const title = (item.variant_title || item.title || "").toLowerCase();
    if (title.includes("standard")) return "Standard";
  }
  return "High Resolution";
}

function parseNoteField(note: string | undefined | null, field: string): string {
  if (!note) return "";
  const match = note.match(new RegExp(`${field}:\\s*([^|]+)`));
  return match ? match[1].trim() : "";
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
    console.log(`webhook: Klaviyo ${metricName} ${res.status} ${text.substring(0, 120)}`);
  } catch (e: any) {
    console.error(`webhook: Klaviyo ${metricName} error (non-fatal):`, e.message);
  }
}

function storagePathFromUrl(publicUrl: string): string {
  // Extract path after /object/public/artworks/
  const marker = "/object/public/artworks/";
  const idx = publicUrl.indexOf(marker);
  if (idx !== -1) return publicUrl.substring(idx + marker.length);
  // Fallback: last segment
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

/* ------------------------------------------------------------------ */
/*  Digital fulfillment path                                           */
/* ------------------------------------------------------------------ */

async function handleDigitalFulfillment(
  order: any,
  celestialOrderId: string,
  shopifyOrderNumber: string,
  lineItems: any[],
  noteAttributes: any[],
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const klaviyoKey = Deno.env.get("KLAVIYO_API_KEY") ?? "";
  const apiframeKey = Deno.env.get("APIFRAME_API_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceKey);

  const customerEmail = order.email || order.customer?.email || "";
  const resolution = extractResolution(lineItems);
  const note = order.note || "";

  // Extract metadata from note attributes or note string
  const styleId = extractNoteAttribute(noteAttributes, "style_id") || extractLineItemProperty(lineItems, "style_id") || "";
  const sunSign = extractNoteAttribute(noteAttributes, "sun_sign") || parseNoteField(note, "Sun");
  const moonSign = extractNoteAttribute(noteAttributes, "moon_sign") || parseNoteField(note, "Moon");
  const risingSign = extractNoteAttribute(noteAttributes, "rising_sign") || parseNoteField(note, "Rising");
  const artworkUrl = extractNoteAttribute(noteAttributes, "artwork_url") || "";

  // Step 1 — Immediate confirmation via Klaviyo
  if (klaviyoKey) {
    await sendKlaviyoEvent(klaviyoKey, "Digital Purchase Confirmed", customerEmail, {
      order_number: shopifyOrderNumber,
      resolution,
      style_id: styleId,
      sun_sign: sunSign,
      moon_sign: moonSign,
      rising_sign: risingSign,
      artwork_url: artworkUrl,
      product_type: "digital",
    });
  } else {
    console.warn("webhook: KLAVIYO_API_KEY not set, skipping confirmation event");
  }

  // Step 2 — Resolve artwork and prepare download
  // Look up via orders table first, then artworks
  let permanentUrl = "";
  let apiframeTaskId = "";
  let artworkId = "";

  const { data: orderRow } = await supabase
    .from("orders")
    .select("id, generated_image_url")
    .eq("id", celestialOrderId)
    .maybeSingle();

  if (orderRow) {
    permanentUrl = orderRow.generated_image_url || "";
  }

  // Also look up artworks for apiframe_task_id
  const { data: artworkRow } = await supabase
    .from("artworks")
    .select("id, artwork_url, apiframe_task_id")
    .eq("session_id", celestialOrderId)
    .maybeSingle();

  if (artworkRow) {
    artworkId = artworkRow.id;
    apiframeTaskId = artworkRow.apiframe_task_id || "";
    if (!permanentUrl) permanentUrl = artworkRow.artwork_url || "";
  }

  if (!permanentUrl) {
    permanentUrl = artworkUrl; // fallback to cart attribute
  }

  let signedUrl = "";
  let fallbackResolution = false;

  if (resolution === "High Resolution" && apiframeTaskId && apiframeKey) {
    // Upscale via Apiframe
    try {
      console.log(`webhook: digital upscale starting, task=${apiframeTaskId}`);
      const upscaleRes = await fetch("https://api.apiframe.pro/upscale-highres", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiframeKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ parent_task_id: apiframeTaskId, type: "4x" }),
      });
      const upscaleData = await upscaleRes.json();

      if (!upscaleData.task_id) throw new Error(`Upscale submit failed: ${JSON.stringify(upscaleData)}`);
      const upscaleTaskId = upscaleData.task_id;
      console.log(`webhook: upscale task=${upscaleTaskId}`);

      let upscaledImageUrl = "";
      for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const pollRes = await fetch("https://api.apiframe.pro/fetch", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiframeKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ task_id: upscaleTaskId }),
        });
        const pollData = await pollRes.json();
        console.log(`webhook: upscale poll ${i + 1}: ${pollData.status}`);
        if (pollData.status === "finished") {
          upscaledImageUrl = pollData.image_url || pollData.image_urls?.[0] || pollData.output || "";
          break;
        }
        if (pollData.status === "failed") throw new Error("Upscale failed");
      }

      if (!upscaledImageUrl) throw new Error("Upscale timed out");

      // Download and upload to storage
      const imgRes = await fetch(upscaledImageUrl);
      if (!imgRes.ok) throw new Error(`Download failed: ${imgRes.status}`);
      const imgBuf = await imgRes.arrayBuffer();
      const filePath = `${artworkId || celestialOrderId}_4x.png`;

      await supabase.storage.from("artworks").upload(filePath, imgBuf, { contentType: "image/png", upsert: true });

      const { data: signedData, error: signErr } = await supabase.storage.from("artworks").createSignedUrl(filePath, 2592000);
      if (signErr) throw new Error(`Signed URL error: ${signErr.message}`);
      signedUrl = signedData.signedUrl;
      console.log(`webhook: upscale complete, signed URL ready`);
    } catch (e: any) {
      console.error("webhook: upscale failed, falling back to standard:", e.message);
      fallbackResolution = true;
    }
  }

  // Standard resolution or fallback
  if (!signedUrl && permanentUrl) {
    const filePath = storagePathFromUrl(permanentUrl);
    if (filePath) {
      const { data: signedData, error: signErr } = await supabase.storage.from("artworks").createSignedUrl(filePath, 2592000);
      if (signErr) {
        console.error("webhook: signed URL error for standard:", signErr.message);
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
      artwork_url: permanentUrl || artworkUrl,
      order_number: shopifyOrderNumber,
      expiry_days: 30,
    };
    if (fallbackResolution) deliveryProps.fallback_resolution = true;
    await sendKlaviyoEvent(klaviyoKey, "Digital File Ready", customerEmail, deliveryProps);
  }

  // Step 4 — Update database
  const updatePayload: Record<string, any> = {
    fulfilled_at: new Date().toISOString(),
    fulfillment_type: "digital",
  };
  if (signedUrl) updatePayload.digital_download_url = signedUrl;

  const { error: updateErr } = await supabase
    .from("orders")
    .update(updatePayload)
    .eq("id", celestialOrderId);

  if (updateErr) {
    console.error("webhook: orders update error:", updateErr.message);
  } else {
    console.log(`webhook: digital order ${celestialOrderId} fulfilled`);
  }
}

/* ------------------------------------------------------------------ */
/*  Main handler                                                       */
/* ------------------------------------------------------------------ */

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawBody = await req.text();
  const webhookSecret = Deno.env.get("SHOPIFY_WEBHOOK_SECRET");
  if (!webhookSecret) return new Response("Server misconfiguration", { status: 500 });
  const hmacHeader = req.headers.get("X-Shopify-Hmac-Sha256") ?? "";
  if (!await verifyShopifyHmac(webhookSecret, rawBody, hmacHeader)) {
    console.warn("webhook: Invalid HMAC");
    return new Response("Unauthorized", { status: 401 });
  }
  let order: any;
  try { order = JSON.parse(rawBody); } catch { return new Response("Invalid JSON", { status: 400 }); }

  let celestialOrderId: string | null = null;
  let funnelType: string | null = null;
  const lineItems = order.line_items ?? [];

  for (const item of lineItems) {
    for (const attr of (item.properties ?? [])) {
      if (attr.name === "_celestialorderid" || attr.name === "_celestial_order_id") {
        celestialOrderId = attr.value;
      }
      if (attr.name === "_funnel_type") {
        funnelType = attr.value;
      }
    }
    if (celestialOrderId) break;
  }

  if (!celestialOrderId) {
    console.warn("webhook: No _celestialorderid on order", order.id, "skipping");
    return new Response("ok", { status: 200 });
  }

  const shopifyOrderNumber = String(order.order_number ?? order.name ?? "");
  const noteAttributes = order.note_attributes ?? [];

  // --- Digital funnel branch ---
  if (funnelType === "digital") {
    console.log(`webhook: digital order detected, celestialOrderId=${celestialOrderId}`);
    try {
      await handleDigitalFulfillment(order, celestialOrderId, shopifyOrderNumber, lineItems, noteAttributes);
    } catch (e: any) {
      console.error("webhook: digital fulfillment error (non-fatal):", e.message);
    }
    return new Response("ok", { status: 200 });
  }

  // --- Existing canvas/Prodigi path (unchanged) ---
  const customerName = [order.customer?.first_name ?? "", order.customer?.last_name ?? ""].join(" ").trim() || order.customer?.email || "Customer";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const prodigiKey = Deno.env.get("PRODIGI_API_KEY") ?? "";
  const prodigiSandbox = Deno.env.get("PRODIGI_SANDBOX") ?? "false";
  const fulfillPayload = { celestialOrderId, shopifyOrderId: String(order.id ?? ""), shopifyOrderNumber, customerName, customerEmail: order.email ?? order.customer?.email ?? "", shippingAddress: order.shipping_address, lineItems, noteAttributes, prodigiKey, prodigiSandbox };
  EdgeRuntime.waitUntil(
    fetch(`${supabaseUrl}/functions/v1/fulfill-order`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` }, body: JSON.stringify(fulfillPayload) })
      .then(r => r.text().then(t => console.log("webhook: fulfill-order", r.status, t.substring(0, 100))))
      .catch(e => console.error("webhook: fulfill-order error", e.message))
  );
  return new Response("ok", { status: 200 });
});
