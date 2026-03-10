import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmailCaptureModal from '@/components/EmailCaptureModal';
import { generateChartExplanation } from '@/lib/explanations/generateExplanation';
import StepProgressBar from '@/components/ui/StepProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { ChevronLeft, ChevronRight, ArrowLeftRight, RefreshCw } from 'lucide-react';
import { Switch as M3Switch } from '@/components/ui/material-design-3-switch';
import galaxyBg from '@/assets/galaxy-bg.jpg';
import CTARoomMockup from '@/components/Explanation/CTARoomMockup';
import ReviewsList, { TESTIMONIALS } from '@/components/ui/ReviewsList';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';

/**
 * Fallback hotspot positions derived from the prompt positioning data.
 * Used when AI vision doesn't return positions.
 */
const SUN_POSITIONS = {
  'Aries':       { top: '18%', left: '50%' },
  'Taurus':      { top: '20%', left: '30%' },
  'Gemini':      { top: '18%', left: '45%' },
  'Cancer':      { top: '35%', left: '50%' },
  'Leo':         { top: '30%', left: '50%' },
  'Virgo':       { top: '30%', left: '35%' },
  'Libra':       { top: '20%', left: '50%' },
  'Scorpio':     { top: '45%', left: '65%' },
  'Sagittarius': { top: '18%', left: '50%' },
  'Capricorn':   { top: '15%', left: '50%' },
  'Aquarius':    { top: '25%', left: '35%' },
  'Pisces':      { top: '30%', left: '50%' },
};

const MOON_POSITIONS = {
  'Aries':       { top: '55%', left: '60%' },
  'Taurus':      { top: '65%', left: '45%' },
  'Gemini':      { top: '50%', left: '55%' },
  'Cancer':      { top: '50%', left: '50%' },
  'Leo':         { top: '50%', left: '55%' },
  'Virgo':       { top: '55%', left: '45%' },
  'Libra':       { top: '55%', left: '50%' },
  'Scorpio':     { top: '65%', left: '70%' },
  'Sagittarius': { top: '40%', left: '60%' },
  'Capricorn':   { top: '45%', left: '55%' },
  'Aquarius':    { top: '50%', left: '65%' },
  'Pisces':      { top: '60%', left: '45%' },
};

// Rising affects borders/composition — place hotspot at a framing edge
const RISING_POSITIONS = {
  'Aries':       { top: '40%', left: '85%' },
  'Taurus':      { top: '75%', left: '25%' },
  'Gemini':      { top: '35%', left: '80%' },
  'Cancer':      { top: '70%', left: '30%' },
  'Leo':         { top: '15%', left: '75%' },
  'Virgo':       { top: '80%', left: '35%' },
  'Libra':       { top: '45%', left: '85%' },
  'Scorpio':     { top: '80%', left: '75%' },
  'Sagittarius': { top: '25%', left: '80%' },
  'Capricorn':   { top: '70%', left: '80%' },
  'Aquarius':    { top: '20%', left: '80%' },
  'Pisces':      { top: '75%', left: '70%' },
};

// Element palette — place in a color-dense area
const ELEMENT_POSITIONS = {
  'Fire':  { top: '78%', left: '55%' },
  'Water': { top: '80%', left: '40%' },
  'Earth': { top: '82%', left: '50%' },
  'Air':   { top: '78%', left: '60%' },
};

function getStaticPositions(chartData) {
  const sunSign = chartData?.sun?.sign || 'Leo';
  const moonSign = chartData?.moon?.sign || 'Cancer';
  const rising = chartData?.rising || 'Aries';
  const dominantElement = chartData?.element_balance
    ? Object.keys(chartData.element_balance).reduce((a, b) =>
        chartData.element_balance[a] > chartData.element_balance[b] ? a : b
      )
    : 'Fire';

  return [
    SUN_POSITIONS[sunSign] || { top: '20%', left: '50%' },
    MOON_POSITIONS[moonSign] || { top: '55%', left: '50%' },
    RISING_POSITIONS[rising] || { top: '40%', left: '80%' },
    ELEMENT_POSITIONS[dominantElement] || { top: '78%', left: '55%' },
  ];
}

