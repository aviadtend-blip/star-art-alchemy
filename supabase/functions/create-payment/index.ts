import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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

    const { orderDetails, chartData, email, artworkImageUrl, customerName } = await req.json();

    if (!orderDetails || !orderDetails.total) {
      throw new Error("Missing order details");
    }

    // Upload artwork to Supabase Storage for a permanent URL
    let permanentImageUrl = "";
    console.log('Received artworkImageUrl:', artworkImageUrl);
    if (artworkImageUrl) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const imageResponse = await fetch(artworkImageUrl);
        console.log('Image fetch status:', imageResponse.status, imageResponse.statusText);
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          const fileName = `checkout-thumbs/${crypto.randomUUID()}.png`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("demo-assets")
            .upload(fileName, imageBlob, { contentType: "image/png", upsert: false });

          console.log('Storage upload result:', JSON.stringify({ data: uploadData, error: uploadError }));

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("demo-assets").getPublicUrl(fileName);
            permanentImageUrl = urlData?.publicUrl || "";
          } else {
            console.error("Storage upload error:", uploadError.message);
          }
        }
      } catch (uploadErr) {
        console.error("Image upload failed, proceeding without thumbnail:", uploadErr.message);
      }
    }

    // Build dynamic product name with size
    const sizeLabel = orderDetails.sizeLabel || orderDetails.size || "";
    const productName = `Celestial Artwork — ${sizeLabel} Canvas`;

    // Build description
    const descParts = [
      customerName ? `Personalized birth chart artwork for ${customerName}` : "Personalized birth chart artwork",
      chartData?.sun?.sign ? `${chartData.sun.sign} Sun` : null,
    ].filter(Boolean);
    const description = descParts.join(" · ");

    const productImages = permanentImageUrl ? [permanentImageUrl] : [];
    console.log('productImages being sent to Stripe:', JSON.stringify(productImages));

    const session = await stripe.checkout.sessions.create({
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description,
              images: productImages,
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
