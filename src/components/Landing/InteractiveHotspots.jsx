import { useState, useEffect, useRef, useCallback } from "react";
import hotspotExample from "@/assets/gallery/hotspot-example.webp";

const HOTSPOTS = [
  {
    id: 1,
    title: "Sun in Capricorn",
    explanation: "The Capricorn Sun appears as a blinding light-spiral—the ruthless clarity of ambition cutting through the chaos of the cosmos.",
    position: { top: "38%", left: "58%" },
  },
  {
    id: 2,
    title: "Moon in Scorpio",
    explanation: "The Scorpio Moon lives in the dark, churning water below. Quiet, heavy, and full of secrets that rush beneath the surface.",
    position: { top: "65%", left: "48%" },
  },
  {
    id: 3,
    title: "Taurus Rising",
    explanation: "Taurus Rising anchors the composition. The scene is carved into a rugged geological shell, reflecting a deep need for beauty and physical permanence.",
    position: { top: "82%", left: "52%" },
  },
  {
    id: 4,
    title: "Air Dominant",
    explanation: "Air dominates here. Colorful spheres float like loose thoughts, drifting through the ether to balance the heavy earth energy below.",
    position: { top: "14%", left: "32%" },
  },
];

export default function InteractiveHotspots({ onScrollToForm }) {
  const [activeHotspot, setActiveHotspot] = useState(1);
  

  const scrollContainerRef = useRef(null);
  const cardRefs = useRef([]);
  const desktopCardRefs = useRef([]);

  // Desktop: highlight hotspot for topmost visible card
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    if (!mql.matches) return;

    const section = document.getElementById("interactive-hotspots-section");
    if (!section) return;

    const onScroll = () => {
      const sectionRect = section.getBoundingClientRect();
      // Only activate when section is in viewport
      if (sectionRect.bottom < 0 || sectionRect.top > window.innerHeight) return;

      let bestIdx = 0;
      let bestTop = Infinity;
      desktopCardRefs.current.forEach((el, i) => {
        if (!el) return;
        const top = el.getBoundingClientRect().top - 200;
        if (top >= -el.offsetHeight / 2 && top < bestTop) {
          bestTop = top;
          bestIdx = i;
        }
      });
      if (HOTSPOTS[bestIdx]) {
        setActiveHotspot(HOTSPOTS[bestIdx].id);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile: sync scroll position to active hotspot
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      let closestId = null;
      let closestDist = Infinity;

      cardRefs.current.forEach((cardEl, i) => {
        if (!cardEl) return;
        const cardRect = cardEl.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const dist = Math.abs(cardCenter - containerCenter);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = HOTSPOTS[i]?.id;
        }
      });

      if (closestId !== null) {
        setActiveHotspot(closestId);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToCard = (id) => {
    const idx = HOTSPOTS.findIndex((h) => h.id === id);
    const cardEl = cardRefs.current[idx];
    const container = scrollContainerRef.current;
    if (!cardEl || !container) return;
    const containerRect = container.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();
    const scrollLeft =
      container.scrollLeft +
      (cardRect.left - containerRect.left) -
      (containerRect.width / 2 - cardRect.width / 2);
    container.scrollTo({ left: scrollLeft, behavior: "smooth" });
  };

  const HotspotMarker = ({ h, onClick }) => {
    const isActive = activeHotspot === h.id;
    return (
      <button
        key={h.id}
        onClick={onClick}
        className={`absolute flex items-center justify-center transition-[width,height,background-color] duration-300 cursor-pointer z-10 ${isActive ? "hotspot-pulse" : ""}`}
        style={{
          top: h.position.top,
          left: h.position.left,
          transform: "translate(-50%, -50%)",
          width: isActive ? 34 : 28,
          height: isActive ? 34 : 28,
          borderRadius: 41,
          backgroundColor: isActive ? "#FFBF00" : "rgba(255, 191, 0, 0.85)",
          border: isActive ? "2px solid #b38600" : "2px solid #6e5200",
          boxShadow: isActive
            ? "0 0 12px 4px rgba(255, 191, 0, 0.5)"
            : "0 0 8px 2px rgba(0, 0, 0, 0.4)",
        }}
        aria-label={`Hotspot ${h.id}: ${h.title}`}
      >
        <span className="font-body text-center" style={{ fontSize: 12, color: "#000" }}>
          {h.id}
        </span>
      </button>
    );
  };



  const DescriptionCard = ({ h, isLast }) => (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span
          className="flex items-center justify-center font-body flex-shrink-0"
          style={{ width: 28, height: 28, borderRadius: 41, border: "1px solid #FFF", padding: 2, fontSize: 13, color: "#FFF" }}
        >
          {h.id}
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-display text-white uppercase" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
            {h.title.split("·")[0]?.trim() || h.title}
          </p>
          {h.title.includes("·") && (
            <p className="font-display text-white" style={{ fontSize: 16, fontWeight: 500, fontFamily: "var(--font-serif, Erode, serif)", lineHeight: "14px" }}>
              {h.title.split("·")[1]?.trim()}
            </p>
          )}
        </div>
      </div>
      <p className="text-body font-body leading-relaxed" style={{ color: "#c7c7c7" }}>
        {h.explanation}
      </p>
    </div>
  );

  return (
    <section
      id="interactive-hotspots-section"
      style={{ backgroundColor: "#191919" }}
    >
      {/* Section header */}
      <div className="flex flex-col items-center text-center px-6 pt-[80px] pb-0" style={{ maxWidth: 500, margin: "0 auto" }}>
        <p className="text-subtitle tracking-widest mb-2" style={{ color: "#999" }}>
          EVERY SYMBOL HAS MEANING
        </p>
        <h2 className="text-a2 md:text-4xl text-white mb-3">
          See how it all happens
        </h2>
        <p className="text-body mb-0" style={{ color: "#c7c7c7", maxWidth: 420 }}>
          Every element in your artwork corresponds to a specific astrological placement.
        </p>
        <div style={{ height: 40 }} />
      </div>

      {/* ===== DESKTOP: two-column layout ===== */}
      <div className="hidden md:flex mx-auto px-8 gap-12 items-start w-full" style={{ maxWidth: 1060 }}>
        {/* Left: sticky artwork */}
        <div className="w-1/2 flex-shrink-0 sticky flex flex-col items-center justify-center" style={{ top: "80px", height: "calc(100vh - 80px)" }}>
          <div className="relative">
            <img
              src={hotspotExample}
              alt="Example birth chart artwork with interactive hotspot markers"
              className="w-full"
              style={{ borderRadius: "2px" }}
            />
            {HOTSPOTS.map((h) => (
              <HotspotMarker
                key={h.id}
                h={h}
                onClick={() => {
                  setActiveHotspot(h.id);
                  const el = document.getElementById(`landing-hotspot-${h.id}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              />
            ))}
          </div>
        </div>

        {/* Right: intro + description cards */}
        <div className="flex-1 min-w-0 py-12">
          {/* Introduction */}
          <div className="mb-8">
            <p className="text-subtitle tracking-widest mb-5" style={{ color: "#999" }}>
              AMANDA TORRES &nbsp;·&nbsp; DECEMBER 29, 1994 &nbsp;·&nbsp; 7:40 AM &nbsp;·&nbsp; SANTA FE, NEW MEXICO
            </p>
            <p className="text-body leading-relaxed" style={{ color: "#c7c7c7" }}>
              This birth chart reveals unshakable resolve and hidden depths — these towering granite peaks were chosen as the cosmic guardian because they embody the stoic Capricorn mountain and Scorpio intensity.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {HOTSPOTS.map((h, i) => (
              <div
                key={h.id}
                id={`landing-hotspot-${h.id}`}
                ref={(el) => (desktopCardRefs.current[i] = el)}
                className="w-full"
                style={{ borderBottom: i < HOTSPOTS.length - 1 ? "1px solid #3f3f3f" : "none", paddingBottom: i < HOTSPOTS.length - 1 ? 20 : 0 }}
              >
                <DescriptionCard h={h} isLast={i === HOTSPOTS.length - 1} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="md:hidden px-5 max-w-md mx-auto flex flex-col items-center">
        {/* Artwork */}
        <div className="relative w-full overflow-hidden" style={{ borderRadius: "2px" }}>
          <img
            src={hotspotExample}
            alt="Example birth chart artwork with interactive hotspot markers"
            className="w-full"
          />
          {HOTSPOTS.map((h) => (
            <HotspotMarker
              key={h.id}
              h={h}
              onClick={() => {
                setActiveHotspot(h.id);
                scrollToCard(h.id);
              }}
            />
          ))}
        </div>

        {/* Intro text */}
        <p className="text-subtitle tracking-widest text-center mt-6 mb-4" style={{ color: "#999" }}>
          AMANDA TORRES &nbsp;·&nbsp; DECEMBER 29, 1994 &nbsp;·&nbsp; 7:40 AM &nbsp;·&nbsp; SANTA FE, NEW MEXICO
        </p>

        {/* Horizontal scroll cards */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 w-full"
          style={{ gap: "16px" }}
        >
          {HOTSPOTS.map((h, i) => (
            <div
              key={h.id}
              ref={(el) => (cardRefs.current[i] = el)}
              className="flex-shrink-0 snap-start flex"
              style={{ width: 280 }}
            >
              <div className="flex-1 min-w-0">
                <DescriptionCard h={h} />
              </div>
              {i < HOTSPOTS.length - 1 && (
                <div
                  className="flex-shrink-0 self-stretch"
                  style={{ width: 1, backgroundColor: "#3f3f3f", marginLeft: 16 }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-[60px] pb-[80px] px-6 space-y-3">
        <p className="text-body" style={{ color: "#c7c7c7" }}>
          Want to see what symbols appear in YOUR chart?
        </p>
        <button
          onClick={onScrollToForm}
          className="btn-base btn-primary w-full md:w-auto"
          style={{ minWidth: 280 }}
        >
          Generate my free artwork
        </button>
      </div>
    </section>
  );
}
