import "jsr:@supabase/functions-js/edge-runtime.d.ts";

async function verifyShopifyHmac(secret: string, rawBody: string, hmacHeader: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === hmacHeader;
}

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
  const lineItems = order.line_items ?? [];
  for (const item of lineItems) {
    for (const attr of (item.properties ?? [])) {
      if (attr.name === "_celestialorderid") { celestialOrderId = attr.value; break; }
    }
    if (celestialOrderId) break;
  }
  if (!celestialOrderId) {
    console.warn("webhook: No _celestialorderid on order", order.id, "skipping");
    return new Response("ok", { status: 200 });
  }
  const customerName = [order.customer?.first_name ?? "", order.customer?.last_name ?? ""].join(" ").trim() || order.customer?.email || "Customer";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const prodigiKey = Deno.env.get("PRODIGI_API_KEY") ?? "";
  const prodigiSandbox = Deno.env.get("PRODIGI_SANDBOX") ?? "false";
  const fulfillPayload = { celestialOrderId, shopifyOrderId: String(order.id ?? ""), shopifyOrderNumber: String(order.order_number ?? order.name ?? ""), customerName, customerEmail: order.email ?? order.customer?.email ?? "", shippingAddress: order.shipping_address, lineItems, noteAttributes: order.note_attributes ?? [], prodigiKey, prodigiSandbox };
  EdgeRuntime.waitUntil(
    fetch(`${supabaseUrl}/functions/v1/fulfill-order`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` }, body: JSON.stringify(fulfillPayload) })
      .then(r => r.text().then(t => console.log("webhook: fulfill-order", r.status, t.substring(0, 100))))
      .catch(e => console.error("webhook: fulfill-order error", e.message))
  );
  return new Response("ok", { status: 200 });
});
