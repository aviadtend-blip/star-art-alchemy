import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VARIATION_MAP: Record<string, number> = {
  standard: 16,
  high_resolution: 17,
};

const PRODUCT_ID = 15;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      resolution,
      customerEmail,
      styleId,
      chartData,
      artworkImageUrl,
      celestialOrderId,
      dtId,
    } = await req.json();

    const variationId = VARIATION_MAP[resolution] ?? 17;

    const WC_STORE_URL = Deno.env.get("WC_STORE_URL")!;
    const WC_CONSUMER_KEY = Deno.env.get("WC_CONSUMER_KEY")!;
    const WC_CONSUMER_SECRET = Deno.env.get("WC_CONSUMER_SECRET")!;

    const billingEmail = customerEmail?.trim() || "guest@celestialartworks.com";

    const metaData = [
      { key: "celestial_order_id", value: String(celestialOrderId || "") },
      { key: "funnel_type", value: "digital" },
      { key: "artwork_url", value: String(artworkImageUrl || "") },
      { key: "style_id", value: String(styleId || "") },
      { key: "resolution", value: String(resolution || "") },
      { key: "sun_sign", value: String(chartData?.sun?.sign || "") },
      { key: "moon_sign", value: String(chartData?.moon?.sign || "") },
      { key: "rising_sign", value: String(chartData?.rising || "") },
      { key: "dt_id", value: String(dtId || "") },
    ];

    const orderPayload = {
      payment_method: "stripe",
      payment_method_title: "Credit Card (Stripe)",
      set_paid: false,
      status: "pending",
      billing: { email: billingEmail },
      line_items: [
        { product_id: PRODUCT_ID, variation_id: variationId, quantity: 1 },
      ],
      meta_data: metaData,
    };

    console.log("[create-woocommerce-digital-checkout] Full payload:", JSON.stringify(orderPayload, null, 2));

    const basicAuth = btoa(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`);

    const wcResponse = await fetch(
      `${WC_STORE_URL}/wp-json/wc/v3/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify(orderPayload),
      }
    );

    if (!wcResponse.ok) {
      const errText = await wcResponse.text();
      throw new Error(`WooCommerce API error (${wcResponse.status}): ${errText}`);
    }

    const wcData = await wcResponse.json();
    const orderId = wcData.id;

    let checkoutPaymentUrl = wcData.checkout_payment_url;
    if (!checkoutPaymentUrl) {
      const orderKey = wcData.order_key;
      checkoutPaymentUrl = `${WC_STORE_URL}/checkout/order-pay/${orderId}/?pay_for_order=true&key=${orderKey}`;
    }

    return new Response(
      JSON.stringify({ url: checkoutPaymentUrl, orderId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ WooCommerce digital checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
