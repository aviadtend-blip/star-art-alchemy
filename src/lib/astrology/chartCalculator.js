// Natal chart calculator
// TODO: Replace mock data with real ephemeris API call when backend is connected

/**
 * Calculates a natal chart from birth data.
 * Currently returns mock data — will be replaced with a real backend API call.
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

    // Format payload for future API call
    const payload = {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour ?? 12),
      minute: Number(minute ?? 0),
      city,
      nation,
    };

    console.log("[chartCalculator] Prepared API payload:", payload);

    // TODO: Replace with actual API call, e.g.:
    // const response = await fetch('/api/natal-chart', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload),
    // });
    // return await response.json();

    // --- MOCK DATA (remove when API is connected) ---
    await new Promise((resolve) => setTimeout(resolve, 1200));

    return {
      sun: { sign: "Leo", house: 5, degree: 15 },
      moon: { sign: "Pisces", house: 12, degree: 22 },
      rising: "Virgo",
      venus: { sign: "Libra", house: 7 },
      mars: { sign: "Capricorn", house: 10 },
      mercury: { sign: "Leo", house: 5 },
      jupiter: { sign: "Sagittarius", house: 9 },
      element_balance: { Fire: 3, Water: 4, Earth: 2, Air: 1 },
      aspects: [],
    };
  } catch (error) {
    console.error("[chartCalculator] Failed to calculate natal chart:", error);
    throw error;
  }
}
