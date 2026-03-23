import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VARIATION_MAP: Record<string, number> = {
  "12x16": 12,
  "18x24": 13,
  "24x32": 14,
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
    } = await req.json();

    const variationId = VARIATION_MAP[variantSize];
    if (!variationId) {
      return new Response(
        JSON.stringify({ error: `Invalid variantSize: ${variantSize}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const WC_STORE_URL = Deno.env.get("WC_STORE_URL")!;
    const WC_CONSUMER_KEY = Deno.env.get("WC_CONSUMER_KEY")!;
    const WC_CONSUMER_SECRET = Deno.env.get("WC_CONSUMER_SECRET")!;

    const billingEmail = customerEmail?.trim() || "guest@celestialartworks.com";
    const nameParts = (customerName || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const orderPayload = {
      payment_method: "stripe",
      payment_method_title: "Credit Card (Stripe)",
      set_paid: false,
      status: "pending",
      billing: {
        email: billingEmail,
        first_name: firstName,
        last_name: lastName,
      },
      line_items: [
        { product_id: PRODUCT_ID, variation_id: variationId, quantity: 1 },
      ],
      meta_data: [
        { key: "_celestial_order_id", value: celestialOrderId || "" },
        { key: "_funnel_type", value: "canvas" },
        { key: "_artwork_url", value: artworkImageUrl || "" },
        { key: "_style_id", value: styleId || "" },
        { key: "_sun_sign", value: chartData?.sun?.sign || "" },
        { key: "_moon_sign", value: chartData?.moon?.sign || "" },
        { key: "_rising_sign", value: chartData?.rising || "" },
        { key: "_dt_id", value: dtId || "" },
      ],
    };

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
    console.error("❌ WooCommerce checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
