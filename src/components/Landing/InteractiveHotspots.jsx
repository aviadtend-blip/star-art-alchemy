import { useState } from "react";
import taurusExample from "@/assets/gallery/taurus-example.jpg";

const HOTSPOTS = [
  {
    id: 1,
    emoji: "☀️",
    label: "Taurus Sun",
    theme: "Grounded Abundance",
    top: "18%", left: "38%",
    para1: "The large golden-orange circular sun represents your Taurus sun—material stability, sensual beauty, and grounded presence.",
    para2: "Notice how it's positioned solidly in the upper left, like an anchor, surrounded by lush botanical abundance.",
  },
  {
    id: 2,
    emoji: "🌙",
    label: "Scorpio Moon",
    theme: "Hidden Depths",
    top: "58%", left: "15%",
    para1: "The deep magenta and shadowed flora emerging from the lower left captures your Scorpio Moon's emotional intensity and hidden depths.",
    para2: "These darker, more mysterious elements are partially concealed, just as your inner emotional world stays protected beneath the surface.",
  },
  {
    id: 3,
    emoji: "⬆️",
    label: "Sagittarius Rising",
    theme: "Expansive Horizons",
    top: "40%", left: "55%",
    para1: "The vast mountain landscape and open lake stretching toward the horizon embody your Sagittarius Rising—the adventurous face you show the world.",
    para2: "The overlapping circles and wide-open space suggest your natural optimism and desire for exploration beyond boundaries.",
  },
  {
    id: 4,
    emoji: "💧",
    label: "Water Element",
    theme: "Flowing Connections",
    top: "72%", left: "60%",
    para1: "The green-tinted reflective lake at the bottom creates a sense of emotional fluidity and intuitive connection.",
    para2: "This water element balances the earthy solidity above, showing how your chart blends grounding energy with emotional depth.",
  },
];

const NATAL_MAP = [
  { emoji: "☀️", label: "Taurus Sun" },
  { emoji: "🌙", label: "Scorpio Moon" },
  { emoji: "⬆️", label: "Sagittarius Rising" },
];

export default function InteractiveHotspots({ onScrollToForm }) {
  const [activeHotspot, setActiveHotspot] = useState(null);
  const active = HOTSPOTS.find((h) => h.id === activeHotspot);

  return (
    <section className="py-14 bg-secondary/30">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-xs text-muted-foreground font-body tracking-widest uppercase text-center mb-2">
          EVERY SYMBOL HAS MEANING
        </p>
        <h2 className="text-2xl md:text-4xl font-display font-bold text-center text-foreground mb-3">
          See how it all happens
        </h2>
        <p className="text-sm text-muted-foreground text-center font-body mb-10 max-w-xl mx-auto">
          Every element in your artwork corresponds to a specific astrological placement.
        </p>

        {/* Desktop: two-column layout */}
        <div className="md:grid md:grid-cols-2 md:gap-12 md:items-start">
          {/* Artwork with hotspots */}
          <div className="relative max-w-md mx-auto md:max-w-none">
            <div className="relative rounded-lg overflow-hidden shadow-2xl border-4 border-foreground/10">
              <img
                src={taurusExample}
                alt="Example Taurus Sun artwork with interactive hotspot markers"
                className="w-full"
              />
              {HOTSPOTS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setActiveHotspot(activeHotspot === h.id ? null : h.id)}
                  onMouseEnter={() => {
                    if (window.innerWidth >= 768) setActiveHotspot(h.id);
                  }}
                  className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 cursor-pointer z-10 ${
                    activeHotspot === h.id
                      ? "bg-primary text-primary-foreground scale-125 shadow-lg"
                      : "bg-foreground/80 text-background hover:bg-primary hover:text-primary-foreground hover:scale-110"
                  }`}
                  style={{ top: h.top, left: h.left }}
                  aria-label={`Hotspot ${h.id}: ${h.label}`}
                >
                  {h.id}
                </button>
              ))}
            </div>
          </div>

          {/* Right panel — Desktop: always visible. Mobile: hidden (explanation shows below artwork) */}
          <div className="hidden md:flex md:flex-col md:justify-between md:min-h-[500px]">
            {/* Example Natal Map */}
            <div>
              <p className="text-xs text-muted-foreground font-body tracking-widest uppercase mb-3">
                EXAMPLE NATAL MAP
              </p>
              <div className="space-y-2 mb-8">
                {NATAL_MAP.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="text-lg">{item.emoji}</span>
                    <span className="text-foreground font-display font-semibold text-base">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation panel */}
            <div className="flex-1 flex items-center">
              {active ? (
                <div className="space-y-4 animate-fade-in" key={active.id}>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-bold font-body">
                      {active.id}
                    </span>
                    <span className="text-lg">{active.emoji}</span>
                    <span className="text-foreground font-display font-semibold">{active.label}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-foreground font-display font-semibold">{active.theme}</span>
                  </div>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed">{active.para1}</p>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed">{active.para2}</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="text-2xl">👆</span>
                  <p className="font-body text-sm">
                    Hover over the numbers to explore how this chart was personalized.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile: explanation appears below artwork */}
        <div className="md:hidden mt-6">
          {active ? (
            <div className="bg-card border border-border rounded-xl p-5 space-y-3 animate-fade-in" key={active.id}>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  {active.id}
                </span>
                <span className="text-lg">{active.emoji}</span>
                <span className="text-foreground font-display font-semibold text-sm">{active.label}</span>
              </div>
              <p className="text-foreground font-display font-semibold text-sm">{active.theme}</p>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{active.para1}</p>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{active.para2}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground justify-center">
              <span className="text-xl">👆</span>
              <p className="font-body text-sm">Tap a number to explore how this chart was personalized.</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-10 space-y-3">
          <p className="text-muted-foreground font-body text-sm">
            Want to see what symbols appear in YOUR chart?
          </p>
          <button
            onClick={onScrollToForm}
            className="bg-foreground text-background px-8 py-3 rounded-full font-display font-semibold text-base hover:opacity-90 transition-all"
          >
            Generate my free artwork
          </button>
        </div>
      </div>
    </section>
  );
}
