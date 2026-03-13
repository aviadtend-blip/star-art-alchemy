import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const PRODIGI_API_KEY_FALLBACK = "02635eb7-2a29-46d5-96d7-4e2237b55474";

const PRODIGI_SKU: Record<string, string> = {
  "12x18_none":    "GLOBAL-CFP-12X18",
  "12x18_black":   "GLOBAL-CFPM-12X18-BK",
  "12x18_white":   "GLOBAL-CFPM-12X18-WH",
  "12x18_natural": "GLOBAL-CFPM-12X18-NA",
  "12x18_walnut":  "GLOBAL-CFPM-12X18-WA",
  "16x24_none":    "GLOBAL-CFP-16X24",
  "16x24_black":   "GLOBAL-CFPM-16X24-BK",
  "16x24_white":   "GLOBAL-CFPM-16X24-WH",
  "16x24_natural": "GLOBAL-CFPM-16X24-NA",
  "16x24_walnut":  "GLOBAL-CFPM-16X24-WA",
  "20x30_none":    "GLOBAL-CFP-20X30",
  "20x30_black":   "GLOBAL-CFPM-20X30-BK",
  "20x30_white":   "GLOBAL-CFPM-20X30-WH",
  "20x30_natural": "GLOBAL-CFPM-20X30-NA",
  "20x30_walnut":  "GLOBAL-CFPM-20X30-WA",
};

const SIZE_RE = /(12x18|16x24|20x30)/i;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body: any;
  try { body = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const prodigiKey     = body.prodigiKey || Deno.env.get("PRODIGI_API_KEY") || PRODIGI_API_KEY_FALLBACK;
  const prodigiSandbox = body.prodigiSandbox || Deno.env.get("PRODIGI_SANDBOX") || "false";

  console.log(`[fulfill-order] prodigiKey source: ${body.prodigiKey ? 'payload' : Deno.env.get('PRODIGI_API_KEY') ? 'env' : 'fallback'}`);

  try {
    const result = await fulfillOrder(body, supabase, prodigiKey, prodigiSandbox);
    return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("[fulfill-order] Error:", err?.message ?? err);
    if (body.celestialOrderId) {
      await supabase.from("orders").update({
        fulfillment_status: "failed",
        fulfillment_error: String(err?.message ?? err).substring(0, 500),
      }).eq("id", body.celestialOrderId).then(() => {}).catch(() => {});
    }
    return new Response(JSON.stringify({ error: err?.message }), { status: 500 });
  }
});

