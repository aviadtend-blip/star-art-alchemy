import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const CANVAS_SIZE_MAP: Record<string, { id: string; label: string; price: number }> = {
  "12x18": { id: "12x18", label: '12" × 18"', price: 79 },
  "16x24": { id: "16x24", label: '16" × 24"', price: 119 },
  "20x30": { id: "20x30", label: '20" × 30"', price: 179 },
};

function resolveCanvasSize({ size, sizeLabel }: { size?: string; sizeLabel?: string }) {
  if (size && CANVAS_SIZE_MAP[size]) return CANVAS_SIZE_MAP[size];
  if (sizeLabel) {
    const match = Object.values(CANVAS_SIZE_MAP).find((s) => s.label === sizeLabel);
    if (match) return match;
  }
  return null;
}

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

    const resolvedSize = resolveCanvasSize({
      size: orderDetails.size,
      sizeLabel: orderDetails.sizeLabel,
    });
    if (!resolvedSize) {
      throw new Error(
        `Unknown size. Received size=${JSON.stringify(orderDetails.size)} sizeLabel=${JSON.stringify(orderDetails.sizeLabel)}`
      );
    }

    const sizeKey = resolvedSize.id;
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
<<<<<<< Updated upstream
      { key: "canvas_size", value: (orderDetails.size || "").toLowerCase().replace(/\s/g, "") },
      { key: "size_label", value: orderDetails.sizeLabel || (orderDetails.size || "").toLowerCase().replace(/\s/g, "") },
=======
      { key: "canvas_size", value: resolvedSize.id },
      { key: "size_label", value: resolvedSize.label },
>>>>>>> Stashed changes
    ];

    // Add affiliate tracking as a cart attribute if present
    if (affiliate_dt_id) {
      attributes.push({ key: "dt_id", value: affiliate_dt_id });
    }

    const note = [
      `Celestial Artwork for ${customerName || "customer"}`,
      `Sun: ${chartData?.sun?.sign || "N/A"}`,
      `Moon: ${chartData?.moon?.sign || "N/A"}`,
      `Rising: ${chartData?.rising || "N/A"}`,
      `Size: ${resolvedSize.label}`,
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
    const canonicalSize = (orderDetails.size || "").toLowerCase().replace(/\s/g, "");
    const sizeLabel = orderDetails.sizeLabel || canonicalSize;
    const lineAttributes = [
<<<<<<< Updated upstream
      { key: "_celestialorderid", value: celestialOrderId || "" },
      { key: "canvas_size", value: canonicalSize },
      { key: "size_label", value: sizeLabel },
=======
      { key: "_celestial_order_id", value: celestialOrderId || "" },
      { key: "_canvas_size", value: resolvedSize.id },
      { key: "_size_label", value: resolvedSize.label },
>>>>>>> Stashed changes
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
