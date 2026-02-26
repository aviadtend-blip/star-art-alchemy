import { useState, useEffect, useRef } from 'react';
import { generateChartExplanation } from '@/lib/explanations/generateExplanation';
import StepProgressBar from '@/components/ui/StepProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';
import Footer from '@/components/Layout/Footer';
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
        {/* Nail */}
        <circle cx="24" cy="3" r="2.5" fill="#FFBF00" />
        {/* String */}
        <path d="M24 5.5 L14 18 M24 5.5 L34 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        {/* Frame */}
        <rect x="8" y="18" width="32" height="34" rx="2" stroke="white" strokeWidth="2.5" fill="none" opacity="0.95" />
        {/* Inner frame */}
        <rect x="12" y="22" width="24" height="26" rx="1" stroke="white" strokeWidth="1.25" fill="none" opacity="0.6" />
        {/* Mountain scene inside */}
        <path d="M14 42 L20 32 L24 36 L30 28 L34 42 Z" fill="white" opacity="0.25" />
        {/* Sun */}
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

  const staticPositions = getStaticPositions(chartData);

  const hotspots = explanation.elements.map((el, i) => ({
    ...el,
    id: i + 1,
    position: el.aiPosition || staticPositions[i] || { top: '50%', left: '50%' },
  }));

  const active = hotspots.find((h) => h.id === activeHotspot);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
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

      {/* Progress bar */}
      <StepProgressBar currentStep={2} />

      {/* Main content */}
      <div className="flex-1">
        {/* Hero heading */}
        <div className="text-center px-6 pt-12 pb-8">
          <h1 className="text-a1 text-surface-foreground font-display mb-3">
            Meet Your Cosmic{'\n'}Masterpiece
          </h1>
          <p className="text-body font-body text-surface-muted max-w-sm mx-auto">
            Tap a number to see why each element was chosen — every detail was inspired by your birth chart.
          </p>
        </div>

        {/* Artwork with hotspots */}
        <div className="px-6 max-w-md mx-auto">
          <div className="relative">
            <img
              src={selectedImage}
              alt={`Birth chart artwork for ${chartData.sun.sign} Sun`}
              className="w-full"
              style={{ borderRadius: '2px' }}
            />
            {/* Hotspot markers */}
            {hotspots.map((h) => (
              <button
                key={h.id}
                onClick={() => setActiveHotspot(activeHotspot === h.id ? null : h.id)}
                className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-display transition-all duration-200 cursor-pointer z-10 ${
                  activeHotspot === h.id
                    ? 'bg-white text-surface-foreground scale-110 shadow-lg'
                    : 'bg-surface-foreground/80 text-white hover:scale-110'
                }`}
                style={{ top: h.position.top, left: h.position.left, transform: 'translate(-50%, -50%)' }}
                aria-label={`Hotspot ${h.id}: ${h.title}`}
              >
                {h.id}
              </button>
            ))}
          </div>

          {/* Hotspot explanation — mobile tap reveal */}
          <div className="mt-6 min-h-[120px]">
            {active ? (
              <div className="animate-fade-in text-center" key={active.id}>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-display"
                    style={{ backgroundColor: '#121212', color: '#FFFFFF' }}
                  >
                    {active.id}
                  </span>
                  <span className="text-lg">{active.icon}</span>
                  <span className="text-a5 text-surface-foreground font-display">
                    {active.title}
                  </span>
                </div>
                <p className="text-body font-body text-surface-muted leading-relaxed mb-2">
                  {active.explanation}
                </p>
                <p className="text-body font-body text-surface-muted leading-relaxed">
                  {active.meaning}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-surface-muted">
                <span className="text-xl">👆</span>
                <p className="text-body font-body">
                  Tap a number to see the artist's notes.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CTA Banner — dark with starfield */}
        <div
          className="mt-12 py-12 px-6 text-center bg-cover bg-center"
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

        {/* Trust badges */}
        <div className="px-6 py-6 text-center space-y-3">
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

        {/* Testimonials */}
        <div className="px-6 pb-12">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg" style={{ color: '#FFBF00' }}>★★★★★</span>
            <span className="text-a2 font-display text-surface-foreground">4.9/5</span>
          </div>
          <p className="text-subtitle text-surface-muted tracking-widest mb-4">
            FROM 287 CUSTOMERS
          </p>

          {/* Horizontal scroll cards */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-6 px-6 snap-x snap-mandatory">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[200px] snap-center"
                style={{ borderRadius: '2px', overflow: 'hidden' }}
              >
                <img
                  src={t.img}
                  alt={t.name}
                  className="w-full h-[160px] object-cover"
                />
                <div className="p-3" style={{ backgroundColor: '#F9F5F0' }}>
                  <p className="text-body-sm font-body text-surface-foreground mb-2 line-clamp-3">
                    {t.quote}
                  </p>
                  <p className="text-subtitle text-surface-foreground" style={{ fontSize: '10px' }}>
                    {t.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
