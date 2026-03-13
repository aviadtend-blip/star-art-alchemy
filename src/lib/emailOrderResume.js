export const EMAIL_ORDER_RESUME_URL = "https://celestialartworks.com/generate/size";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function buildBirthDate(birthData, chartData) {
  if (chartData.birth_date) return String(chartData.birth_date);

  const year = birthData.year;
  const month = birthData.month;
  const day = birthData.day;
  if (!year || !month || !day) return "";

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildBirthTime(birthData, chartData) {
  if (chartData.birth_time) return String(chartData.birth_time);

  const hour = birthData.hour;
  const minute = birthData.minute;
  if (hour === undefined || hour === null || minute === undefined || minute === null) return "";

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function buildBirthPlace(birthData, chartData) {
  if (chartData.birth_place) return String(chartData.birth_place);

  const city = normalizeText(birthData.city);
  const nation = normalizeText(birthData.nation);
  if (!city) return "";

  return nation ? `${city}, ${nation}` : city;
}

function buildFirstName(customerName, fallbackFirstName) {
  const normalizedFirstName = normalizeText(fallbackFirstName);
  if (normalizedFirstName) return normalizedFirstName;

  const normalizedName = normalizeText(customerName);
  return normalizedName ? normalizedName.split(/\s+/)[0] : "";
}

export function buildEmailOrderResumeUrl({ artworkId, sessionId, fallbackUrl = "" }) {
  const params = new URLSearchParams();
  const normalizedArtworkId = normalizeText(artworkId);
  const normalizedSessionId = normalizeText(sessionId);

  if (normalizedArtworkId) params.set("artwork_id", normalizedArtworkId);
  if (normalizedSessionId) params.set("session_id", normalizedSessionId);

  if ([...params.keys()].length === 0) {
    return normalizeText(fallbackUrl);
  }

  return `${EMAIL_ORDER_RESUME_URL}?${params.toString()}`;
}

export function buildResumeSessionState({ artwork, capture }) {
  const artworkRow = normalizeObject(artwork);
  const captureRow = normalizeObject(capture);
  const chartData = normalizeObject(artworkRow.chart_data);
  const birthData = normalizeObject(artworkRow.birth_data);
  const customerName =
    normalizeText(artworkRow.customer_name) ||
    normalizeText(chartData.customer_name) ||
    normalizeText(birthData.name) ||
    normalizeText(captureRow.first_name);
  const birthDate = buildBirthDate(birthData, chartData);
  const birthTime = buildBirthTime(birthData, chartData);
  const birthPlace = buildBirthPlace(birthData, chartData);

  const restoredChartData = {
    ...chartData,
    sun: chartData.sun || { sign: normalizeText(captureRow.sun_sign) },
    moon: chartData.moon || { sign: normalizeText(captureRow.moon_sign) },
    rising: chartData.rising || normalizeText(captureRow.rising_sign),
    element_balance: chartData.element_balance ?? captureRow.element_balance ?? {},
    customer_name: chartData.customer_name || customerName || null,
    birth_date: birthDate || null,
    birth_time: birthTime || null,
    birth_place: birthPlace || null,
  };

  const formData = customerName || birthDate || birthTime || birthPlace
    ? {
        name: customerName || "",
        year: birthData.year ?? "",
        month: birthData.month ?? "",
        day: birthData.day ?? "",
        hour: birthData.hour ?? 12,
        minute: birthData.minute ?? 0,
        city: normalizeText(birthData.city),
        nation: normalizeText(birthData.nation) || "US",
        birthYear: birthData.year ?? "",
        birthMonth: birthData.month ?? "",
        birthDay: birthData.day ?? "",
        birthHour: birthData.hour ?? 12,
        birthMinute: birthData.minute ?? 0,
        birthCity: normalizeText(birthData.city),
        birthCountry: normalizeText(birthData.nation) || "US",
        date: birthDate || "",
        time: birthTime || "",
        location: birthPlace || "",
      }
    : null;

  const generatedImage =
    normalizeText(artworkRow.artwork_url) ||
    normalizeText(captureRow.artwork_url) ||
    normalizeText(captureRow.email_mockup_url);
  const artworkId = normalizeText(artworkRow.id) || normalizeText(captureRow.artwork_id);
  const sessionId = normalizeText(artworkRow.session_id) || normalizeText(captureRow.session_id);
  const capturedEmail = normalizeText(captureRow.email);
  const capturedFirstName = buildFirstName(customerName, captureRow.first_name);

  return {
    generatorState: {
      chartData: restoredChartData,
      formData,
      selectedStyle: null,
      generatedImage,
      orderDetails: null,
      artworkAnalysis: artworkRow.artwork_analysis ?? null,
      artworkId: artworkId || null,
      userPhotoUrl: null,
      isPortraitEdition: Boolean(artworkRow.is_portrait_edition),
      generationComplete: true,
    },
    birthDetails: {
      customerName: customerName || null,
      customerEmail: capturedEmail || null,
      birthDate: birthDate || null,
      birthTime: birthTime || null,
      birthPlace: birthPlace || null,
    },
    artworkId,
    sessionId,
    capturedEmail,
    capturedFirstName,
  };
}
