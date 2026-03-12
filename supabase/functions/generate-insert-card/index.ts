import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length + word.length + 1 > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function buildInsertCardSvg(data: {
  customerName: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  artworkAnalysis: {
    sun: { label: string; title: string; explanation: string };
    moon: { label: string; title: string; explanation: string };
    rising: { label: string; title: string; explanation: string };
    element: { label: string; title: string; explanation: string };
  };
}): string {
  const W = 1748;
  const H = 2480;
  const PAD = 120;
  const { customerName, birthDate, birthTime, birthPlace, artworkAnalysis } = data;

  const sections = [
    { emoji: "☀️", ...artworkAnalysis.sun },
    { emoji: "🌙", ...artworkAnalysis.moon },
    { emoji: "⬆️", ...artworkAnalysis.rising },
    { emoji: "🔥", ...artworkAnalysis.element },
  ];

  let y = 200;
  let bodyParts = "";

  // Title
  const title = `${escapeXml(customerName || "Your")}'s Cosmic Blueprint`;
  bodyParts += `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="72" fill="#F5E6D3" font-weight="bold">${title}</text>`;
  y += 50;

  // Decorative line
  bodyParts += `<line x1="${PAD + 100}" y1="${y}" x2="${W - PAD - 100}" y2="${y}" stroke="#8B7355" stroke-width="2" opacity="0.6"/>`;
  y += 60;

  // Birth data row
  const birthInfo = [birthDate, birthTime, birthPlace].filter(Boolean).join("  •  ");
  if (birthInfo) {
    bodyParts += `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="36" fill="#C4A882" letter-spacing="2">${escapeXml(birthInfo)}</text>`;
    y += 80;
  }

  // Sections
  for (const section of sections) {
    if (y > H - 300) break;

    // Label
    bodyParts += `<text x="${PAD}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#8B7355" letter-spacing="3" text-transform="uppercase">${section.emoji} ${escapeXml(section.label.toUpperCase())}</text>`;
    y += 50;

    // Title
    if (section.title) {
      bodyParts += `<text x="${PAD}" y="${y}" font-family="Georgia, 'Times New Roman', serif" font-size="44" fill="#F5E6D3" font-weight="bold">${escapeXml(section.title)}</text>`;
      y += 55;
    }

    // Explanation (wrapped)
    if (section.explanation) {
      const lines = wrapText(section.explanation, 58);
      for (const line of lines) {
        if (y > H - 250) break;
        bodyParts += `<text x="${PAD}" y="${y}" font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="#D4C4A8" line-height="1.5">${escapeXml(line)}</text>`;
        y += 48;
      }
    }

    y += 40; // spacing between sections
  }

  // Footer
  const footerY = H - 120;
  // Logo mark (union symbol)
  bodyParts += `<text x="${W / 2}" y="${footerY - 50}" text-anchor="middle" font-family="Georgia, serif" font-size="48" fill="#8B7355">∪</text>`;
  bodyParts += `<text x="${W / 2}" y="${footerY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#8B7355" letter-spacing="4">CELESTIALARTWORKS.COM</text>`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#2C2C2C" stop-opacity="0"/>
      <stop offset="100%" stop-color="#1A1A1A" stop-opacity="0.8"/>
    </radialGradient>
  </defs>
  <!-- Background -->
  <rect width="${W}" height="${H}" fill="#2C2C2C"/>
  <!-- Vignette -->
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  <!-- Border -->
  <rect x="${PAD / 2}" y="${PAD / 2}" width="${W - PAD}" height="${H - PAD}" fill="none" stroke="#8B7355" stroke-width="1.5" opacity="0.4" rx="8"/>
  <!-- Content -->
  ${bodyParts}
</svg>`;

  return svg;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { orderId, customerName, birthDate, birthTime, birthPlace, artworkAnalysis } = body;

  if (!orderId) {
    return new Response(JSON.stringify({ error: "orderId required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Build SVG
    const svg = buildInsertCardSvg({
      customerName: customerName || "Customer",
      birthDate: birthDate || "",
      birthTime: birthTime || "",
      birthPlace: birthPlace || "",
      artworkAnalysis: artworkAnalysis || {
        sun: { label: "Sun", title: "", explanation: "" },
        moon: { label: "Moon", title: "", explanation: "" },
        rising: { label: "Rising", title: "", explanation: "" },
        element: { label: "Element", title: "", explanation: "" },
      },
    });

    // For now, upload SVG directly as the insert card
    // (PNG conversion via svg2png-wasm can be added later if needed)
    const svgBlob = new Blob([svg], { type: "image/svg+xml" });
    const filePath = `inserts/${orderId}.svg`;

    const { error: uploadError } = await supabase.storage
      .from("insert-cards")
      .upload(filePath, svgBlob, {
        contentType: "image/svg+xml",
        upsert: true,
      });

    if (uploadError) {
      throw new Error("Storage upload failed: " + uploadError.message);
    }

    const { data: urlData } = supabase.storage
      .from("insert-cards")
      .getPublicUrl(filePath);

    const insertCardUrl = urlData.publicUrl;

    // Update order
    await supabase
      .from("orders")
      .update({ insert_card_url: insertCardUrl })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({ success: true, insertCardUrl }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("generate-insert-card error:", err?.message ?? err);
    return new Response(
      JSON.stringify({ error: err?.message ?? "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
