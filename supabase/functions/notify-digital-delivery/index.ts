import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { trackKlaviyoEvent } from "../_shared/klaviyoTrack.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractHotspots(artworkAnalysis: any): any[] | null {
  if (!artworkAnalysis) return null;
  const elements = artworkAnalysis.elements || artworkAnalysis.hotspots || [];
  if (!Array.isArray(elements) || elements.length === 0) return null;
  const emojiMap: Record<string, string> = { sun: "☀️", moon: "🌙", rising: "⬆️", element: "🔥" };
  return elements.slice(0, 4).map((el: any) => ({
    title: el.title || el.label || "",
    explanation: el.explanation || el.description || el.copy || "",
    emoji: el.emoji || emojiMap[el.key?.toLowerCase?.()] || "✨",
  }));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { celestialOrderId, downloadUrl, expiryDays, fallbackResolution } = body;

    if (!celestialOrderId) {
      return new Response(JSON.stringify({ error: "celestialOrderId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    // Look up the order
    const { data: orderRow, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", celestialOrderId)
      .maybeSingle();

    if (orderErr) {
      console.error("[notify-digital-delivery] DB error:", orderErr.message);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!orderRow) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerEmail = orderRow.customer_email;
    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "Order has no customer_email" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chartData = (orderRow.chart_data || {}) as any;
    const artworkUrl = downloadUrl || orderRow.digital_download_url || orderRow.generated_image_url || "";
    const hasUpscaled = !!(orderRow as any).upscaled_url;
    const resolvedArtworkUrl = (orderRow as any).upscaled_url || orderRow.generated_image_url || "";
    const resolution = hasUpscaled ? "high" : "standard";
    const customerName = chartData.customer_name || "there";
    const orderNumber = orderRow.shopify_order_number || orderRow.shopify_order_id || orderRow.id;
    const sunSign = chartData.sun?.sign || "";
    const moonSign = chartData.moon?.sign || "";
    const risingSign = chartData.rising || "";

    // Event 1: Digital Purchase Confirmed
    await trackKlaviyoEvent({
      email: customerEmail,
      metricName: "Digital Purchase Confirmed",
      firstName: customerName !== "there" ? customerName.split(" ")[0] : undefined,
      properties: {
        customer_name: customerName,
        order_number: orderNumber,
        artwork_url: resolvedArtworkUrl,
        resolution,
        sun_sign: sunSign,
        moon_sign: moonSign,
        rising_sign: risingSign,
      },
    });

    // Event 2: Digital File Ready
    const deliveryProps: Record<string, unknown> = {
      customer_name: customerName,
      order_number: orderNumber,
      artwork_url: resolvedArtworkUrl,
      resolution,
      sun_sign: sunSign,
      moon_sign: moonSign,
      rising_sign: risingSign,
      download_url: artworkUrl,
      expiry_days: expiryDays ?? 30,
    };

    if (fallbackResolution) {
      deliveryProps.fallback_resolution = true;
    }

    // Extract hotspots from artwork_analysis
    const hotspots = extractHotspots(orderRow.artwork_analysis);
    if (hotspots) {
      deliveryProps.hotspots = hotspots;
    }

    await trackKlaviyoEvent({
      email: customerEmail,
      metricName: "Digital File Ready",
      firstName: customerName !== "there" ? customerName.split(" ")[0] : undefined,
      properties: deliveryProps,
    });

    console.log(`[notify-digital-delivery] Both events sent for order ${celestialOrderId}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[notify-digital-delivery] Error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
