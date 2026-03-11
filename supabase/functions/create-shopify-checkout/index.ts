import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VARIANT_ENV_MAP: Record<string, string> = {
  "12x18": "SHOPIFY_VARIANT_12X18",
  "16x24": "SHOPIFY_VARIANT_16X24",
  "20x30": "SHOPIFY_VARIANT_20X30",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const storeDomain = Deno.env.get("SHOPIFY_STORE_DOMAIN");
    const storefrontToken = Deno.env.get("SHOPIFY_STOREFRONT_ACCESS_TOKEN");
    if (!storeDomain || !storefrontToken) {
      throw new Error("Shopify configuration is missing");
    }

    const { orderDetails, chartData, artworkImageUrl, customerName, artworkId, celestialOrderId, affiliate_dt_id } = await req.json();

    if (!orderDetails || !orderDetails.total) {
      throw new Error("Missing order details");
    }

    const sizeKey = orderDetails.size;
    const envVarName = VARIANT_ENV_MAP[sizeKey];
    if (!envVarName) { throw new Error(`Unknown size: ${sizeKey}`); }
    const variantId = Deno.env.get(envVarName);
    if (!variantId) { throw new Error(`Variant ID not configured for size ${sizeKey}`); }

    const merchandiseId = variantId.startsWith("gid://")
      ? variantId
      : `gid://shopify/ProductVariant/${variantId}`;

    const attributes = [
      { key: "artwork_url", value: artworkImageUrl || "" },
      { key: "artwork_id", value: artworkId || "" },
      { key: "customer_name", value: customerName || "" },
      { key: "sun_sign", value: chartData?.sun?.sign || "" },
      { key: "moon_sign", value: chartData?.moon?.sign || "" },
      { key: "rising_sign", value: chartData?.rising || "" },
      { key: "canvas_size", value: orderDetails.size || "" },
      { key: "size_label", value: orderDetails.sizeLabel || "" },
    ];

    const note = [
      `Celestial Artwork for ${customerName || "customer"}`,
      `Sun: ${chartData?.sun?.sign || "N/A"}`,
      `Moon: ${chartData?.moon?.sign || "N/A"}`,
      `Rising: ${chartData?.rising || "N/A"}`,
      `Size: ${orderDetails.sizeLabel || orderDetails.size}`,
    ].join(" | ");

    const mutation = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart { id checkoutUrl }
          userErrors { field message }
        }
      }
    `;

    // Build line item custom attributes (underscore prefix hides from customer receipt)
    const lineAttributes = [
      { key: "_celestial_order_id", value: celestialOrderId || "" },
    ];

    const variables = {
      input: {
        lines: [{
          merchandiseId,
          quantity: 1,
          attributes: lineAttributes,
        }],
        attributes,
        note,
      },
    };

    const shopifyResponse = await fetch(
      `https://${storeDomain}/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": storefrontToken,
        },
        body: JSON.stringify({ query: mutation, variables }),
      }
    );

    if (!shopifyResponse.ok) {
      const text = await shopifyResponse.text();
      throw new Error(`Shopify API error (${shopifyResponse.status}): ${text}`);
    }

    const result = await shopifyResponse.json();
    const userErrors = result.data?.cartCreate?.userErrors;
    if (userErrors && userErrors.length > 0) {
      throw new Error(`Shopify cart error: ${userErrors.map((e: any) => e.message).join(", ")}`);
    }

    const checkoutUrl = result.data?.cartCreate?.cart?.checkoutUrl;
    if (!checkoutUrl) { throw new Error("No checkout URL returned from Shopify"); }

    return new Response(JSON.stringify({ url: checkoutUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Shopify checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
