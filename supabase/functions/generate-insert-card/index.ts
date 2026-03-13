import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const W       = 1748;
const H       = 2480;
const PAD_X   = 120;
const PAD_TOP = 110;

// ── Brand fonts ────────────────────────────────────────────────────────────
// svg2png-wasm (resvg) needs TTF or OTF — NOT woff2.
// Fonts are hosted on public Supabase storage and cached after first fetch.
const FONT_URLS = [
  "https://kdfojrmzhpfphvgwgeov.supabase.co/storage/v1/object/public/fonts/Erode-Medium.otf",
  "https://kdfojrmzhpfphvgwgeov.supabase.co/storage/v1/object/public/fonts/TASAExplorer-Medium.ttf",
  "https://kdfojrmzhpfphvgwgeov.supabase.co/storage/v1/object/public/fonts/TASAExplorer-SemiBold.ttf",
  "https://kdfojrmzhpfphvgwgeov.supabase.co/storage/v1/object/public/fonts/TASAExplorer-Bold.ttf",
];

let cachedFonts: Uint8Array[] | null = null;
async function loadFonts(): Promise<Uint8Array[]> {
  if (cachedFonts) return cachedFonts;
  const fonts: Uint8Array[] = [];
  for (const url of FONT_URLS) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Font fetch failed: ${url} → ${resp.status}`);
    fonts.push(new Uint8Array(await resp.arrayBuffer()));
  }
  cachedFonts = fonts;
  console.log(`[fonts] Loaded ${fonts.length} brand fonts (${fonts.reduce((a, f) => a + f.byteLength, 0)} bytes)`);
  return fonts;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function safeExplanation(text: string): string {
  if (!text) return '';
  if (text.length <= 300) return text;
  return text.substring(0, 297).replace(/\s+\S*$/, '') + '…';
}

function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapLines(text: string, maxChars = 58): string[] {
  const words = (text || "").split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (test.length <= maxChars) { cur = test; }
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

// ── Request handler ─────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { orderId, customerName, birthDate, birthTime, birthPlace, artworkAnalysis } = body;

    if (!orderId || !artworkAnalysis) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: orderId, artworkAnalysis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[generate-insert-card] orderId=${orderId}, name="${customerName}"`);

    const fonts = await loadFonts();

    const svgContent = buildInsertCardSVG({
      customerName: customerName || "Your",
      birthDate:    birthDate    || "",
      birthTime:    birthTime    || "",
      birthPlace:   birthPlace   || "",
      artworkAnalysis,
    });

    // SVG → PNG with brand fonts registered in the resvg renderer
    const { svg2png, initialize } = await import("https://esm.sh/svg2png-wasm@1.4.1");
    const wasmResp = await fetch("https://esm.sh/svg2png-wasm@1.4.1/svg2png_wasm_bg.wasm");
    await initialize(await wasmResp.arrayBuffer());
    const pngBuffer = await svg2png(svgContent, { width: W, height: H, fonts });

    console.log(`[generate-insert-card] PNG: ${pngBuffer.byteLength} bytes`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const fileName = `inserts/${orderId}.png`;
    const { error: uploadError } = await supabase.storage
      .from("insert-cards")
      .upload(fileName, pngBuffer, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({ success: false, error: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from("insert-cards")
      .getPublicUrl(fileName);

    await supabase.from("orders").update({ insert_card_url: publicUrl }).eq("id", orderId);

    console.log(`[generate-insert-card] ✅ ${publicUrl}`);

    return new Response(
      JSON.stringify({ success: true, insertCardUrl: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("generate-insert-card error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── SVG Builder ─────────────────────────────────────────────────────────────

interface ArtworkSection { label?: string; title?: string; explanation?: string; artworkElement?: string; }
interface InsertCardData {
  customerName: string; birthDate: string; birthTime: string; birthPlace: string;
  artworkAnalysis: { sun?: ArtworkSection; moon?: ArtworkSection; rising?: ArtworkSection; element?: ArtworkSection; };
}

function gradientRule(y: number): string {
  return `<rect x="${PAD_X}" y="${y}" width="${W - PAD_X * 2}" height="2" fill="url(#rule-grad)" opacity="0.20"/>`;
}

function buildInsertCardSVG(data: InsertCardData): string {
  const { customerName, birthDate, birthTime, birthPlace, artworkAnalysis } = data;

  const sections: ArtworkSection[] = [
    artworkAnalysis.sun    || {},
    artworkAnalysis.moon   || {},
    artworkAnalysis.rising || {},
    artworkAnalysis.element|| {},
  ];

  // Brand font families — matched to the registered TTF/OTF files
  const ERODE = "'Erode', Georgia, serif";
  const TASA  = "'TASA Explorer', Arial, sans-serif";

  // Font sizes (from the v12 Python mockup spec)
  const FS_TITLE  = 102;  // Erode Medium — title
  const FS_META   = 37;   // TASA Explorer Bold — birth data
  const FS_LABEL  = 37;   // TASA Explorer SemiBold — placement labels
  const FS_STITLE = 61;   // TASA Explorer Medium — artwork element titles
  const FS_BODY   = 49;   // Erode Medium — explanation paragraphs
  const FS_FOOTER = 41;   // TASA Explorer Medium — URL
  const BODY_LH   = 67;   // body line-height

  let y = PAD_TOP;
  let els = "";

  const defs = `
  <defs>
    <linearGradient id="rule-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="40%" stop-color="#2C2C2C" stop-opacity="1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.5"/>
    </radialGradient>
  </defs>`;

  // ── Title: Erode Medium 102px ──
  const CAP_TITLE = 63;
  y += CAP_TITLE;
  els += `<text x="${PAD_X}" y="${y}" font-family="${ERODE}" font-size="${FS_TITLE}" font-weight="500" fill="#FFFFFF" letter-spacing="-3">${esc(customerName)}'s Cosmic Blueprint</text>\n`;

  // ── Meta row: TASA Explorer Bold 37px ──
  const CAP_META = 26;
  y += 60 + CAP_META;
  const metaParts = [birthDate, birthTime, birthPlace].filter(Boolean);
  const metaText  = metaParts.join("   |   ").toUpperCase();
  els += `<text x="${PAD_X}" y="${y}" font-family="${TASA}" font-size="${FS_META}" font-weight="700" fill="#FFFFFF" letter-spacing="1">${esc(metaText)}</text>\n`;

  // ── Section cards ──
  const CAP_LABEL  = 26;
  const CAP_STITLE = 43;
  const CAP_BODY   = 35;
  y += 100;

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];

    // Divider before cards 2–4
    if (i > 0) {
      y += 63;
      els += gradientRule(y) + "\n";
      y += 2 + 38;
    }

    // Label: TASA Explorer SemiBold
    const label = (sec.label || "").toUpperCase();
    y += CAP_LABEL;
    els += `<text x="${PAD_X}" y="${y}" font-family="${TASA}" font-size="${FS_LABEL}" font-weight="600" fill="#FFFFFF" letter-spacing="1">${esc(label)}</text>\n`;

    // Section title: TASA Explorer Medium — split "The " (regular) + rest (semibold)
    y += 28 + CAP_STITLE;
    const titleText = sec.title || sec.artworkElement || "";
    const titleMatch = titleText.match(/^(The )(.+)$/);
    const titleSvg = titleMatch
      ? `<tspan font-weight="400">${esc(titleMatch[1])}</tspan><tspan font-weight="600">${esc(titleMatch[2])}</tspan>`
      : `<tspan font-weight="600">${esc(titleText)}</tspan>`;
    els += `<text x="${PAD_X}" y="${y}" font-family="${TASA}" font-size="${FS_STITLE}" fill="#FFFFFF" letter-spacing="-1">${titleSvg}</text>\n`;

    // Body: Erode Medium
    y += 55 + CAP_BODY;
    const bodyText = safeExplanation(sec.explanation || "");
    const lines = wrapLines(bodyText, 58);
    for (let j = 0; j < lines.length; j++) {
      if (j > 0) y += BODY_LH;
      els += `<text x="${PAD_X}" y="${y}" font-family="${ERODE}" font-size="${FS_BODY}" font-weight="500" fill="#CCCCCC">${esc(lines[j])}</text>\n`;
    }
    y += CAP_BODY;
  }

  // ── Footer ──
  const LOGO_H  = 83;
  const LOGO_W  = 539;
  const footerY = H - 90 - LOGO_H;

  // Union logo mark + wordmark (right-aligned)
  els += `<g transform="translate(${W - PAD_X - LOGO_W}, ${footerY})">
    <path d="M48.8936 49.0107C49.1239 48.9337 49.3784 49.0026 49.5381 49.1855L64.6641 66.5469C64.8995 66.8171 64.8481 67.2331 64.5537 67.4375C63.6286 68.0788 62.7278 68.7029 61.8272 69.3262C56.022 73.3433 44.5031 81.253 42.3711 82.7168C42.1642 82.8589 41.8922 82.8577 41.6865 82.7139C41.1837 82.3618 40.2441 81.7051 39.6963 81.3291C34.7659 77.9453 25.372 71.4838 23.0274 69.8711C22.7358 69.6705 22.6761 69.2731 22.9024 69.001C24.9725 66.514 34.2732 55.3392 39.375 49.21C39.53 49.0241 39.7782 48.9543 40.0098 49.0244C40.7659 49.2532 41.4898 49.4689 42.2051 49.708C42.3012 49.7409 42.3842 49.9447 42.3965 50.0762C42.5582 51.8155 42.7076 53.5564 42.8574 55.2969C43.1633 58.849 43.4666 62.402 43.7725 65.9541C43.9248 67.7231 44.08 69.492 44.2344 71.2607C44.2431 71.3608 44.2532 71.461 44.2637 71.5635C44.276 71.6838 44.383 71.7762 44.5039 71.7764C44.626 71.7762 44.723 71.6822 44.7334 71.5605C45.3323 64.4182 45.9301 57.29 46.5254 50.1895C46.5456 49.9503 46.7061 49.7454 46.9336 49.6689C47.5837 49.4505 48.226 49.235 48.8936 49.0107ZM78.0879 28.9521C78.4044 28.8316 78.7573 28.9907 78.8692 29.3105C81.6999 37.407 86.8137 52.0146 87.752 54.6943C87.841 54.9486 87.7488 55.2291 87.5283 55.3838L68.7442 68.5391C68.4709 68.7304 68.1 68.6717 67.9102 68.3975C66.1136 65.802 57.5959 53.4966 52.9346 46.7627C52.7932 46.5582 52.7954 46.293 52.9346 46.0869C53.341 45.4853 53.7355 44.8963 54.1514 44.3232C54.2187 44.2312 54.4518 44.1953 54.5869 44.2256C57.2374 44.8186 59.8855 45.4239 62.5332 46.0293C67.3271 47.1254 72.1212 48.223 76.9151 49.3193C76.9162 49.3196 76.9178 49.3201 76.919 49.3203C77.026 49.3437 77.127 49.2832 77.1631 49.1797C77.2035 49.063 77.1497 48.9221 77.0352 48.876C76.1729 48.5304 75.327 48.1911 74.4815 47.8525C68.542 45.474 62.6018 43.0962 56.6631 40.7158C56.295 40.5683 55.796 40.4932 55.6113 40.2158C55.4396 39.9577 55.6151 39.4743 55.6221 39.0898C55.6287 38.7197 55.6275 38.3488 55.626 37.96C55.6251 37.7107 55.7789 37.4865 56.0117 37.3975C63.318 34.6023 70.6773 31.7872 78.0879 28.9521ZM6.92385 28.1807C7.02903 27.8526 7.37603 27.6778 7.69826 27.7998C10.7597 28.9586 25.1368 34.4009 32.9746 37.3857C33.2077 37.4746 33.3558 37.6968 33.3545 37.9463C33.3506 38.6668 33.3407 39.3508 33.3672 40.0332C33.3776 40.301 33.2368 40.3411 33.0645 40.4111C30.6829 41.3795 28.3029 42.3549 25.919 43.3174C21.2704 45.1941 16.6187 47.0642 11.9688 48.9375C11.9631 48.9398 11.9568 48.9429 11.9512 48.9453C11.8372 48.9939 11.7848 49.1277 11.8242 49.2451C11.8262 49.2509 11.8282 49.2569 11.8301 49.2627C11.8576 49.3443 11.9327 49.4266 12.0166 49.4072C18.8263 47.8326 25.6361 46.2562 32.4453 44.6797C33.0997 44.5282 33.7528 44.3663 34.4102 44.2295C34.5198 44.2071 34.7058 44.2483 34.7627 44.3271C35.1773 44.9042 35.5769 45.4924 35.9873 46.0937C36.1251 46.2956 36.1275 46.5615 35.9932 46.7656C31.8642 53.0201 27.7102 59.3125 23.541 65.6279C23.355 65.9093 22.9785 65.9859 22.7012 65.7939C15.5305 60.8274 2.61633 51.8593 0.256854 50.2207C0.034189 50.0661-0.0550228 49.7833 0.0341975 49.5273C0.120765 49.2793 0.2236 48.9814 0.283221 48.7988C2.28357 42.6722 6.03479 30.9587 6.92385 28.1807ZM73.2949 3.3291C73.5533 3.32915 73.783 3.49429 73.8653 3.73926C76.2775 10.9355 78.7278 18.5291 81.1494 25.7295C81.2596 26.0572 81.0714 26.4106 80.7383 26.5029C79.9661 26.7163 79.1974 26.9305 78.4268 27.1357C71.6752 28.934 64.9219 30.7284 58.1699 32.5254C56.9689 32.845 55.7667 33.1623 54.5694 33.4951C54.3129 33.5664 54.1762 33.5348 54.0176 33.29C53.6735 32.7588 53.2942 32.2498 52.8945 31.7002C52.7522 31.5042 52.7433 31.2415 52.8701 31.0352C54.6042 28.2151 56.374 25.3377 58.1563 22.4346C60.3597 18.8483 62.5496 15.2881 64.7559 11.7021C64.8169 11.6023 64.8023 11.4785 64.711 11.4053C64.6132 11.3271 64.4627 11.334 64.3809 11.4287C63.8212 12.0811 63.2735 12.72 62.7256 13.3574C58.3385 18.461 53.9482 23.5624 49.5703 28.6738C49.3398 28.943 49.1818 28.958 48.8594 28.8291C48.2412 28.5819 47.6011 28.3879 46.9424 28.1777C46.7073 28.1026 46.5436 27.89 46.5293 27.6436C46.0711 19.7456 45.6107 11.8031 45.1465 3.80273C45.132 3.5505 45.3324 3.33721 45.585 3.33691C54.6506 3.33507 64.2137 3.3338 73.2949 3.3291ZM43.1973 0.00488265C43.5415 0.00514814 43.8126 0.293887 43.7949 0.637695C43.325 9.66613 42.8563 18.6662 42.3906 27.6123C42.3781 27.8533 42.2226 28.0642 41.9961 28.1475C41.243 28.4235 40.522 28.6905 39.793 28.9307C39.6937 28.9632 39.4933 28.8216 39.3965 28.7109C37.8323 26.9216 36.2723 25.1283 34.7217 23.3271C31.3308 19.3884 27.9452 15.4445 24.5576 11.5029C24.5471 11.4907 24.5366 11.478 24.5254 11.4658C24.448 11.3811 24.3201 11.366 24.2246 11.4297C24.1202 11.4998 24.0875 11.6418 24.1533 11.749C28.1274 18.205 32.0924 24.6466 36.043 31.0645C36.1718 31.2737 36.1607 31.5408 36.0147 31.7383C35.6503 32.2303 35.288 32.7184 34.9072 33.2324C34.7608 33.4301 34.5084 33.5185 34.2705 33.4561C26.6718 31.4572 19.0054 29.441 11.3223 27.4199C10.9878 27.3319 10.7962 26.9803 10.9033 26.6514C11.9666 23.3859 13.0186 20.163 14.0635 16.9385C15.6538 12.0304 18.719 2.50022 19.3906 0.411133C19.4708 0.162437 19.6977-7.65626e-05 19.959-1.66597e-07C22.5473 0.000756502 36.0044 0.00465931 43.1973 0.00488265Z"
      fill="#BEBEBE"/>
    <text x="95" y="62" font-family="${TASA}" font-size="52" font-weight="600" fill="#BEBEBE" letter-spacing="-1">Celestial Artworks</text>
  </g>\n`;

  // URL (left-aligned)
  els += `<text x="${PAD_X}" y="${footerY + 57}" font-family="${TASA}" font-size="${FS_FOOTER}" font-weight="500" fill="#BEBEBE">CelestialArtworks.com</text>\n`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs}
  <rect width="${W}" height="${H}" fill="#1E1E1E"/>
  <rect width="${W}" height="${H}" fill="#2C2C2C"/>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  ${els}
</svg>`;
}