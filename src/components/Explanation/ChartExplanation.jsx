import { useState, useEffect, useRef, useCallback } from 'react';
import { generateChartExplanation } from '@/lib/explanations/generateExplanation';
import StepProgressBar from '@/components/ui/StepProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';
import Footer from '@/components/Layout/Footer';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import galaxyBg from '@/assets/galaxy-bg.jpg';
import womanHolding from '@/assets/gallery/woman-holding.jpg';
import lifestyleImg from '@/assets/gallery/lifestyle.jpg';

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

const TESTIMONIALS = [
  {
    img: womanHolding,
    quote: '"This is the most meaningful piece of art I own"',
    name: 'SARAH M, VERIFIED BUYER',
  },
  {
    img: lifestyleImg,
    quote: '"As a Taurus sun it spoke to me instantly. I get compliments every time someone visits"',
    name: 'JENNIFER K, VERIFIED BUYER',
  },
  {
    img: womanHolding,
    quote: '"I bought one for myself and two more as gifts. Everyone was blown away"',
    name: 'EMMA R, VERIFIED BUYER',
  },
  {
    img: lifestyleImg,
    quote: '"The detail is incredible — every symbol actually means something about my chart"',
    name: 'MICHAEL T, VERIFIED BUYER',
  },
];

function TestimonialsSection({ showArrows = false }) {
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
    <div className="py-8">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg" style={{ color: '#FFBF00' }}>★★★★★</span>
            <span className="text-a2 font-display text-surface-foreground">4.9/5</span>
          </div>
          <p className="text-subtitle text-surface-muted tracking-widest">
            FROM 287 CUSTOMERS
          </p>
        </div>
        {showArrows && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              className="flex items-center justify-center transition-all duration-150 hover:bg-black/5 active:bg-black/10"
              style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.15)',
                opacity: canScrollLeft ? 1 : 0.35,
                cursor: canScrollLeft ? 'pointer' : 'default',
              }}
              aria-label="Previous reviews"
            >
              <ChevronLeft size={18} color="#333" />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              className="flex items-center justify-center transition-all duration-150 hover:bg-black/5 active:bg-black/10"
              style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.15)',
                opacity: canScrollRight ? 1 : 0.35,
                cursor: canScrollRight ? 'pointer' : 'default',
              }}
              aria-label="Next reviews"
            >
              <ChevronRight size={18} color="#333" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-6 px-6 snap-x snap-mandatory"
      >
        {TESTIMONIALS.map((t, i) => (
          <div
            key={i}
            className="flex-shrink-0 snap-center"
            style={{ width: 280, borderRadius: '2px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}
          >
            <img src={t.img} alt={t.name} className="w-full h-[160px] object-cover" />
            <div className="p-4">
              <p className="text-body-sm font-body text-surface-foreground mb-2 line-clamp-3">{t.quote}</p>
              <p className="text-subtitle text-surface-foreground" style={{ fontSize: '10px' }}>{t.name}</p>
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
      { threshold: 0.5 }
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
}) {
  // Use AI analysis if available, otherwise fall back to static rule-based explanations
  const explanation = artworkAnalysis || generateChartExplanation(chartData);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const artworkRef = useRef(null);
  const rightContentRef = useRef(null);
  const rightInnerRef = useRef(null);
  const [rightPadding, setRightPadding] = useState(0);

  const staticPositions = getStaticPositions(chartData);

  const hotspots = explanation.elements.map((el, i) => ({
    ...el,
    id: i + 1,
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

  // Desktop: IntersectionObserver to highlight hotspot when card scrolls into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = desktopCardRefs.current.indexOf(entry.target);
            if (idx !== -1 && hotspots[idx]) {
              setActiveHotspot(hotspots[idx].id);
            }
          }
        });
      },
      { threshold: 0.6, rootMargin: '-20% 0px -20% 0px' }
    );

    desktopCardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [hotspots]);

  // Sync scroll position to active hotspot on artwork
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

      if (closestId !== null && closestId !== activeHotspot) {
        setActiveHotspot(closestId);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hotspots, activeHotspot]);

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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header + Progress bar — floating on desktop */}
      <div className="md:fixed md:top-0 md:left-0 md:right-0 md:z-40">
        <nav
          className="flex items-center justify-between"
          style={{ backgroundColor: '#121212', padding: '26px 30px' }}
        >
          <div className="text-a4 text-white font-display">Celestial Artworks</div>
          <button className="text-white/70 hover:text-white transition">
            <div className="space-y-1.5">
              <div className="w-6 h-0.5 bg-current" />
              <div className="w-6 h-0.5 bg-current" />
            </div>
          </button>
        </nav>
        <StepProgressBar currentStep={2} />
      </div>
      {/* Spacer for fixed header + progress bar on desktop */}
      <div className="hidden md:block" style={{ height: '116px' }} />

      {/* Main content */}
      <div className="flex-1">

        {/* Fixed white strip + fade that starts exactly at header/progress bar bottom */}
        <div
          className="hidden md:block fixed left-1/2 right-0 pointer-events-none z-35"
          style={{ top: '0', height: '156px' }}
        >
          {/* Solid white covers everything behind the header */}
          <div style={{ height: '116px', background: 'white' }} />
          {/* Fade from white to transparent */}
          <div style={{ height: '40px', background: 'linear-gradient(to bottom, white, transparent)' }} />
        </div>

        {/* ===== DESKTOP LAYOUT: sticky artwork left + scrolling explanations right ===== */}
        <div className="hidden md:flex max-w-6xl mx-auto px-8 pt-12 gap-12 items-start">
          {/* Left: sticky artwork centered vertically on screen */}
          <div className="w-1/2 flex-shrink-0 sticky" style={{ top: 'calc(116px + (100vh - 116px) / 2)', transform: 'translateY(-50%)', height: 'fit-content' }}>
            <div className="relative" ref={artworkRef}>
                <img
                  src={selectedImage}
                  alt={`Birth chart artwork for ${chartData.sun.sign} Sun`}
                  className="w-full"
                  style={{ borderRadius: '2px' }}
                />
                {hotspots.map((h) => {
                  const isActive = activeHotspot === h.id;
                  return (
                    <button
                      key={h.id}
                      onClick={() => {
                        setActiveHotspot(h.id);
                        // Scroll the right-side card into view
                        const el = document.getElementById(`desktop-hotspot-${h.id}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="absolute flex items-center justify-center transition-all duration-300 cursor-pointer z-10"
                      style={{
                        top: h.position.top,
                        left: h.position.left,
                        transform: 'translate(-50%, -50%)',
                        width: isActive ? 28 : 24,
                        height: isActive ? 28 : 24,
                        borderRadius: 41,
                        padding: 2,
                        backgroundColor: isActive ? '#FFBF00' : 'rgba(255, 255, 255, 0.85)',
                        border: isActive ? '1px solid rgba(255, 191, 0, 0.32)' : '1px solid rgba(0, 0, 0, 0.12)',
                        boxShadow: isActive
                          ? '0 2px 8px rgba(255, 191, 0, 0.4)'
                          : '0 1px 4px rgba(0, 0, 0, 0.15)',
                      }}
                      aria-label={`Hotspot ${h.id}: ${h.title}`}
                    >
                      <span className="font-body text-center" style={{ fontSize: 12, fontWeight: 400, lineHeight: '113%', letterSpacing: '-0.42px', color: '#000' }}>
                        {h.id}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Right: heading + scrolling explanation cards */}
          <div className="w-1/2 relative" ref={rightContentRef} style={{ paddingBottom: `${rightPadding}px` }}>
           <div ref={rightInnerRef}>
            <h1 className="text-a1 text-surface-foreground font-display mb-3">
              Meet Your Cosmic Masterpiece
            </h1>
            <p className="text-body font-body text-surface-muted mb-10">
              Every symbol, color, and shape represents your exact planetary positions at birth.
            </p>

            <div className="space-y-0">
              {hotspots.map((h, i) => (
                <div
                  key={h.id}
                  id={`desktop-hotspot-${h.id}`}
                  ref={(el) => (desktopCardRefs.current[i] = el)}
                  className={`pb-8 mb-8 ${i > 0 ? 'pt-4' : ''}`}
                  style={{ borderBottom: i < hotspots.length - 1 ? '1px solid rgba(0, 0, 0, 0.12)' : 'none' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="flex items-center justify-center font-body flex-shrink-0"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 41,
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        fontSize: 13,
                        color: '#000',
                      }}
                    >
                      {h.id}
                    </span>
                    <div>
                      <p className="text-subtitle font-display text-surface-foreground uppercase tracking-wider" style={{ fontSize: 11 }}>
                        {h.title.split('·')[0]?.trim() || h.title}
                      </p>
                      <p className="text-a5 font-display text-surface-foreground" style={{ fontFamily: 'var(--font-serif, Erode, serif)', fontWeight: 600 }}>
                        {h.title.split('·')[1]?.trim() || ''}
                      </p>
                    </div>
                  </div>
                  <p className="text-body font-body text-surface-muted leading-relaxed mb-3">
                    {h.explanation}
                  </p>
                  <p className="text-body font-body text-surface-muted leading-relaxed">
                    {h.meaning}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA Banner — inside right column on desktop */}
            <div
              className="mt-8 py-12 px-6 text-center bg-cover bg-center rounded-sm"
              style={{ backgroundImage: `url(${galaxyBg})`, backgroundColor: '#121212' }}
            >
              <HangingFrameIcon />
              <div className="max-w-md mx-auto space-y-4">
                <h2 className="text-a1 text-white font-display">
                  Frame it. Hang it.{'\n'}Treasure it forever
                </h2>
                <p className="text-body font-body text-white/70">
                  Museum-grade archival canvas. Gallery-quality 12-color printing.{'\n'}Ready to display. Built to last 100 years.
                </p>
                <div className="space-y-3 pt-2">
                  <button
                    onClick={onGetFramed}
                    className="btn-base btn-primary w-full"
                  >
                    Select Size Options ($79 - $179)
                  </button>
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="btn-base w-full"
                    style={{
                      backgroundColor: '#333333',
                      color: '#FFFFFF',
                      border: 'none',
                    }}
                  >
                    Download Preview (Free)
                  </button>
                </div>
              </div>
            </div>

            {/* Trust badges — inside right column on desktop */}
            <div className="py-6 text-center space-y-3">
              <p className="text-body-sm font-body text-surface-foreground">
                ✓ Free shipping · 📦 30-day guarantee · 🔒 Secure checkout
              </p>
              <div
                className="py-3 px-4 text-center"
                style={{ backgroundColor: '#DAEEFF', borderRadius: '2px' }}
              >
                <p className="text-body-sm font-body" style={{ color: '#333333' }}>
                  🚀 Order by 5pm for same-day processing
                </p>
              </div>
              {onBackToStyle && (
                <button
                  onClick={onBackToStyle}
                  className="btn-base btn-tertiary"
                  style={{ color: '#333333' }}
                >
                  ↻ Try a Different Style
                </button>
              )}
             </div>

             {/* Testimonials — desktop with arrows */}
             <TestimonialsSection showArrows />
           </div>
          </div>
        </div>

        {/* ===== MOBILE LAYOUT: horizontal scroll carousel ===== */}
        <div className="md:hidden">
          {/* Hero heading */}
          <div className="text-center px-6 pt-12 pb-8">
            <h1 className="text-a1 text-surface-foreground font-display mb-3">
              Meet Your Cosmic{'\n'}Masterpiece
            </h1>
            <p className="text-body font-body text-surface-muted max-w-sm mx-auto">
              Swipe through to discover why each element was chosen — every detail was inspired by your birth chart.
            </p>
          </div>

          <div className="px-6 max-w-md mx-auto">
            <div className="relative">
              <img
                src={selectedImage}
                alt={`Birth chart artwork for ${chartData.sun.sign} Sun`}
                className="w-full"
                style={{ borderRadius: '2px' }}
              />
              {hotspots.map((h) => {
                const isActive = activeHotspot === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => {
                      setActiveHotspot(h.id);
                      scrollToCard(h.id);
                    }}
                    className="absolute flex items-center justify-center transition-all duration-300 cursor-pointer z-10"
                    style={{
                      top: h.position.top,
                      left: h.position.left,
                      transform: 'translate(-50%, -50%)',
                      width: isActive ? 28 : 24,
                      height: isActive ? 28 : 24,
                      borderRadius: 41,
                      padding: 2,
                      backgroundColor: isActive ? '#FFBF00' : 'rgba(255, 255, 255, 0.85)',
                      border: isActive ? '1px solid rgba(255, 191, 0, 0.32)' : '1px solid rgba(0, 0, 0, 0.12)',
                      boxShadow: isActive
                        ? '0 2px 8px rgba(255, 191, 0, 0.4)'
                        : '0 1px 4px rgba(0, 0, 0, 0.15)',
                    }}
                    aria-label={`Hotspot ${h.id}: ${h.title}`}
                  >
                    <span className="font-body text-center" style={{ fontSize: 12, fontWeight: 400, lineHeight: '113%', letterSpacing: '-0.42px', color: '#000' }}>
                      {h.id}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Horizontal scroll explanation cards */}
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto scrollbar-hide -mx-6 px-6 snap-x snap-mandatory mt-6 pb-2"
              style={{ scrollPaddingInline: '24px', gap: '20px' }}
            >
              {hotspots.map((h, i) => (
                <div
                  key={h.id}
                  ref={(el) => (cardRefs.current[i] = el)}
                  className="flex-shrink-0 snap-center flex"
                  style={{ width: 'calc(100vw - 80px)', maxWidth: 340 }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="flex items-center justify-center font-body"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 41,
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          fontSize: 12,
                          color: '#000',
                        }}
                      >
                        {h.id}
                      </span>
                      <div>
                        <p className="text-subtitle font-display text-surface-foreground uppercase tracking-wider" style={{ fontSize: 11 }}>
                          {h.title.split('·')[0]?.trim() || h.title}
                        </p>
                        <p className="text-a5 font-display text-surface-foreground" style={{ fontFamily: 'var(--font-serif, Erode, serif)' }}>
                          {h.title.split('·')[1]?.trim() || ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-body font-body text-surface-muted leading-relaxed mb-2">
                      {h.explanation}
                    </p>
                    <p className="text-body font-body text-surface-muted leading-relaxed">
                      {h.meaning}
                    </p>
                  </div>
                  {/* Vertical divider */}
                  <div
                    className="flex-shrink-0 self-stretch"
                    style={{ width: 1, backgroundColor: 'rgba(0, 0, 0, 0.12)', marginLeft: 16 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Banner — mobile only (desktop version is inside right column) */}
        <div
          className="md:hidden mt-12 py-12 px-6 text-center bg-cover bg-center"
          style={{ backgroundImage: `url(${galaxyBg})`, backgroundColor: '#121212' }}
        >
          <HangingFrameIcon />
          <div className="max-w-md mx-auto space-y-4">
            <h2 className="text-a1 text-white font-display">
              Frame it. Hang it.{'\n'}Treasure it forever
            </h2>
            <p className="text-body font-body text-white/70">
              Museum-grade archival canvas. Gallery-quality 12-color printing.{'\n'}Ready to display. Built to last 100 years.
            </p>
            <div className="space-y-3 pt-2">
              <button
                onClick={onGetFramed}
                className="btn-base btn-primary w-full"
              >
                Select Size Options ($79 - $179)
              </button>
              <button
                onClick={() => setShowEmailModal(true)}
                className="btn-base w-full"
                style={{
                  backgroundColor: '#333333',
                  color: '#FFFFFF',
                  border: 'none',
                }}
              >
                Download Preview (Free)
              </button>
            </div>
          </div>
        </div>

        {/* Trust badges — mobile only */}
        <div className="md:hidden px-6 py-6 text-center space-y-3">
          <p className="text-body-sm font-body text-surface-foreground">
            ✓ Free shipping · 📦 30-day guarantee · 🔒 Secure checkout
          </p>
          <div
            className="py-3 px-4 text-center"
            style={{ backgroundColor: '#DAEEFF', borderRadius: '2px' }}
          >
            <p className="text-body-sm font-body" style={{ color: '#333333' }}>
              🚀 Order by 5pm for same-day processing
            </p>
          </div>
          {onBackToStyle && (
            <button
              onClick={onBackToStyle}
              className="btn-base btn-tertiary"
              style={{ color: '#333333' }}
            >
              ↻ Try a Different Style
            </button>
          )}
         </div>

         {/* Testimonials — mobile */}
         <div className="md:hidden px-6">
           <TestimonialsSection />
         </div>
       </div>

      {/* Footer */}
      <Footer />

      {/* Email capture modal (placeholder) */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <h3 className="text-a2 font-display text-surface-foreground text-center">
              Get Your Free Preview
            </h3>
            <p className="text-body font-body text-surface-muted text-center">
              Enter your email to download the high-resolution preview.
            </p>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full border px-4 py-3 text-body font-body"
              style={{ borderColor: '#D4D4D4', borderRadius: '2px' }}
            />
            <button className="btn-base btn-primary w-full">
              Send My Preview
            </button>
            <button
              onClick={() => setShowEmailModal(false)}
              className="btn-base btn-tertiary w-full text-surface-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
