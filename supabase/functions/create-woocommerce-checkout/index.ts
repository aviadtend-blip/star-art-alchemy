import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VARIATION_MAP: Record<string, number> = {
  "12x18": 12,
  "16x24": 13,
  "20x30": 14,
  // legacy aliases
  "12x16": 12,
  "18x24": 13,
  "24x32": 14,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      variantSize,
      celestialOrderId,
      orderDetails,
    } = await req.json();

    const resolvedSize =
      variantSize ||
      orderDetails?.size ||
      orderDetails?.sizeLabel?.toLowerCase().replace(/["×\s]/g, "").replace("x", "x");

    const variationId = VARIATION_MAP[resolvedSize];
    if (!variationId) {
      return new Response(
        JSON.stringify({ error: `Invalid variantSize: ${resolvedSize}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const WC_STORE_URL = Deno.env.get("WC_STORE_URL")!;

    // Build add-to-cart URL that lands on the full checkout page
    // (collects shipping address, contact info, and payment)
    // Metadata is already persisted in the orders table via save-order-data
    // and will be linked back via the woocommerce-order-webhook using _celestial_order_id
    const checkoutUrl = `${WC_STORE_URL}/?add-to-cart=${variationId}&quantity=1`;

    console.log("[create-woocommerce-checkout] Redirecting to cart checkout:", checkoutUrl, "celestialOrderId:", celestialOrderId);

    return new Response(
      JSON.stringify({ url: checkoutUrl }),
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
