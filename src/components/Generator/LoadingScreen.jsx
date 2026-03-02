import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';

const FUN_FACTS = [
  "Fun fact: Your chart has never been created as artwork before today.",
  "We're incorporating 12+ astrological data points into your design.",
  "Each element you see will have meaning tied to your birth moment.",
];

const ELEMENT_ICONS = {
  Fire: '🔥',
  Water: '💧',
  Earth: '🌍',
  Air: '💨',
};

const SUN_TRAITS = {
  Aries: "you lead with instinct — decisions come fast and rarely wrong",
  Taurus: "you build things that last — patience is your quiet superpower",
  Gemini: "you see every side of everything — your mind never stops connecting dots",
  Cancer: "you feel the room before you enter it — emotional intelligence is your first language",
  Leo: "you were born to be seen — not from ego, but because your energy genuinely lights things up",
  Virgo: "you notice what others miss — the details matter and you know why",
  Libra: "you seek harmony instinctively — beauty and balance aren't luxuries to you, they're necessities",
  Scorpio: "you go deeper than most people dare — surface-level has never been enough",
  Sagittarius: "you need meaning more than comfort — the big questions keep you moving forward",
  Capricorn: "you play the long game — discipline isn't forced, it's just how you're wired",
  Aquarius: "you think in systems others can't see yet — being ahead of your time is lonely but natural",
  Pisces: "boundaries blur for you in the most beautiful way — empathy is your art form",
};

const MOON_TRAITS = {
  Aries: "your emotional reactions are instant and honest — you process by doing, not dwelling",
  Taurus: "you need emotional stability like oxygen — once you feel safe, you're unshakable",
  Gemini: "your inner world moves fast — you process emotions by talking them through",
  Cancer: "your emotional depth is oceanic — you remember how things felt long after others forget",
  Leo: "you need to feel appreciated at your core — recognition isn't vanity, it's emotional fuel",
  Virgo: "you analyze your feelings before you feel them — your inner world is precise and sometimes overthought",
  Libra: "you process emotions through relationships — being understood by someone is how you understand yourself",
  Scorpio: "your emotional life runs deep and private — you feel everything at full intensity but show almost nothing",
  Sagittarius: "your emotions need space and movement — you heal through adventure and new perspectives",
  Capricorn: "you handle emotions with composure — people think you're stoic but you just process privately",
  Aquarius: "you observe your own emotions from a distance — feeling things doesn't mean being controlled by them",
  Pisces: "your emotional world has no walls — you absorb what others feel and sometimes lose yourself in it",
};

const RISING_TRAITS = {
  Aries: "bold, direct, and a little intimidating — you walk into rooms like you own them",
  Taurus: "calm, grounded, and effortlessly put-together — people feel stable around you",
  Gemini: "quick, curious, and instantly engaging — you make everyone feel like the conversation just got interesting",
  Cancer: "warm, approachable, and nurturing — strangers open up to you without knowing why",
  Leo: "magnetic, confident, and impossible to ignore — you have natural presence",
  Virgo: "composed, thoughtful, and quietly competent — people trust your judgment immediately",
  Libra: "graceful, charming, and diplomatically skilled — you make hard things look easy",
  Scorpio: "intense, perceptive, and a little mysterious — people sense there's much more beneath the surface",
  Sagittarius: "adventurous, optimistic, and free-spirited — your enthusiasm is genuinely contagious",
  Capricorn: "serious, capable, and quietly ambitious — people respect you before they even know you",
  Aquarius: "unique, independent, and slightly unconventional — you stand out without trying",
  Pisces: "dreamy, gentle, and subtly creative — there's something ethereal about your presence",
};

const ELEMENT_TRAITS = {
  Fire: "a warmth and urgency — you don't just exist, you burn",
  Earth: "a grounded solidity — you build real things in a world of noise",
  Air: "an intellectual electricity — ideas are your native currency",
  Water: "an emotional depth — you navigate by feeling what others only think about",
};

