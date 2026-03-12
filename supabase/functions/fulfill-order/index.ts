import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const PRODIGI_API_KEY_FALLBACK = "02635eb7-2a29-46d5-96d7-4e2237b55474";
const PRODIGI_SKU: Record<string, string> = {
  "12x18|none": "GLOBAL-CFP-12X18", "12x18|black": "GLOBAL-CFPM-12X18-BK", "12x18|white": "GLOBAL-CFPM-12X18-WH", "12x18|natural": "GLOBAL-CFPM-12X18-NA", "12x18|walnut": "GLOBAL-CFPM-12X18-WA",
  "16x24|none": "GLOBAL-CFP-16X24", "16x24|black": "GLOBAL-CFPM-16X24-BK", "16x24|white": "GLOBAL-CFPM-16X24-WH", "16x24|natural": "GLOBAL-CFPM-16X24-NA", "16x24|walnut": "GLOBAL-CFPM-16X24-WA",
  "20x30|none": "GLOBAL-CFP-20X30", "20x30|black": "GLOBAL-CFPM-20X30-BK", "20x30|white": "GLOBAL-CFPM-20X30-WH", "20x30|natural": "GLOBAL-CFPM-20X30-NA", "20x30|walnut": "GLOBAL-CFPM-20X30-WA",
};
const SIZE_RE = /12x18|16x24|20x30/i;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let body: any;
  try { body = await req.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }
  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  const prodigiKey = body.prodigiKey || Deno.env.get("PRODIGI_API_KEY") || PRODIGI_API_KEY_FALLBACK;
  const prodigiSandbox = body.prodigiSandbox || Deno.env.get("PRODIGI_SANDBOX") || false;
  try {
    const result = await fulfillOrder(body, supabase, prodigiKey, prodigiSandbox);
    return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("fulfill-order Error:", err?.message ?? err);
    if (body.celestialOrderId) await supabase.from("orders").update({ fulfillment_status: "failed", fulfillment_error: String(err?.message ?? err).substring(0, 500) }).eq("id", body.celestialOrderId).then(() => {}).catch(() => {});
    return new Response(JSON.stringify({ error: err?.message }), { status: 500 });
  }
});

async function fulfillOrder(order: any, supabase: any, prodigiKey: string, prodigiSandbox: any) {
  const { celestialOrderId, shopifyOrderId, shopifyOrderNumber, customerName, customerEmail, shippingAddress, lineItems, noteAttributes } = order;
  console.log("fulfill-order: Processing", celestialOrderId, "shopifyOrder:", shopifyOrderNumber);
  const { data: celestialOrder, error } = await supabase.from("orders").select("*").eq("id", celestialOrderId).single();
  if (error || !celestialOrder) throw new Error("Order not found: " + celestialOrderId);
  await supabase.from("orders").update({ shopify_order_id: shopifyOrderId, shopify_order_number: shopifyOrderNumber }).eq("id", celestialOrderId);
  const addr = shippingAddress ?? {};
  const hasAddress = !!addr.address1?.trim() && !!addr.city?.trim() && !!addr.zip?.trim();
  if (!hasAddress) {
    const detail = JSON.stringify({ address1: addr.address1 ?? null, city: addr.city ?? null, zip: addr.zip ?? null, country_code: addr.country_code ?? null });
    await supabase.from("orders").update({ fulfillment_status: "missing_address", fulfillment_error: "Shipping address incomplete: " + detail }).eq("id", celestialOrderId);
    throw new Error("Shipping address incomplete: " + detail);
  }
  const sku = resolveProdigiSku(lineItems, noteAttributes);
  const sizeMatch = sku.match(SIZE_RE);
  await supabase.from("orders").update({ canvas_size: sizeMatch ? sizeMatch[0].toLowerCase() : null, prodigi_sku: sku, fulfillment_status: "submitting" }).eq("id", celestialOrderId);
  const insertCardUrl = await generateInsertCard(celestialOrder);
  const prodigiResult = await submitToProdigi({ shopifyOrderNumber, customerName, customerEmail, shippingAddress, artworkUrl: celestialOrder.generated_image_url, insertCardUrl, sku, prodigiKey, prodigiSandbox });
  const prodigiOrderId = prodigiResult?.order?.id ?? prodigiResult?.id ?? null;
  if (prodigiOrderId) {
    await supabase.from("orders").update({ prodigi_order_id: String(prodigiOrderId), fulfillment_status: "submitted", fulfillment_error: null }).eq("id", celestialOrderId);
  } else {
    const msg = "Prodigi returned no order ID. Response: " + JSON.stringify(prodigiResult).substring(0, 300);
    await supabase.from("orders").update({ fulfillment_status: "failed", fulfillment_error: msg }).eq("id", celestialOrderId);
  }
  return { success: true, prodigiOrderId, sku };
}

