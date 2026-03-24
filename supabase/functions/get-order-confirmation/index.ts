import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { celestial_order_id, wc_order_id } = await req.json();

    if (!celestial_order_id && !wc_order_id) {
      return new Response(JSON.stringify({ error: "celestial_order_id or wc_order_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    const columns = "id, generated_image_url, chart_data, canvas_size, customer_email, fulfillment_type, artwork_analysis, shopify_order_number, digital_download_url";

    let orderRow: any = null;

    if (celestial_order_id) {
      const { data, error } = await supabase
        .from("orders")
        .select(columns)
        .eq("id", celestial_order_id)
        .maybeSingle();
      if (error) console.error("get-order-confirmation: lookup by id error:", error.message);
      orderRow = data;
    }

    if (!orderRow && wc_order_id) {
      const { data, error } = await supabase
        .from("orders")
        .select(columns)
        .eq("shopify_order_id", wc_order_id)
        .maybeSingle();
      if (error) console.error("get-order-confirmation: lookup by wc_order_id error:", error.message);
      orderRow = data;
    }

    if (!orderRow) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chartData = orderRow.chart_data || {};
    const response = {
      artwork_url: orderRow.generated_image_url || "",
      sun_sign: chartData?.sun?.sign || "",
      moon_sign: chartData?.moon?.sign || "",
      rising_sign: chartData?.rising || "",
      canvas_size: orderRow.canvas_size || "",
      fulfillment_type: orderRow.fulfillment_type || "",
      email: orderRow.customer_email || "",
      artwork_analysis: orderRow.artwork_analysis || null,
      order_number: orderRow.shopify_order_number || "",
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("get-order-confirmation error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
