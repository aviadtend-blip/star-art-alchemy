import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Real WooCommerce variation mapping (queried from live API 2026-03-25):
 *
 *   Variation ID 12 → SKU CA-12x16 → Woo label "12x16" → price $79
 *   Variation ID 13 → SKU CA-18x24 → Woo label "18x24" → price $129
 *   Variation ID 14 → SKU CA-24x32 → Woo label "24x32" → price $199
 *
 * Our frontend uses canonical Prodigi sizes (12x18, 16x24, 20x30).
 * The SIZE_ALIASES normalize canonical → Woo size key.
 *
 * ⚠️  NOTE: The Woo product labels (12x16, 18x24, 24x32) do NOT match the
 * actual Prodigi fulfillment sizes (12x18, 16x24, 20x30). The Woo product
 * variations should ideally be renamed in WooCommerce admin to match Prodigi,
 * but until then this mapping bridges the gap.
 */

/** Woo size label → WooCommerce variation ID (matches live product 11) */
const VARIATION_MAP: Record<string, number> = {
  "12x16": 12,
  "18x24": 13,
  "24x32": 14,
};

/** Our canonical Prodigi sizes → Woo size keys */
const SIZE_ALIASES: Record<string, string> = {
  "12x18": "12x16",
  "16x24": "18x24",
  "20x30": "24x32",
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

    // Normalize canonical Prodigi sizes (12x18, 16x24, 20x30) → Woo size keys (12x16, 18x24, 24x32)
    // Also accepts Woo size keys directly (passthrough)
    const wooSize = SIZE_ALIASES[rawSize] || rawSize;

    const variationId = VARIATION_MAP[wooSize];
    if (!variationId) {
      return new Response(
        JSON.stringify({ error: `Invalid variantSize: ${rawSize} (wooSize: ${wooSize}). Valid canonical: ${Object.keys(SIZE_ALIASES).join(", ")}. Valid woo: ${Object.keys(VARIATION_MAP).join(", ")}` }),
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

    // canvas_size uses the canonical Prodigi size for fulfillment, not the Woo label
    const canonicalSize = rawSize;
    const sizeLabel = orderDetails?.sizeLabel || `${canonicalSize.replace("x", '" × "')}\"`;

    const metaParams: Record<string, string> = {
      celestial_order_id: celestialOrderId || "",
      artwork_id: artworkId || "",
      artwork_url: artworkImageUrl || "",
      customer_name: customerName || "",
      canvas_size: canonicalSize,
      size_label: sizeLabel,
      style_id: styleId || orderDetails?.styleId || "",
      sun_sign: chartData?.sun?.sign || "",
      moon_sign: chartData?.moon?.sign || "",
      rising_sign: chartData?.rising || "",
      funnel_type: "canvas",
    };

    const affiliateId = dtId || affiliate_dt_id || "";
    if (affiliateId) metaParams.dt_id = affiliateId;

    // Build URL: use variation_id directly as add-to-cart target
    // This is the official WooCommerce pattern for variable products
    // and avoids "Invalid value posted for Size" errors from attribute mismatches.
    // Point to /checkout/ so WooCommerce adds to cart then renders checkout,
    // instead of landing on the store root which shows "Nothing Found".
    const url = new URL(`${WC_STORE_URL}/checkout/`);
    url.searchParams.set("add-to-cart", String(variationId));
    url.searchParams.set("quantity", "1");

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
