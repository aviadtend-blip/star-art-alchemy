import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { orderDetails, chartData, email } = await req.json();

    if (!orderDetails || !orderDetails.total) {
      throw new Error("Missing order details");
    }

    // Build line item description
    const description = [
      `Birth Chart Artwork — ${chartData?.sun?.sign || 'Custom'} Sun`,
      orderDetails.sizeLabel || orderDetails.size,
      orderDetails.frameName,
      orderDetails.addMatBoard ? 'White Mat Board' : null,
      orderDetails.addCustomText ? `Custom Text: "${orderDetails.customText}"` : null,
    ].filter(Boolean).join(' • ');

    const session = await stripe.checkout.sessions.create({
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Birth Chart Artwork',
              description,
              images: [],
            },
            unit_amount: Math.round(orderDetails.total * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'],
      },
      metadata: {
        size: orderDetails.size || '',
        frame: orderDetails.frame || '',
        addMatBoard: String(orderDetails.addMatBoard || false),
        addCustomText: String(orderDetails.addCustomText || false),
        customText: orderDetails.customText || '',
        sunSign: chartData?.sun?.sign || '',
        moonSign: chartData?.moon?.sign || '',
        rising: chartData?.rising || '',
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