async function fulfillOrder(order: any, supabase: any, prodigiKey: string, prodigiSandbox: string) {
  const { celestialOrderId, shopifyOrderId, shopifyOrderNumber,
          customerName, customerEmail, shippingAddress, lineItems,
          noteAttributes } = order;

  console.log(`[fulfill-order] Processing: celestialOrderId=${celestialOrderId}, shopifyOrder=${shopifyOrderNumber}`);

  const { data: celestialOrder, error } = await supabase
    .from("orders").select("*").eq("id", celestialOrderId).single();
  if (error || !celestialOrder) throw new Error(`Order not found: ${celestialOrderId}`);

  await supabase.from("orders").update({
    shopify_order_id: shopifyOrderId,
    shopify_order_number: shopifyOrderNumber,
  }).eq("id", celestialOrderId);

  // Validate shipping address before expensive operations
  const addr = shippingAddress ?? {};
  const hasAddress = !!(addr.address1?.trim() && addr.city?.trim() && addr.zip?.trim());
  if (!hasAddress) {
    const detail = JSON.stringify({ address1: addr.address1 ?? null, city: addr.city ?? null, zip: addr.zip ?? null, country_code: addr.country_code ?? null });
    console.warn(`[fulfill-order] Missing shipping address for ${celestialOrderId}: ${detail}`);
    await supabase.from("orders").update({
      fulfillment_status: "missing_address",
      fulfillment_error: `Shipping address incomplete: ${detail}`,
    }).eq("id", celestialOrderId);
    throw new Error(`Shipping address incomplete: ${detail}`);
  }
  console.log(`[fulfill-order] Address OK: ${addr.city}, ${addr.province}, ${addr.country_code}`);

  const sku = resolveProdigiSku(lineItems, noteAttributes);
  const sizeMatch = sku.match(SIZE_RE);
  console.log(`[fulfill-order] Resolved SKU: ${sku}`);

  await supabase.from("orders").update({
    canvas_size: sizeMatch ? sizeMatch[1].toLowerCase() : null,
    prodigi_sku: sku,
    fulfillment_status: "submitting",
  }).eq("id", celestialOrderId);

  // Resolve customer name: webhook customerName (from Shopify) > chart_data.customer_name > chart_data.name > "Your"
  const chartData = celestialOrder.chart_data ?? {};
  const resolvedName = customerName?.trim()
    || celestialOrder.customer_name?.trim()
    || chartData.customer_name?.trim()
    || chartData.name?.trim()
    || "Your";
  console.log(`[fulfill-order] Resolved customer name: "${resolvedName}"`);

  const insertCardUrl = await generateInsertCard(celestialOrder, resolvedName);
  console.log(`[fulfill-order] Insert card: ${insertCardUrl}`);

  const prodigiResult = await submitToProdigi({
    shopifyOrderNumber, customerName: resolvedName, customerEmail,
    shippingAddress, artworkUrl: celestialOrder.generated_image_url,
    insertCardUrl, sku, prodigiKey, prodigiSandbox,
  });

  const prodigiOutcome = prodigiResult?.outcome ?? "unknown";
  const prodigiOrderId = prodigiResult?.order?.id ?? prodigiResult?.id ?? null;
  console.log(`[fulfill-order] Prodigi outcome=${prodigiOutcome}, orderId=${prodigiOrderId}`);

  if (prodigiOrderId) {
    await supabase.from("orders").update({
      prodigi_order_id: String(prodigiOrderId),
      fulfillment_status: "submitted",
      fulfillment_error: null,
    }).eq("id", celestialOrderId);
    console.log(`[fulfill-order] ✅ Prodigi order: ${prodigiOrderId}`);
  } else {
    const msg = `Prodigi returned no order ID. Outcome: ${prodigiOutcome}. Response: ${JSON.stringify(prodigiResult).substring(0, 300)}`;
    await supabase.from("orders").update({
      fulfillment_status: "failed",
      fulfillment_error: msg,
    }).eq("id", celestialOrderId);
    console.warn(`[fulfill-order] ⚠️ ${msg}`);
  }

  return { success: true, prodigiOrderId, prodigiOutcome, sku };
}

/**
 * Transform artwork_analysis from DB format to insert card format.
 *
 * DB format (from analyze-artwork):
 *   { elements: [ { chartElement, artworkElement, explanation, icon, aiPosition }, ... ] }
 *   Elements are in order: [0]=sun, [1]=moon, [2]=rising, [3]=element
 *
 * Insert card format (expected by generate-insert-card):
 *   { sun:     { label, title, explanation },
 *     moon:    { label, title, explanation },
 *     rising:  { label, title, explanation },
 *     element: { label, title, explanation } }
 *
 * Also handles the legacy keyed format { sun: {...}, moon: {...}, ... } if present.
 */
function transformArtworkAnalysis(analysis: any, chartData: any): any {
  if (!analysis) return { sun: {}, moon: {}, rising: {}, element: {} };

  // New format: elements[] array (from analyze-artwork)
  if (Array.isArray(analysis.elements) && analysis.elements.length >= 4) {
    const [sunEl, moonEl, risingEl, elementEl] = analysis.elements;
    return {
      sun:     { label: sunEl.chartElement,     artworkElement: sunEl.artworkElement,     explanation: sunEl.explanation },
      moon:    { label: moonEl.chartElement,     artworkElement: moonEl.artworkElement,     explanation: moonEl.explanation },
      rising:  { label: risingEl.chartElement,   artworkElement: risingEl.artworkElement,   explanation: risingEl.explanation },
      element: { label: elementEl.chartElement,  artworkElement: elementEl.artworkElement,  explanation: elementEl.explanation },
    };
  }

  // Legacy format: { sun: {...}, moon: {...}, rising: {...}, element: {...} }
  if (analysis.sun || analysis.moon || analysis.rising || analysis.element) {
    return analysis;
  }

  // Unknown format — return empty sections
  console.warn(`[fulfill-order] Unknown artwork_analysis format: ${JSON.stringify(analysis).substring(0, 200)}`);
  return { sun: {}, moon: {}, rising: {}, element: {} };
}

