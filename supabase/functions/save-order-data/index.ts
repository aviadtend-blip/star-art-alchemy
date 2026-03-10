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
    const {
      chartData,
      artworkAnalysis,
      generatedImageUrl,
      subjectExplanation,
      customerEmail,
    } = await req.json();

    if (!customerEmail || !generatedImageUrl) {
      throw new Error("Missing required fields: customerEmail and generatedImageUrl");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_email: customerEmail,
        chart_data: chartData || {},
        artwork_analysis: artworkAnalysis || null,
        generated_image_url: generatedImageUrl,
        subject_explanation: subjectExplanation || null,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }

    return new Response(JSON.stringify({ orderId: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("save-order-data error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
