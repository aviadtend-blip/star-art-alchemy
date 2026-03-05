import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { cdnUrl, chartData, formData, artStyle, promptUsed, artworkAnalysis, sessionId, taskId } =
      await req.json();

    if (!cdnUrl) {
      throw new Error("Missing cdnUrl");
    }

    console.log(`[store-artwork] Downloading image from CDN: ${cdnUrl.substring(0, 80)}...`);

    // Download image from CDN
    const imageResponse = await fetch(cdnUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from CDN: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/png";
    const extension = contentType.includes("webp") ? "webp" : contentType.includes("jpeg") ? "jpg" : "png";

    // Generate unique filename
    const artworkId = crypto.randomUUID();
    const filePath = `${artworkId}.${extension}`;

    console.log(`[store-artwork] Uploading to storage: artworks/${filePath} (${imageBuffer.byteLength} bytes)`);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("artworks")
      .upload(filePath, imageBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("[store-artwork] Upload error:", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get permanent public URL
    const { data: urlData } = supabase.storage
      .from("artworks")
      .getPublicUrl(filePath);

    const permanentUrl = urlData?.publicUrl;
    if (!permanentUrl) {
      throw new Error("Failed to get public URL for uploaded artwork");
    }

    console.log(`[store-artwork] Permanent URL: ${permanentUrl}`);

    // Build birth_data JSONB from formData
    const birthData = formData
      ? {
          name: formData.name || "",
          year: formData.year,
          month: formData.month,
          day: formData.day,
          hour: formData.hour ?? 12,
          minute: formData.minute ?? 0,
          city: formData.city || "",
          nation: formData.nation || "US",
        }
      : {};

    // Insert record into artworks table
    const { data: insertData, error: insertError } = await supabase
      .from("artworks")
      .insert({
        id: artworkId,
        customer_name: formData?.name || null,
        birth_data: birthData,
        chart_data: chartData || {},
        artwork_url: permanentUrl,
        original_cdn_url: cdnUrl,
        art_style: artStyle || "",
        prompt_used: promptUsed || null,
        artwork_analysis: artworkAnalysis || null,
        session_id: sessionId || null,
        apiframe_task_id: taskId || null,
        status: "generated",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[store-artwork] Insert error:", insertError);
      // Image is already stored, so don't fail completely
      console.warn("[store-artwork] Image stored but DB insert failed, returning URL anyway");
    }

    console.log(`[store-artwork] Success: artworkId=${artworkId}`);

    return new Response(
      JSON.stringify({
        artworkId,
        permanentUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[store-artwork] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