async function generateInsertCard(celestialOrder: any): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const chartData = celestialOrder.chart_data ?? {};
  const analysis = celestialOrder.artwork_analysis ?? {};
  const artworkAnalysis = {
    sun: buildSection(analysis.sun, `Sun in ${chartData.sun?.sign ?? ""}, House ${chartData.sun?.house ?? ""}`),
    moon: buildSection(analysis.moon, `Moon in ${chartData.moon?.sign ?? ""}, House ${chartData.moon?.house ?? ""}`),
    rising: buildSection(analysis.rising, `${chartData.rising ?? ""} Rising`),
    element: buildSection(analysis.element, `${dominantElement(chartData.element_balance)} Dominant`),
  };
  const resp = await fetch(`${supabaseUrl}/functions/v1/generate-insert-card`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` }, body: JSON.stringify({ orderId: celestialOrder.id, customerName: celestialOrder.customer_name ?? "", birthDate: chartData.birth_date ?? "", birthTime: chartData.birth_time ?? "", birthPlace: chartData.birth_place ?? chartData.location ?? "", artworkAnalysis }) });
  if (!resp.ok) throw new Error("generate-insert-card failed: " + resp.status + " " + await resp.text());
  const result = await resp.json();
  if (!result.success || !result.insertCardUrl) throw new Error("No insert card URL");
  return result.insertCardUrl;
}

function buildSection(s: any, fallbackLabel: string) { return { label: s?.label ?? fallbackLabel, title: s?.artworkElement ?? s?.title ?? "", explanation: s?.explanation ?? "" }; }
function dominantElement(eb: Record<string, number> | undefined): string { if (!eb) return "Fire"; return Object.keys(eb).reduce((a, b) => eb[a] > eb[b] ? a : b, "Fire"); }

function resolveProdigiSku(lineItems: any[], noteAttributes?: any[]): string {
  for (const item of lineItems) {
    const rawSku = (item.sku ?? "").toLowerCase();
    if (rawSku) {
      const size = rawSku.match(SIZE_RE)?.[0]?.toLowerCase() ?? "";
      const frame = rawSku.match(/black|white|natural|walnut|none/)?.[0] ?? "none";
      const key = `${size}|${frame}`;
      if (PRODIGI_SKU[key]) return PRODIGI_SKU[key];
    }
    const props: Record<string, string> = {};
    for (const p of (item.properties ?? [])) props[p.name] = p.value;
    const propSize = (props["canvas_size"] ?? props["canvassize"] ?? "").toLowerCase();
    const propFrame = (props["frame"] ?? "none").toLowerCase();
    if (propSize) {
      const size = propSize.match(SIZE_RE)?.[0] ?? propSize;
      const key = `${size}|${propFrame}`;
      if (PRODIGI_SKU[key]) return PRODIGI_SKU[key];
    }
    const variantTitle = (item.variant_title ?? "").toLowerCase();
    if (variantTitle) {
      const size = variantTitle.match(SIZE_RE)?.[0] ?? "";
      if (size) {
        const key = `${size}|${propFrame !== "none" ? propFrame : "none"}`;
        if (PRODIGI_SKU[key]) return PRODIGI_SKU[key];
      }
    }
  }
  if (Array.isArray(noteAttributes)) {
    const noteMap: Record<string, string> = {};
    for (const attr of noteAttributes) noteMap[attr.name ?? attr.key ?? ""] = attr.value ?? "";
    const noteSize = (noteMap["canvas_size"] ?? noteMap["canvassize"] ?? "").toLowerCase();
    if (noteSize) {
      const size = noteSize.match(SIZE_RE)?.[0] ?? noteSize;
      const frame = (noteMap["frame"] ?? "none").toLowerCase();
      const key = `${size}|${frame}`;
      if (PRODIGI_SKU[key]) return PRODIGI_SKU[key];
    }
  }
  console.warn("resolveProdigiSku: No size found. Defaulting to GLOBAL-CFP-16X24.");
  return "GLOBAL-CFP-16X24";
}

async function submitToProdigi(args: any) {
  const { prodigiKey, prodigiSandbox } = args;
  if (!prodigiKey) throw new Error("No Prodigi API key");
  const base = prodigiSandbox === true || prodigiSandbox === "true" ? "https://api.sandbox.prodigi.com/v4.0" : "https://api.prodigi.com/v4.0";
  const addr = args.shippingAddress ?? {};
  const address: Record<string, string> = { line1: addr.address1 ?? "", postalOrZipCode: addr.zip ?? "", townOrCity: addr.city ?? "", stateOrCounty: addr.province ?? "", countryCode: addr.country_code ?? addr.country ?? "US" };
  if (addr.address2?.trim()) address.line2 = addr.address2;
  const payload: any = { merchantReference: String(args.shopifyOrderNumber), shippingMethod: "Standard", recipient: { name: args.customerName || "Customer", email: args.customerEmail, address }, items: [{ merchantReference: `${args.shopifyOrderNumber}-1`, sku: args.sku, copies: 1, sizing: "fillPrintArea", attributes: { color: resolveFrameColor(args.sku) }, assets: [{ printArea: "default", url: args.artworkUrl }] }] };
  if (args.insertCardUrl) payload.branding = { flyer: { url: args.insertCardUrl } };
  const resp = await fetch(`${base}/orders`, { method: "POST", headers: { "X-API-Key": prodigiKey, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const text = await resp.text();
  console.log("submitToProdigi:", resp.status, text.substring(0, 400));
  if (!resp.ok) throw new Error(`Prodigi error ${resp.status}: ${text}`);
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function resolveFrameColor(sku: string): string {
  if (sku.includes("-BK")) return "black";
  if (sku.includes("-WH")) return "white";
  if (sku.includes("-NA")) return "natural";
  if (sku.includes("-WA")) return "brown";
  return "white";
}
