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
    const SIZE_ALIASES: Record<string, string> = {
      "12x16": "12x18",
      "18x24": "16x24",
      "24x32": "20x30",
    };
    const resolvedSize = SIZE_ALIASES[rawSize] || rawSize;

    const variationId = VARIATION_MAP[resolvedSize];
    if (!variationId) {
      return new Response(
        JSON.stringify({ error: `Invalid variantSize: ${rawSize} (resolved: ${resolvedSize}). Valid sizes: ${Object.keys(VARIATION_MAP).join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const WC_STORE_URL = Deno.env.get("WC_STORE_URL")!;

    // For physical/canvas products, redirect to WooCommerce standard checkout
    // so the customer enters billing + shipping address before payment.
    // The add-to-cart URL adds the variation to the cart and loads checkout.
    const checkoutUrl = `${WC_STORE_URL}/checkout/?add-to-cart=${PRODUCT_ID}&variation_id=${variationId}&quantity=1`;

    console.log(`[create-woocommerce-checkout] celestialOrderId=${celestialOrderId} size=${resolvedSize} variationId=${variationId}`);
    console.log(`[create-woocommerce-checkout] Redirecting to standard checkout: ${checkoutUrl}`);

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