async function generateInsertCard(celestialOrder: any, resolvedName: string): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const chartData   = celestialOrder.chart_data ?? {};
  const rawAnalysis = celestialOrder.artwork_analysis ?? {};

  // Transform from DB format (elements[]) to insert card format ({sun, moon, rising, element})
  const analysis = transformArtworkAnalysis(rawAnalysis, chartData);

  const artworkAnalysis = {
    sun:     buildSection(analysis.sun,     `Sun in ${chartData.sun?.sign ?? ""}, House ${chartData.sun?.house ?? ""}`),
    moon:    buildSection(analysis.moon,    `Moon in ${chartData.moon?.sign ?? ""}, House ${chartData.moon?.house ?? ""}`),
    rising:  buildSection(analysis.rising,  `${chartData.rising ?? ""} Rising`),
    element: buildSection(analysis.element, `${dominantElement(chartData.element_balance)} Dominant`),
  };

  console.log(`[fulfill-order] Insert card data: name="${resolvedName}", sections: sun="${artworkAnalysis.sun.title}", moon="${artworkAnalysis.moon.title}", rising="${artworkAnalysis.rising.title}", element="${artworkAnalysis.element.title}"`);

  const resp = await fetch(`${supabaseUrl}/functions/v1/generate-insert-card`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
    body: JSON.stringify({
      orderId: celestialOrder.id,
      customerName: resolvedName,
      birthDate: chartData.birth_date ?? "",
      birthTime: chartData.birth_time ?? "",
      birthPlace: chartData.birth_place ?? chartData.location ?? "",
      artworkAnalysis,
    }),
  });
  if (!resp.ok) throw new Error(`generate-insert-card failed (${resp.status}): ${await resp.text()}`);
  const result = await resp.json();
  if (!result.success || !result.insertCardUrl) throw new Error(`No insert card URL`);
  return result.insertCardUrl;
}

function buildSection(s: any, fallbackLabel: string) {
  return {
    label: s?.label ?? s?.chartElement ?? fallbackLabel,
    title: s?.artworkElement ?? s?.title ?? "",
    explanation: s?.explanation ?? "",
  };
}

function dominantElement(eb: Record<string, number> | undefined): string {
  if (!eb) return "";
  return Object.keys(eb).reduce((a, b) => (eb[a] > eb[b] ? a : b), "Fire");
}

