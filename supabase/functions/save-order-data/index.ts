import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      chartData,
      artworkAnalysis,
      generatedImageUrl,
      subjectExplanation,
      customerEmail,
      customerName,
      fulfillmentType,
    } = body;

    console.log("[save-order-data] Received fields:", {
      customerName,
      customerEmail,
      hasChartData: !!chartData,
      birth_date: chartData?.birth_date,
      birth_time: chartData?.birth_time,
      birth_place: chartData?.birth_place,
      customer_name_in_chart: chartData?.customer_name,
    });

    const resolvedEmail = customerEmail || "unknown";

    if (!generatedImageUrl) {
      throw new Error("Missing required field: generatedImageUrl");
    }

    // Ensure chart_data always contains birth details at top level
    const enrichedChartData = {
      ...(chartData || {}),
      customer_name: chartData?.customer_name || customerName || null,
      birth_date: chartData?.birth_date || null,
      birth_time: chartData?.birth_time || null,
      birth_place: chartData?.birth_place || null,
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const insertPayload: Record<string, any> = {
      customer_email: resolvedEmail,
      chart_data: enrichedChartData,
      artwork_analysis: artworkAnalysis || null,
      generated_image_url: generatedImageUrl,
      subject_explanation: subjectExplanation || null,
    };
    if (fulfillmentType) insertPayload.fulfillment_type = fulfillmentType;

    const { data, error } = await supabase
      .from("orders")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }

    console.log("[save-order-data] Stored order:", data.id, "with customer_name:", enrichedChartData.customer_name, "birth_date:", enrichedChartData.birth_date);

    return new Response(JSON.stringify({ success: true, orderId: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("save-order-data error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
