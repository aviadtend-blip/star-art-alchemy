// Natal chart calculator — calls the backend edge function

import { supabase } from "@/integrations/supabase/client";

/**
 * Calculates a natal chart from birth data using the Free Astrology API
 * via a backend function.
 *
 * @param {{ year: number, month: number, day: number, hour: number, minute: number, city: string, nation: string }} birthData
 * @returns {Promise<object>} Natal chart data
 */
export async function calculateNatalChart(birthData) {
  try {
    const { year, month, day, hour, minute, city, nation } = birthData;

    if (!year || !month || !day || !city || !nation) {
      throw new Error("Missing required birth data fields: year, month, day, city, and nation are required.");
    }

    const payload = {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour ?? 12),
      minute: Number(minute ?? 0),
      city,
      nation,
    };

    console.log("[chartCalculator] Calling natal chart API with:", payload);

    const { data, error } = await supabase.functions.invoke("calculate-natal-chart", {
      body: payload,
    });

    if (error) {
      console.error("[chartCalculator] Edge function error:", error);
      throw new Error(error.message || "Failed to calculate natal chart");
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    console.log("[chartCalculator] Chart received:", data);
    return data;
  } catch (error) {
    console.error("[chartCalculator] Failed to calculate natal chart:", error);
    throw error;
  }
}