function resolveProdigiSku(lineItems: any[], noteAttributes?: any[]): string {
  for (const item of lineItems) {
    const rawSku = (item.sku ?? "").toLowerCase();
    if (rawSku) {
      const size  = rawSku.match(SIZE_RE)?.[1]?.toLowerCase() ?? "";
      const frame = rawSku.match(/(black|white|natural|walnut|none)/)?.[1] ?? "none";
      const key = `${size}_${frame}`;
      if (PRODIGI_SKU[key]) {
        console.log(`[resolveProdigiSku] Tier 1 (sku): ${key} → ${PRODIGI_SKU[key]}`);
        return PRODIGI_SKU[key];
      }
    }

    const props: Record<string, string> = {};
    for (const p of (item.properties ?? [])) props[p.name] = p.value;
    const propSize = (props._canvas_size ?? props.canvas_size ?? "").toLowerCase();
    const propFrame = (props._frame ?? props.frame ?? "none").toLowerCase();
    if (propSize) {
      const size = propSize.match(SIZE_RE)?.[1] ?? propSize;
      const key = `${size}_${propFrame}`;
      if (PRODIGI_SKU[key]) {
        console.log(`[resolveProdigiSku] Tier 2 (properties): ${key} → ${PRODIGI_SKU[key]}`);
        return PRODIGI_SKU[key];
      }
    }

    const variantTitle = (item.variant_title ?? "").toLowerCase();
    if (variantTitle) {
      const size = variantTitle.match(SIZE_RE)?.[1] ?? "";
      if (size) {
        const frame = propFrame !== "none" ? propFrame : "none";
        const key = `${size}_${frame}`;
        if (PRODIGI_SKU[key]) {
          console.log(`[resolveProdigiSku] Tier 3 (variant_title): ${key} → ${PRODIGI_SKU[key]}`);
          return PRODIGI_SKU[key];
        }
      }
    }
  }

  if (noteAttributes && Array.isArray(noteAttributes)) {
    const noteMap: Record<string, string> = {};
    for (const attr of noteAttributes) noteMap[attr.name ?? attr.key ?? ""] = attr.value ?? "";
    const noteSize = (noteMap.canvas_size ?? noteMap._canvas_size ?? "").toLowerCase();
    if (noteSize) {
      const size = noteSize.match(SIZE_RE)?.[1] ?? noteSize;
      const frame = (noteMap.frame ?? "none").toLowerCase();
      const key = `${size}_${frame}`;
      if (PRODIGI_SKU[key]) {
        console.log(`[resolveProdigiSku] Tier 4 (note_attributes): ${key} → ${PRODIGI_SKU[key]}`);
        return PRODIGI_SKU[key];
      }
    }
  }

  console.warn(`[resolveProdigiSku] ⚠️ No size found. Defaulting to GLOBAL-CFP-16X24.`);
  return "GLOBAL-CFP-16X24";
}

async function submitToProdigi(args: any) {
  const { prodigiKey, prodigiSandbox } = args;
  if (!prodigiKey) throw new Error("No Prodigi API key");

  const base = prodigiSandbox === "true"
    ? "https://api.sandbox.prodigi.com/v4.0"
    : "https://api.prodigi.com/v4.0";
  const addr = args.shippingAddress ?? {};

  const address: Record<string, string> = {
    line1: addr.address1 ?? "",
    postalOrZipCode: addr.zip ?? "",
    townOrCity: addr.city ?? "",
    stateOrCounty: addr.province ?? "",
    countryCode: addr.country_code ?? addr.country ?? "US",
  };
  if (addr.address2?.trim()) address.line2 = addr.address2;

  const payload = {
    merchantReference: String(args.shopifyOrderNumber),
    shippingMethod: "Standard",
    recipient: { name: args.customerName || "Customer", email: args.customerEmail || "", address },
    items: [{
      merchantReference: `${args.shopifyOrderNumber}-1`,
      sku: args.sku, copies: 1, sizing: "fillPrintArea",
      attributes: { color: resolveFrameColor(args.sku) },
      assets: [{ printArea: "default", url: args.artworkUrl }],
    }],
    ...(args.insertCardUrl ? { branding: { flyer: { url: args.insertCardUrl } } } : {}),
  };

  console.log(`[submitToProdigi] ${base}/orders | SKU=${args.sku} | ref=${args.shopifyOrderNumber} | hasFlyer=${!!args.insertCardUrl}`);

  const resp = await fetch(`${base}/orders`, {
    method: "POST",
    headers: { "X-API-Key": prodigiKey, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await resp.text();
  console.log(`[submitToProdigi] ${resp.status}: ${text.substring(0, 400)}`);
  if (!resp.ok) throw new Error(`Prodigi error (${resp.status}): ${text}`);
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function resolveFrameColor(sku: string): string {
  if (sku.includes("-BK")) return "black";
  if (sku.includes("-WH")) return "white";
  if (sku.includes("-NA")) return "natural";
  if (sku.includes("-WA")) return "brown";
  return "white";
}
