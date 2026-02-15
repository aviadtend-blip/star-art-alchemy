// Chart calculator - will call backend API for ephemeris calculations
// Placeholder implementation with mock data

export interface BirthData {
  name: string;
  date: string;
  time: string;
  location: string;
}

export interface ChartData {
  sunSign: string;
  moonSign: string;
  risingSign: string;
  planets: Record<string, { sign: string; house: number; degree: number }>;
  dominantElement: string;
  aspects: Array<{ planet1: string; planet2: string; type: string; angle: number }>;
}

export async function calculateChart(birthData: BirthData): Promise<ChartData> {
  // TODO: Replace with real ephemeris API call
  // This is a placeholder that returns mock chart data
  console.log("Calculating chart for:", birthData);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        sunSign: "leo",
        moonSign: "pisces",
        risingSign: "scorpio",
        planets: {
          sun: { sign: "leo", house: 10, degree: 15 },
          moon: { sign: "pisces", house: 4, degree: 22 },
          mercury: { sign: "virgo", house: 11, degree: 3 },
          venus: { sign: "cancer", house: 9, degree: 28 },
          mars: { sign: "aries", house: 5, degree: 11 },
          jupiter: { sign: "sagittarius", house: 2, degree: 7 },
          saturn: { sign: "capricorn", house: 3, degree: 19 },
        },
        dominantElement: "fire",
        aspects: [
          { planet1: "sun", planet2: "mars", type: "trine", angle: 120 },
          { planet1: "moon", planet2: "venus", type: "sextile", angle: 60 },
          { planet1: "saturn", planet2: "jupiter", type: "conjunction", angle: 0 },
        ],
      });
    }, 1500);
  });
}
