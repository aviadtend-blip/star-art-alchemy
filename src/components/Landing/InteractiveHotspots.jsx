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
  { emoji: "☀️", label: "Taurus Sun", theme: "Grounded Abundance", desc: "The golden-orange sun anchors the composition — solid, warm, and abundant, just like Taurus energy in the 2nd house of material security." },
  { emoji: "🌙", label: "Scorpio Moon", theme: "Deep Transformation", desc: "Shadowed magenta flora and dark, layered textures capture the emotional intensity and hidden depths of a Scorpio Moon." },
  { emoji: "⬆️", label: "Sagittarius Rising", theme: "Expansive Horizons", desc: "Open landscapes stretching toward distant mountains embody the adventurous, optimistic face shown to the world." },
];

export default function InteractiveHotspots({ onScrollToForm }) {
  const [activeHotspot, setActiveHotspot] = useState(null);
  const active = HOTSPOTS.find((h) => h.id === activeHotspot);

  return (
    <section className="py-[80px] bg-surface text-surface-foreground">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-subtitle text-surface-muted text-center mb-2 tracking-widest">
          EVERY SYMBOL HAS MEANING
        </p>
        <h2 className="text-a2 md:text-4xl text-center text-surface-foreground mb-3">
          See how it all happens
        </h2>
        <p className="text-body-sm text-surface-muted text-center mb-[80px] max-w-xl mx-auto">
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
                      : "bg-surface-foreground/80 text-surface hover:bg-primary hover:text-primary-foreground hover:scale-110"
                  }`}
                  style={{ top: h.top, left: h.left }}
                  aria-label={`Hotspot ${h.id}: ${h.label}`}
                >
                  {h.id}
                </button>
              ))}
            </div>
          </div>

          {/* Right panel — Desktop only */}
          <div className="hidden md:flex md:flex-col md:justify-between md:min-h-[500px]">
            {/* Example Natal Map */}
            <div>
              <p className="text-subtitle text-surface-muted tracking-widest mb-3">
                EXAMPLE NATAL MAP
              </p>
              <div className="space-y-4 mb-8">
                {NATAL_MAP.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{item.emoji}</span>
                      <span className="text-a4 text-surface-foreground">{item.label}</span>
                      <span className="text-surface-muted">·</span>
                      <span className="text-a5 text-surface-foreground/70">{item.theme}</span>
                    </div>
                    <p className="text-body-sm text-surface-muted leading-relaxed pl-8">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation panel */}
            <div className="flex-1 flex items-center">
              {active ? (
                <div className="space-y-4 animate-fade-in" key={active.id}>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold font-body">
                      {active.id}
                    </span>
                    <span className="text-lg">{active.emoji}</span>
                    <span className="text-a4 text-surface-foreground">{active.label}</span>
                    <span className="text-surface-muted">·</span>
                    <span className="text-a4 text-surface-foreground">{active.theme}</span>
                  </div>
                  <p className="text-body text-surface-muted">{active.para1}</p>
                  <p className="text-body text-surface-muted">{active.para2}</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-surface-muted">
                  <span className="text-2xl">👆</span>
                  <p className="text-body">
                    Hover over the numbers to explore how this chart was personalized.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile: explanation appears below artwork — centered layout matching Figma */}
        <div className="md:hidden mt-10">
          {active ? (
            <div className="space-y-4 animate-fade-in px-4" key={active.id}>
              {/* Number + emoji + title */}
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 bg-surface-foreground text-surface rounded-full flex items-center justify-center text-sm font-bold">
                  {active.id}
                </span>
                <span className="text-lg">{active.emoji}</span>
                <span className="text-a4 text-surface-foreground leading-tight">
                  {active.label}<br />{active.theme}
                </span>
              </div>

              {/* Body text */}
              <p className="text-body text-surface-muted leading-relaxed">{active.para1}</p>
              <p className="text-body text-surface-muted leading-relaxed">{active.para2}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-surface-muted justify-center">
              <span className="text-xl">👆</span>
              <p className="text-body-sm">Tap a number to explore how this chart was personalized.</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-[80px] space-y-3">
          <p className="text-body-sm text-surface-muted">
            Want to see what symbols appear in YOUR chart?
          </p>
          <button
            onClick={onScrollToForm}
            className="bg-surface-foreground text-surface px-8 py-3 rounded-full text-a5 hover:opacity-90 transition-all"
          >
            Generate my free artwork
          </button>
        </div>
      </div>
    </section>
  );
}