const ELEMENT_DESCRIPTIONS = {
  Fire: 'warm, bold tones with dynamic energy',
  Water: 'deep blues and flowing, fluid forms',
  Earth: 'grounded, intellectual aesthetics',
  Air: 'light, airy compositions with soft gradients',
};

/**
 * Full-page loading screen shown between Step 2 and Step 3.
 * White background, header, progress bar, circular spinner,
 * stacked Big Three cards, 2×2 element grid, dominant callout, fun facts.
 */
export default function LoadingScreen({ chartData, selectedStyle, generationProgress, isComplete, onNavigateToPreview }) {
  const [factIndex, setFactIndex] = useState(0);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showFinalizing, setShowFinalizing] = useState(false);
  const [factFading, setFactFading] = useState(false);
  const startTime = useRef(Date.now());
  const hasTriggeredComplete = useRef(false);
  const [rarityPct] = useState(() => (Math.random() * 0.03 + 0.04).toFixed(2));
  const [visibleProfileLines, setVisibleProfileLines] = useState(0);
  const [visibleHints, setVisibleHints] = useState(0);

  const sunSign = chartData?.sun?.sign || 'your';

  const HEADLINES = [
    'Calculating planetary positions...',
    `Interpreting your ${sunSign} sun...`,
    'Balancing elemental colors...',
    'Finalizing cosmic geometry...',
    'Almost ready!',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setFactFading(true);
      setTimeout(() => {
        setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
        setFactFading(false);
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev < HEADLINES.length - 1 ? prev + 1 : prev));
    }, 3000);
    return () => clearInterval(interval);
  }, [HEADLINES.length]);

  // Sequential reveal timers
  useEffect(() => {
    const delays = [500, 1500, 2500, 3500, 4500, 5750];
    const timers = delays.map((delay, i) =>
      setTimeout(() => setVisibleSteps(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Cosmic Profile reveal timers
  useEffect(() => {
    const profileDelays = [7500, 8000, 13000, 18000, 23000]; // header at 7.5s, lines at 8s, 13s, 18s, 23s
    const timers = profileDelays.map((delay, i) =>
      setTimeout(() => setVisibleProfileLines(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // "What to Look For" reveal timers
  useEffect(() => {
    const hintDelays = [26000, 29000, 32000, 35000]; // header at 26s, hints at 29s, 32s, 35s
    const timers = hintDelays.map((delay, i) =>
      setTimeout(() => setVisibleHints(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Simulated progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      let p;
      if (elapsed <= 5) p = (elapsed / 5) * 30;
      else if (elapsed <= 15) p = 30 + ((elapsed - 5) / 10) * 25;
      else if (elapsed <= 30) p = 55 + ((elapsed - 15) / 15) * 20;
      else if (elapsed <= 45) p = 75 + ((elapsed - 30) / 15) * 10;
      else p = 85 + Math.min((elapsed - 45) / 30, 1) * 3;
      setProgress(Math.min(p, 88));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Handle completion: jump to 100%, wait, then navigate
  useEffect(() => {
    if (!isComplete || hasTriggeredComplete.current) return;
    hasTriggeredComplete.current = true;
    setProgress(100);
    const t1 = setTimeout(() => setShowFinalizing(true), 500);
    const t2 = setTimeout(() => {
      onNavigateToPreview?.();
    }, 2000); // 500ms pause + 1500ms "Finalizing" text
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isComplete, onNavigateToPreview]);

  const elements = chartData?.element_balance || {};
  const sortedElements = Object.entries(elements).sort(([, a], [, b]) => b - a);
  const dominantElements = sortedElements.filter(([, v]) => v === sortedElements[0]?.[1]).map(([k]) => k);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <Header variant="dark" />


      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 py-12 max-w-lg mx-auto w-full">
        {/* Headline */}
        <h2 className="text-a2 text-surface-foreground font-display text-center mb-2 transition-opacity duration-500">
          {showFinalizing ? 'Finalizing your artwork...' : HEADLINES[headlineIndex]}
        </h2>
        <p className="text-body font-body text-surface-muted mb-6">
          Typical generation time: 30-45 seconds
        </p>

        {/* Progress bar */}
        <div className="w-full mb-2" style={{ height: 6, backgroundColor: '#E5E7EB', borderRadius: 9999 }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              borderRadius: 9999,
              background: 'linear-gradient(90deg, #FE6781, #E5507A)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <p className="text-body-sm font-body text-surface-muted mb-10">
          {Math.round(progress)}% complete
        </p>

        {/* Circular spinner */}
        <div className="relative w-16 h-16 mb-12">
          {/* Track */}
          <svg className="w-full h-full" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#F5F5F5" strokeWidth="4" />
          </svg>
          {/* Animated arc */}
          <svg className="w-full h-full absolute inset-0 animate-spin" viewBox="0 0 64 64" style={{ animationDuration: '1.2s' }}>
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke="#FE6781" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="44 132"
            />
          </svg>
        </div>

        {/* Birth Chart Summary */}
        {chartData && (
          <div className="w-full space-y-3 mb-8">
             <h3 className="text-a2 text-surface-foreground font-display text-center mb-4">
               Your Birth Chart Summary
             </h3>

            {/* Big Three — stacked cards */}
            <div className="space-y-3">
              {[
                { icon: '☀️', label: `Sun in ${chartData.sun?.sign}`, sub: `House ${chartData.sun?.house}`, step: 1 },
                { icon: '🌙', label: `Moon in ${chartData.moon?.sign}`, sub: `House ${chartData.moon?.house}`, step: 2 },
                { icon: '⬆️', label: `${chartData.rising} Rising`, sub: 'Your Ascendant', step: 3 },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center py-5 px-4"
                  style={{
                    backgroundColor: '#F9F5F0',
                    borderRadius: '2px',
                    opacity: visibleSteps >= item.step ? 1 : 0,
                    transform: visibleSteps >= item.step ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                  }}
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="text-a5 text-surface-foreground font-display">{item.label}</span>
                  <span className="text-body font-body text-surface-muted">{item.sub}</span>
                </div>
              ))}
            </div>

            {/* Element Balance — 2×2 grid */}
            <div
              className="grid grid-cols-2 gap-3"
              style={{
                opacity: visibleSteps >= 4 ? 1 : 0,
                transform: visibleSteps >= 4 ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
              }}
            >
              {['Fire', 'Water', 'Earth', 'Air'].map((key) => (
                <div
                  key={key}
                  className="flex flex-col items-center py-4 px-3"
                  style={{ backgroundColor: '#F9F5F0', borderRadius: '2px' }}
                >
                  <span className="text-xl mb-1">{ELEMENT_ICONS[key]}</span>
                  <span className="text-a5 text-surface-foreground font-display">
                    {key}: {elements[key] || 0}
                  </span>
                </div>
              ))}
            </div>

            {/* Dominant Element Callout */}
            {dominantElements.length > 0 && (
              <div
                className="py-4 px-5 text-center"
                style={{
                  backgroundColor: '#F0F0F0',
                  borderRadius: '2px',
                  opacity: visibleSteps >= 5 ? 1 : 0,
                  transform: visibleSteps >= 5 ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                }}
              >
                <p className="text-body-sm font-body text-surface-foreground">
                  Your dominant elements: {dominantElements.join(' & ')} → Expect{' '}
                  {dominantElements.map(e => ELEMENT_DESCRIPTIONS[e]).filter(Boolean).join(', ')}
                </p>
              </div>
            )}

            {/* Rarity card */}
            <div
              className="py-5 px-5 text-center"
              style={{
                background: 'linear-gradient(135deg, #FFF8F0, #FFF0F5)',
                borderRadius: '2px',
                border: '1px solid rgba(254, 103, 129, 0.25)',
                opacity: visibleSteps >= 6 ? 1 : 0,
                transform: visibleSteps >= 6 ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
              }}
            >
              <span className="text-2xl mb-1 block">✨</span>
              <p className="text-a5 text-surface-foreground font-display mb-1">
                Only {rarityPct}% of people share your Sun‑Moon‑Rising combination
              </p>
              <p className="text-body-sm font-body text-surface-muted">
                Out of 1,728 possible combinations, yours is truly one of a kind
              </p>
            </div>

            {/* Your Cosmic Profile */}
            <div className="w-full space-y-4 mt-4">
              {/* Section header */}
              <h3
                className="text-a3 text-surface-foreground font-display text-center"
                style={{
                  opacity: visibleProfileLines >= 1 ? 1 : 0,
                  transform: visibleProfileLines >= 1 ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                }}
              >
                ✨ Your Cosmic Profile
              </h3>

              {/* Personality lines */}
              {[
                chartData.sun?.sign && SUN_TRAITS[chartData.sun.sign]
                  ? `Your ${chartData.sun.sign} Sun suggests ${SUN_TRAITS[chartData.sun.sign]}`
                  : null,
                chartData.moon?.sign && MOON_TRAITS[chartData.moon.sign]
                  ? `With a ${chartData.moon.sign} Moon, your inner world — ${MOON_TRAITS[chartData.moon.sign]}`
                  : null,
                chartData.rising && RISING_TRAITS[chartData.rising]
                  ? `A ${chartData.rising} Rising means others first see you as ${RISING_TRAITS[chartData.rising]}`
                  : null,
                dominantElements[0] && ELEMENT_TRAITS[dominantElements[0]]
                  ? `Your ${dominantElements[0]}-dominant chart gives everything ${ELEMENT_TRAITS[dominantElements[0]]}`
                  : null,
              ]
                .filter(Boolean)
                .map((line, i) => (
                  <p
                    key={i}
                    className="text-body font-body text-surface-foreground text-center leading-relaxed"
                    style={{
                      fontStyle: 'italic',
                      opacity: visibleProfileLines >= i + 2 ? 1 : 0,
                      transform: visibleProfileLines >= i + 2 ? 'translateY(0)' : 'translateY(12px)',
                      transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                    }}
                  >
                    {line}
                  </p>
                ))}
            </div>

            {/* What to Look For */}
            <div
              className="w-full mt-6 py-5 px-5 space-y-4"
              style={{
                border: '1.5px dashed rgba(254, 103, 129, 0.35)',
                borderRadius: '4px',
                backgroundColor: '#FDFBF9',
              }}
            >
              <h3
                className="text-a4 text-surface-foreground font-display text-center"
                style={{
                  opacity: visibleHints >= 1 ? 1 : 0,
                  transform: visibleHints >= 1 ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                }}
              >
                🔍 When your artwork appears, look for...
              </h3>

              {(() => {
                const ELEMENT_HINTS = {
                  Fire: "Bold, warm tones — reds, oranges, and golds reflecting your fire energy",
                  Earth: "Rich, grounded textures — deep greens, browns, and amber from your earth placements",
                  Air: "Light, layered compositions — cool blues and silvers echoing your air-dominant chart",
                  Water: "Fluid, flowing forms — deep blues and teals channeling your water energy",
                };
                const planetKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
                const planetCount = chartData ? planetKeys.filter(k => chartData[k]?.sign).length : 10;
                const elementHint = ELEMENT_HINTS[dominantElements[0]] || ELEMENT_HINTS.Fire;

                const hints = [
                  `→ ${elementHint}`,
                  `→ Layered details representing your ${planetCount} planetary placements — each one means something`,
                  `→ A composition that's never existed before and never will again — this is yours alone`,
                ];

                return hints.map((hint, i) => (
                  <p
                    key={i}
                    className="text-body font-body text-surface-foreground text-center leading-relaxed"
                    style={{
                      opacity: visibleHints >= i + 2 ? 1 : 0,
                      transform: visibleHints >= i + 2 ? 'translateY(0)' : 'translateY(12px)',
                      transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                    }}
                  >
                    {hint}
                  </p>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Rotating Fun Facts */}
        <div
          className="w-full py-4 px-5 text-center"
          style={{ backgroundColor: '#DAEEFF', borderRadius: '2px' }}
        >
          <p
            className="text-body-sm font-body"
            style={{
              color: '#333333',
              opacity: factFading ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            {FUN_FACTS[factIndex].startsWith('Fun fact') ? '💡 ' : ''}{FUN_FACTS[factIndex]}
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