// TESTIMONIALS imported from ReviewsList

const ROTATING_MESSAGES = [
  '🚀 Order by 5pm for same-day processing',
  '✨ 47 artworks generated today',
];

function RotatingBanner() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length), 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="rounded-sm flex items-center justify-center px-3 py-2" style={{ backgroundColor: '#30434B' }}>
      <p className="text-body-sm font-body text-white text-center">{ROTATING_MESSAGES[index]}</p>
    </div>
  );
}

function TestimonialsSection({ showArrows = false, bleed = false, topSpace = 32 }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <div className="pb-8" style={{ paddingTop: topSpace }}>
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg" style={{ color: '#FFBF00' }}>★★★★★</span>
            <span className="text-a2 font-display text-white">4.9/5</span>
          </div>
          <p className="text-subtitle text-white/50 tracking-widest">
            FROM 287 CUSTOMERS
          </p>
        </div>
        {showArrows && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              className="flex items-center justify-center transition-all duration-150 hover:bg-white/5 active:bg-white/10"
              style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)',
                opacity: canScrollLeft ? 1 : 0.35,
                cursor: canScrollLeft ? 'pointer' : 'default',
              }}
              aria-label="Previous reviews"
            >
              <ChevronLeft size={18} color="#ccc" />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              className="flex items-center justify-center transition-all duration-150 hover:bg-white/5 active:bg-white/10"
              style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)',
                opacity: canScrollRight ? 1 : 0.35,
                cursor: canScrollRight ? 'pointer' : 'default',
              }}
              aria-label="Next reviews"
            >
              <ChevronRight size={18} color="#ccc" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className={`flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory ${bleed ? '-mx-6 px-6' : ''}`}
      >
        {TESTIMONIALS.map((t, i) => (
          <div
            key={i}
            className="flex-shrink-0 snap-center"
            style={{ width: 280, borderRadius: '2px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <img src={t.img} alt={t.name} className="w-full object-cover" style={{ aspectRatio: '3/4' }} loading="eager" />
            <div className="p-4">
              <p className="text-body-sm font-body text-white mb-2 line-clamp-3">{t.quote}</p>
              <p className="text-subtitle text-white/50" style={{ fontSize: '10px' }}>{t.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HangingFrameIcon() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 1.0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex justify-center" style={{ marginBottom: 12, filter: 'drop-shadow(0 8px 16px rgba(255, 191, 0, 0.3))' }}>
      <svg
        width="48"
        height="56"
        viewBox="0 0 48 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transformOrigin: '24px 0px',
          animation: visible ? 'frame-swing 1.2s ease-out forwards' : 'none',
          opacity: visible ? 1 : 0,
        }}
      >
        <circle cx="24" cy="3" r="2.5" fill="#FFBF00" />
        <path d="M24 5.5 L14 18 M24 5.5 L34 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <rect x="8" y="18" width="32" height="34" rx="2" stroke="white" strokeWidth="2.5" fill="none" opacity="0.95" />
        <rect x="12" y="22" width="24" height="26" rx="1" stroke="white" strokeWidth="1.25" fill="none" opacity="0.6" />
        <path d="M14 42 L20 32 L24 36 L30 28 L34 42 Z" fill="white" opacity="0.25" />
        <circle cx="30" cy="28" r="2.5" fill="#FFBF00" opacity="0.6" />
      </svg>
    </div>
  );
}

export function ChartExplanation({
  chartData,
  selectedImage,
  onGetFramed,
  formData,
  onEditBirthData,
  onBackToStyle,
  artworkAnalysis,
  onReimagine,
  isReimagining,
  variationsExhausted,
}) {
  // Use AI analysis if available, otherwise fall back to static rule-based explanations
  const explanation = artworkAnalysis || generateChartExplanation(chartData);
  const subjectExplanation = explanation.subjectExplanation || 'A one-of-a-kind artwork, uniquely crafted from your celestial blueprint.';
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [mobileRevealed, setMobileRevealed] = useState(false);
  const mobileRevealRef = useRef(null);
  const artworkRef = useRef(null);
  const rightContentRef = useRef(null);
  const rightInnerRef = useRef(null);
  const [rightPadding, setRightPadding] = useState(0);
  const [artworkTopOffset, setArtworkTopOffset] = useState(0);

  const staticPositions = getStaticPositions(chartData);

  const hotspots = explanation.elements.map((el, i) => ({
    ...el,
    id: i + 1,
    // Ensure new fields exist, falling back to legacy field names
    chartElement: el.chartElement || el.title || '',
    artworkElement: el.artworkElement || el.subtitle || 'Artwork element loading...',
    explanation: el.explanation || '',
    position: el.aiPosition || staticPositions[i] || { top: '50%', left: '50%' },
  }));

  const active = hotspots.find((h) => h.id === activeHotspot);
  const scrollContainerRef = useRef(null);
  const desktopCardRefs = useRef([]);
  const cardRefs = useRef([]);

  // Initialize active hotspot to first one
  useEffect(() => {
    if (hotspots.length > 0 && activeHotspot === null) {
      setActiveHotspot(hotspots[0].id);
    }
  }, [hotspots]);

  // Measure artwork height and compute bottom padding for right column
  // so the last card's bottom aligns with the artwork's bottom
  useEffect(() => {
    const artworkEl = artworkRef.current;
    const innerEl = rightInnerRef.current;
    if (!artworkEl || !innerEl) return;
    const update = () => {
      const artworkH = artworkEl.offsetHeight;
      const contentH = innerEl.offsetHeight;
      const diff = Math.max(0, artworkH - contentH);
      setRightPadding(diff);
      // Compute artwork's top offset within its vertically-centered sticky container
      const containerH = window.innerHeight - 116; // sticky container height
      const toggleH = 52; // approximate hotspot toggle height + margin
      const totalArtworkH = artworkH + toggleH;
      const topOffset = Math.max(0, (containerH - totalArtworkH) / 2);
      setArtworkTopOffset(topOffset);
    };
    // Wait for images to load before measuring
    const img = artworkEl.querySelector('img');
    if (img && !img.complete) {
      img.addEventListener('load', update, { once: true });
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [selectedImage, hotspots]);

  // Desktop: highlight hotspot for the highest (topmost) visible description card
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    if (!mql.matches) return; // skip on mobile

    const headerOffset = 140;
    const onScroll = () => {
      let bestIdx = 0;
      let bestTop = Infinity;
      desktopCardRefs.current.forEach((el, i) => {
        if (!el) return;
        const top = el.getBoundingClientRect().top - headerOffset;
        if (top >= -el.offsetHeight / 2 && top < bestTop) {
          bestTop = top;
          bestIdx = i;
        }
      });
      if (hotspots[bestIdx]) {
        setActiveHotspot(hotspots[bestIdx].id);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [hotspots]);

  // Sync scroll position to active hotspot on artwork (mobile)
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
          closestId = hotspots[i]?.id;
        }
      });

      if (closestId !== null) {
        setActiveHotspot(closestId);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hotspots]);

  // Scroll to card when hotspot marker is tapped
  const scrollToCard = (id) => {
    const idx = hotspots.findIndex((h) => h.id === id);
    const cardEl = cardRefs.current[idx];
    const container = scrollContainerRef.current;
    if (!cardEl || !container) return;
    const containerRect = container.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();
    const scrollLeft = container.scrollLeft + (cardRect.left - containerRect.left) - (containerRect.width / 2 - cardRect.width / 2);
    container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  };

  // On mobile: lock scrolling once the ContainerScroll animation settles,
  // then unlock after the fade-in animation completes
  useEffect(() => {
    if (!mobileRevealed) return;
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;
    // Lock scroll so user sees the fade-in
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => {
      document.body.style.overflow = '';
    }, 900); // slightly longer than the 700ms fade
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [mobileRevealed]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(20% 40% at -3% -8%, rgba(255, 255, 255, 0.15) 0%, rgba(0, 0, 0, 0.00) 100%), radial-gradient(18% 35% at 103% -6%, rgba(255, 255, 255, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), #191919' }}>
      {/* Header + Progress bar — floating on desktop */}
      <div className="md:fixed md:top-0 md:left-0 md:right-0 md:z-40">
        <Header variant="dark" />

        <StepProgressBar currentStep={2} />
      </div>
      {/* Spacer for fixed header + progress bar on desktop */}
      <div className="hidden md:block" style={{ height: '116px' }} />

      {/* Main content */}
      <div className="flex-1">

        {/* Fixed strip + fade behind header on desktop */}
        <div
          className="hidden md:block fixed left-0 right-0 pointer-events-none z-35"
          style={{ top: '0', height: '156px' }}
        >
          <div style={{ height: '116px', background: '#191919' }} />
          <div style={{ height: '40px', background: 'linear-gradient(to bottom, #191919, transparent)' }} />
        </div>

        {/* ===== Title + scroll-animated artwork intro (all viewports) ===== */}
        <div>
          <ContainerScroll
            titleComponent={
              <div className="flex flex-col items-center text-center">
                <h1 className="text-a1-special text-white">
                  Meet Your Cosmic Masterpiece
                </h1>
                <div style={{ width: 1, height: 50, backgroundColor: '#666666', marginTop: 32, marginBottom: 32 }} />
                <p className="text-body-big max-w-[264px] md:max-w-none" style={{ color: '#c7c7c7' }}>
                  {subjectExplanation}
                </p>
              </div>
            }
            onSettled={() => setMobileRevealed(true)}
          >
            <div className="relative h-full w-full">
              <img
                src={selectedImage}
                alt={`Birth chart artwork for ${chartData?.sun?.sign || ''} Sun`}
                className="mx-auto object-cover h-full w-full"
                style={{ ...{ WebkitUserSelect: 'none', userSelect: 'none', pointerEvents: 'none' }, borderRadius: '2px' }}
                style={{ WebkitUserSelect: 'none', userSelect: 'none', pointerEvents: 'none' }}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
              {/* Mobile-only hotspot markers — fade in with mobileRevealed */}
              <div
                className="md:hidden absolute inset-0 transition-opacity duration-700 ease-out"
                style={{ opacity: mobileRevealed && showHotspots ? 1 : 0, pointerEvents: mobileRevealed && showHotspots ? 'auto' : 'none' }}
              >
                {hotspots.map((h) => {
                  const isActive = activeHotspot === h.id;
                  return (
                    <button
                      key={h.id}
                      onClick={() => {
                        setActiveHotspot(h.id);
                        scrollToCard(h.id);
                      }}
                      className={`absolute flex items-center justify-center transition-[width,height,background-color] duration-300 cursor-pointer z-10 ${isActive ? 'hotspot-pulse' : ''}`}
                      style={{
                        top: h.position.top,
                        left: h.position.left,
                        transform: 'translate(-50%, -50%)',
                        width: isActive ? 34 : 28,
                        height: isActive ? 34 : 28,
                        borderRadius: 41,
                        backgroundColor: isActive ? '#FFBF00' : 'rgba(255, 191, 0, 0.85)',
                        border: isActive ? '2px solid #b38600' : '2px solid #6e5200',
                      }}
                      aria-label={`Hotspot ${h.id}: ${h.chartElement}`}
                    >
                      <span className="font-body text-center" style={{ fontSize: 12, color: '#000' }}>
                        {h.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </ContainerScroll>
        </div>

        {/* ===== DESKTOP LAYOUT: two-column ===== */}
        <div className="hidden md:flex mx-auto px-8 gap-12 items-start w-full" style={{ maxWidth: 1060 }}>
          {/* Left: sticky artwork */}
          <div className="w-1/2 flex-shrink-0 sticky flex flex-col items-start justify-center" style={{ top: '116px', height: 'calc(100vh - 116px)' }}>
            <div className="relative" ref={artworkRef}>
              <img
                src={selectedImage}
                alt={`Birth chart artwork for ${chartData?.sun?.sign || ''} Sun`}
                className="w-full"
                style={{ borderRadius: '2px', WebkitUserSelect: 'none', userSelect: 'none', pointerEvents: 'none' }}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />


              {showHotspots && hotspots.map((h) => {
                const isActive = activeHotspot === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => {
                      setActiveHotspot(h.id);
                      const el = document.getElementById(`desktop-hotspot-${h.id}`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={`absolute flex items-center justify-center transition-[width,height,background-color] duration-300 cursor-pointer z-10 ${isActive ? 'hotspot-pulse' : ''}`}
                    style={{
                      top: h.position.top,
                      left: h.position.left,
                      transform: 'translate(-50%, -50%)',
                      width: isActive ? 34 : 28,
                      height: isActive ? 34 : 28,
                      borderRadius: 41,
                      padding: 2,
                      backgroundColor: isActive ? '#FFBF00' : 'rgba(255, 191, 0, 0.85)',
                      border: isActive ? '2px solid #b38600' : '2px solid #6e5200',
                      boxShadow: isActive
                        ? '0 0 12px 4px rgba(255, 191, 0, 0.5)'
                        : '0 0 8px 2px rgba(0, 0, 0, 0.4)',
                    }}
                    aria-label={`Hotspot ${h.id}: ${h.chartElement}`}
                  >
                    <span className="font-body text-center" style={{ fontSize: 12, color: '#000' }}>
                      {h.id}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Desktop hotspot toggle — 24px below artwork */}
            <div className="flex items-center gap-2.5 mt-6 self-center">
              <M3Switch
                checked={showHotspots}
                onCheckedChange={(val) => setShowHotspots(val)}
                showIcons
              />
              <span className="text-a5 text-white">Hotspot markers</span>
            </div>
          </div>

          {/* Right: content column — aligned to artwork top */}
          <div className="flex-1 min-w-0" ref={rightContentRef} style={{ paddingTop: 0 }}>
            <div ref={rightInnerRef} className="flex flex-col gap-10">

              {/* Explanation cards — vertical with right border */}
              <div className="flex flex-col gap-5">
                {hotspots.map((h, i) => (
                  <div
                    key={h.id}
                    id={`desktop-hotspot-${h.id}`}
                    ref={(el) => (desktopCardRefs.current[i] = el)}
                    className="w-full"
                    style={{ borderBottom: i < hotspots.length - 1 ? '1px solid #3f3f3f' : 'none', paddingBottom: i < hotspots.length - 1 ? 20 : 0 }}
                  >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex items-center justify-center font-body flex-shrink-0"
                            style={{ width: 28, height: 28, borderRadius: 41, border: '1px solid #FFF', fontSize: 13, color: '#FFF' }}
                          >
                            {h.id}
                          </span>
                          <p className="text-subtitle text-white/50">
                            {h.chartElement}
                          </p>
                        </div>
                        <p className="text-a4 text-white" style={{ marginLeft: 40, marginTop: 4 }}>
                          {h.artworkElement}
                        </p>
                        <p className="text-body font-body leading-relaxed" style={{ color: '#c7c7c7', marginLeft: 40, marginTop: 12 }}>
                          {h.explanation}
                        </p>
                      </div>
                  </div>
                ))}
              </div>

              {/* Action buttons — side by side */}
              <div className="flex flex-wrap gap-4 w-full">
                {onBackToStyle && (
                  <button onClick={onBackToStyle} className="btn-base btn-dark flex-1 gap-2.5">
                    <ArrowLeftRight size={16} className="flex-shrink-0" /> Try a Different Style
                  </button>
                )}
                {onReimagine && (
                  <button onClick={onReimagine} disabled={isReimagining} className="btn-base btn-dark flex-1 gap-2.5">
                    {isReimagining ? <><RefreshCw size={16} className="animate-spin flex-shrink-0" /> Loading...</> : variationsExhausted ? <><RefreshCw size={16} className="flex-shrink-0" /> Generate New</> : <><RefreshCw size={16} className="flex-shrink-0" /> Reimagine</>}
                  </button>
                )}
              </div>

              {/* CTA Card — dark with golden glow, rounded */}
              <div className="relative rounded-xl overflow-hidden flex flex-col items-center w-full">
                {/* Room mockup with composited artwork */}
                <CTARoomMockup artworkSrc={selectedImage} className="rounded-t-xl" />

                {/* Dark content section */}
                <div className="relative bg-[#2b2b2b] flex flex-col gap-6 items-center justify-center pt-8 pb-[34px] px-8 w-full">
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{ boxShadow: 'inset 0px 0px 114px 0px black' }}
                  />

                  <div className="relative flex flex-col gap-4 items-center text-center text-white w-full">
                    <h2 className="text-a1 text-white font-display">
                      Frame it. Hang it. Treasure it forever
                    </h2>
                    <p className="text-body-sm font-body text-white/70" style={{ maxWidth: 281 }}>
                      Gallery-quality printing. Solid wood frames. Ready to hang. Built to last 100 years.
                    </p>
                  </div>

                  <div className="relative flex flex-col gap-4 items-center w-full">
                    <div className="flex flex-wrap gap-2.5 w-full">
                      <button onClick={onGetFramed} className="btn-base btn-primary flex-1">
                        Choose Your Size ($79 - $199)
                      </button>
                      <button onClick={() => setShowEmailModal(true)} className="btn-base btn-dark-outline flex-1">
                        Download Preview (Free)
                      </button>
                    </div>

                    {/* Insert card teaser */}
                    <div className="flex flex-col items-center gap-2 mt-2">
                      <p className="text-xs font-display uppercase tracking-widest text-white/50">
                        ✦ Included with every order
                      </p>
                      <p className="text-sm font-body text-white/80 text-center">
                        Your personal Cosmic Blueprint card — printed and tucked inside.
                      </p>
                      <img
                        src={insertCardPreview}
                        alt="Cosmic Blueprint insert card"
                        className="w-[280px] rounded-lg shadow-lg"
                        loading="lazy"
                      />
                    </div>

                    <p className="text-body-sm font-body text-white/70 text-center">
                      ✓ Free shipping  📦 30-day quality guarantee  🔒 Secure checkout
                    </p>
                  </div>

                  <div className="relative w-full">
                    <RotatingBanner />
                  </div>
                </div>
              </div>

              {/* Reviews — list layout */}
              <ReviewsList theme="dark" gap={6} py={6} className="pt-8 pb-[60px] w-full" />
            </div>
          </div>
        </div>
        <div className="hidden md:block" style={{ height: 60 }} />



        {/* ===== MOBILE LAYOUT: dark theme ===== */}
        <div
          ref={mobileRevealRef}
          className="md:hidden -mt-40"
          style={{
            background: 'radial-gradient(30% 50% at -8% -5%, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.00) 100%), radial-gradient(28% 45% at 108% -3%, rgba(255, 255, 255, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), #191919',
          }}
        >

          <AnimatePresence>
            {mobileRevealed && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="px-6 mx-auto flex flex-col items-center pt-14"
              >
                {/* Hotspot toggle */}
                <div className="flex items-center justify-center gap-2.5 flex-1" style={{ padding: '10px 21px' }}>
                  <M3Switch
                    checked={showHotspots}
                    onCheckedChange={(val) => setShowHotspots(val)}
                    showIcons
                  />
                  <span className="text-a5 text-white">
                    Hotspot markers
                  </span>
                </div>

                <div style={{ height: 24 }} />

            {/* Horizontal scroll explanation cards — dark, bleeds to screen edges */}
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
              style={{ gap: '16px', marginLeft: -24, marginRight: -24, width: 'calc(100% + 48px)', paddingLeft: 20 }}
            >
              {hotspots.map((h, i) => (
                <div
                  key={h.id}
                  ref={(el) => (cardRefs.current[i] = el)}
                  className="flex-shrink-0 snap-start flex"
                  style={{ width: 280 }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex items-center justify-center font-body flex-shrink-0"
                          style={{ width: 28, height: 28, borderRadius: 41, border: '1px solid #FFF', fontSize: 13, color: '#FFF' }}
                        >
                          {h.id}
                        </span>
                        <p className="text-subtitle text-white/50">
                          {h.chartElement}
                        </p>
                      </div>
                      <p className="text-a4 text-white" style={{ marginLeft: 40, marginTop: 4 }}>
                        {h.artworkElement}
                      </p>
                      <p className="text-body font-body leading-relaxed" style={{ color: '#c7c7c7', marginLeft: 40, marginTop: 12 }}>
                        {h.explanation}
                      </p>
                    </div>
                  </div>
                  {/* Vertical divider */}
                  <div
                    className="flex-shrink-0 self-stretch"
                    style={{ width: 1, backgroundColor: '#3f3f3f', marginLeft: 16 }}
                  />
                </div>
              ))}
            </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons — side by side */}
          <div className="flex gap-3 px-5 pt-7 pb-10">
            {onBackToStyle && (
              <button
                onClick={onBackToStyle}
                className="btn-base btn-dark flex-1 gap-2.5"
              >
                <ArrowLeftRight size={16} className="flex-shrink-0" /> Try a Different Style
              </button>
            )}
            {onReimagine && (
              <button
                onClick={onReimagine}
                disabled={isReimagining}
                className="btn-base btn-dark flex-1 gap-2.5"
              >
                {isReimagining ? <><RefreshCw size={16} className="animate-spin flex-shrink-0" /> Loading...</> : variationsExhausted ? <><RefreshCw size={16} className="flex-shrink-0" /> Generate New</> : <><RefreshCw size={16} className="flex-shrink-0" /> Reimagine</>}
              </button>
            )}
          </div>

          {/* CTA Banner — room mockup + dark content */}
          <div className="relative w-full flex flex-col items-center overflow-hidden">
            {/* Room mockup with composited artwork */}
            <CTARoomMockup artworkSrc={selectedImage} />

            {/* Dark content section */}
            <div className="relative bg-[#2b2b2b] flex flex-col gap-6 items-center justify-center pt-8 pb-[34px] px-8 w-full">
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{ boxShadow: 'inset 0px 0px 114px 0px black' }}
              />

              <div className="relative flex flex-col gap-4 items-center text-center text-white" style={{ maxWidth: 250 }}>
                <h2 className="text-a1 text-white font-display">
                  Frame it. Hang it.{'\n'}Treasure it forever
                </h2>
                <p className="text-body-sm font-body text-white/70">
                  Gallery-quality printing. Solid wood frames.{'\n'}Ready to hang. Built to last 100 years.
                </p>
              </div>

              <div className="relative flex flex-col gap-2.5 w-full">
                <button
                  onClick={onGetFramed}
                  className="btn-base btn-primary w-full"
                >
                  Choose Your Size ($79 - $199)
                </button>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="btn-base btn-dark-outline w-full"
                >
                  Download Preview (Free)
                </button>
              </div>
              <p className="relative text-body-sm font-body text-white/70 text-center">
                ✓ Free shipping  📦 30-day quality guarantee  🔒 Secure checkout
              </p>

              <div className="relative w-full">
                <RotatingBanner />
              </div>
            </div>
          </div>

          {/* Reviews — dark */}
          <ReviewsList theme="dark" gap={5} py={5} className="px-4 pt-12 pb-12" />
        </div>
       </div>

      {/* Footer */}
      <Footer />

      {/* Email capture modal */}
      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        chartData={chartData}
        artworkUrl={selectedImage}
        formData={formData}
      />
    </div>
  );
}
