import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Canonical canvas sizes → WooCommerce variation IDs for Product 11.
 * Only canonical Prodigi sizes are allowed.
 */
const VARIATION_MAP: Record<string, number> = {
  "12x18": 12,
  "16x24": 13,
  "20x30": 14,
};

/** Legacy size aliases → canonical sizes */
const SIZE_ALIASES: Record<string, string> = {
  "12x16": "12x18",
  "18x24": "16x24",
  "24x32": "20x30",
};

/**
 * WooCommerce variation attribute values.
 * Must match the product's variation attribute slugs in WooCommerce admin.
 * The attribute taxonomy slug is "pa_size" (global) or "size" (custom).
 * We send both to cover either setup.
 */
const VARIATION_ATTRIBUTE: Record<string, string> = {
  "12x18": '12" x 18"',
  "16x24": '16" x 24"',
  "20x30": '20" x 30"',
};

const PRODUCT_ID = 11;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      variantSize,
      customerEmail,
      customerName,
      artworkImageUrl,
      chartData,
      celestialOrderId,
      dtId,
      styleId,
      artworkId,
      orderDetails,
      affiliate_dt_id,
    } = await req.json();

    const rawSize =
      variantSize ||
      orderDetails?.size ||
      orderDetails?.sizeLabel?.toLowerCase().replace(/["×\s]/g, "").replace("x", "x");

    // Normalize legacy sizes to canonical Prodigi sizes
    const resolvedSize = SIZE_ALIASES[rawSize] || rawSize;

    const variationId = VARIATION_MAP[resolvedSize];
    if (!variationId) {
      return new Response(
        JSON.stringify({ error: `Invalid variantSize: ${rawSize} (resolved: ${resolvedSize}). Valid: ${Object.keys(VARIATION_MAP).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const WC_STORE_URL = Deno.env.get("WC_STORE_URL")!;

    // ---- Build the checkout URL ----
    // Standard WooCommerce add-to-cart → checkout, so the customer fills in
    // real billing + shipping details before payment.
    //
    // Celestial metadata is passed as query parameters. A tiny WordPress
    // MU plugin (celestial-order-meta.php) captures them into cart item
    // data and copies them to order meta + line item meta at checkout.
    //
    // Query parameter names (must match the MU plugin's CELESTIAL_META_KEYS):
    //   celestial_order_id, artwork_id, artwork_url, customer_name,
    //   canvas_size, size_label, style_id, sun_sign, moon_sign,
    //   rising_sign, funnel_type

    const sizeLabel = orderDetails?.sizeLabel || `${resolvedSize.replace("x", '" × "')}\"`;

    const metaParams: Record<string, string> = {
      celestial_order_id: celestialOrderId || "",
      artwork_id: artworkId || "",
      artwork_url: artworkImageUrl || "",
      customer_name: customerName || "",
      canvas_size: resolvedSize,
      size_label: sizeLabel,
      style_id: styleId || orderDetails?.styleId || "",
      sun_sign: chartData?.sun?.sign || "",
      moon_sign: chartData?.moon?.sign || "",
      rising_sign: chartData?.rising || "",
      funnel_type: "canvas",
    };

    const affiliateId = dtId || affiliate_dt_id || "";
    if (affiliateId) metaParams.dt_id = affiliateId;

    // Build URL with add-to-cart params + Celestial metadata
    const url = new URL(`${WC_STORE_URL}/`);
    url.searchParams.set("add-to-cart", String(PRODUCT_ID));
    url.searchParams.set("variation_id", String(variationId));
    url.searchParams.set("quantity", "1");

    // Include variation attribute so WooCommerce reliably resolves the variation
    const attrLabel = VARIATION_ATTRIBUTE[resolvedSize];
    if (attrLabel) {
      // Try both global taxonomy (pa_size) and custom attribute (size)
      url.searchParams.set("attribute_pa_size", attrLabel);
      url.searchParams.set("attribute_size", attrLabel);
    }

    // Append Celestial metadata params
    for (const [key, value] of Object.entries(metaParams)) {
      if (value) url.searchParams.set(key, value);
    }

    const checkoutUrl = url.toString();

    console.log(`[create-woocommerce-checkout] celestialOrderId=${celestialOrderId}`);
    console.log(`[create-woocommerce-checkout] size=${resolvedSize} variationId=${variationId}`);
    console.log(`[create-woocommerce-checkout] metadata: ${JSON.stringify(metaParams)}`);
    console.log(`[create-woocommerce-checkout] checkout URL: ${checkoutUrl}`);

    return new Response(
      JSON.stringify({ url: checkoutUrl, orderId: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ WooCommerce checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
