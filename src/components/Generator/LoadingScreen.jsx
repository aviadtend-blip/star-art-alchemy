import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import StepProgressBar from '@/components/ui/StepProgressBar';
import artistGif from '@/assets/artist-painting.gif';
import FloatingProgressBar from '@/components/Generator/FloatingProgressBar';
import { CANVAS_SIZES } from '@/lib/canvasSizes';

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
  Fire: 'bold, dynamic energy with striking intensity',
  Water: 'flowing, fluid forms with emotional depth',
  Earth: 'grounded, textured compositions with quiet strength',
  Air: 'light, layered compositions with elegant movement',
};

/**
 * Full-page loading screen shown between Step 2 and Step 3.
 * White background, spinner, progress bar, birth chart summary, cosmic profile.
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
  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerFading, setTickerFading] = useState(false);
  const [showFloating, setShowFloating] = useState(false);
  const progressBarRef = useRef(null);

  const [tickerMessages] = useState(() => {
    const names = ["Sarah", "Emily", "Jessica", "Maria", "Rachel", "Lauren", "Ashley", "Amanda", "Stephanie", "Nicole"];
    const cities = ["Austin", "Brooklyn", "Denver", "Portland", "Nashville", "London", "Toronto", "Seattle", "Chicago", "San Diego"];
    const sizes = CANVAS_SIZES.map((size) => size.label.replace(/"/g, ''));
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    return [
      "🎨 1,847 charts created this month",
      `📦 ${pick(names)} from ${pick(cities)} just ordered a ${pick(sizes)} canvas`,
      "⭐ 'The most personal gift I've ever given' — Emily R.",
      "🎨 2 charts created in the last hour",
      `📦 ${pick(names)} from ${pick(cities)} just ordered a ${pick(sizes)} canvas`,
      "⭐ 'My mom cried when she opened it' — Jessica T.",
      "🎨 Most popular size: 16×24 canvas",
      `📦 ${pick(names)} from ${pick(cities)} just ordered a ${pick(sizes)} canvas`,
    ];
  });

  const sunSign = chartData?.sun?.sign || 'your';

  const HEADLINES = [
    'Calculating planetary positions...',
    `Interpreting your ${sunSign} sun...`,
    'Weaving elemental symbolism...',
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

  // Social proof ticker rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerFading(true);
      setTimeout(() => {
        setTickerIndex((prev) => (prev + 1) % tickerMessages.length);
        setTickerFading(false);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, [tickerMessages.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev < HEADLINES.length - 1 ? prev + 1 : prev));
    }, 3000);
    return () => clearInterval(interval);
  }, [HEADLINES.length]);

  // Sequential reveal timers
  useEffect(() => {
    const delays = [300, 900, 1500, 2100, 2700, 3300];
    const timers = delays.map((delay, i) =>
      setTimeout(() => setVisibleSteps(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Cosmic Profile reveal timers
  useEffect(() => {
    const profileDelays = [4500, 5000, 8000, 11000, 14000];
    const timers = profileDelays.map((delay, i) =>
      setTimeout(() => setVisibleProfileLines(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // "What to Look For" reveal timers
  useEffect(() => {
    const hintDelays = [16000, 18000, 20000, 22000];
    const timers = hintDelays.map((delay, i) =>
      setTimeout(() => setVisibleHints(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Real progress bar: maps generationProgress to actual percentages
  // Format: "generating:N" where N is the poll count (each poll ~3 seconds)
  // Typical generation: 10-20 polls (30-60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        let target = 5; // default minimum

        if (generationProgress) {
          if (generationProgress.startsWith('generating:')) {
            const pollCount = parseInt(generationProgress.split(':')[1], 10) || 0;
            // Map poll count to progress: each poll ~3s, typical 30-60s total
            // Use a curve that fills quickly at first then slows down
            // pollCount 0 = 15%, 5 = 40%, 10 = 60%, 15 = 72%, 20 = 80%
            target = Math.min(15 + pollCount * 4.5 - (pollCount * pollCount * 0.05), 85);
            target = Math.max(target, 15);
          } else if (generationProgress.includes('Building')) {
            target = 8;
          } else if (generationProgress.includes('Submitting')) {
            target = 12;
          } else if (generationProgress.includes('Preparing your artwork')) {
            target = 88;
          } else if (generationProgress.includes('Preparing your artist')) {
            target = 93;
          }
        }

        // Cap at 95% until completion
        target = Math.min(target, 95);

        // Ease toward target smoothly
        if (prev >= target) return prev;
        return prev + (target - prev) * 0.12;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [generationProgress]);

  // Show floating bar when main progress bar scrolls out of view
  useEffect(() => {
    if (!progressBarRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFloating(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(progressBarRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle completion: jump to 100%, wait, then navigate
  useEffect(() => {
    if (!isComplete || hasTriggeredComplete.current) return;
    hasTriggeredComplete.current = true;
    setProgress(100);
    const t1 = setTimeout(() => setShowFinalizing(true), 500);
    const t2 = setTimeout(() => {
      onNavigateToPreview?.();
    }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isComplete, onNavigateToPreview]);

  const elements = chartData?.element_balance || {};
  const sortedElements = Object.entries(elements).sort(([, a], [, b]) => b - a);
  const dominantElements = sortedElements.filter(([, v]) => v === sortedElements[0]?.[1]).map(([k]) => k);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      <Header variant="dark" />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center w-full">

        {/* Spinner */}
        <div className="pt-[27px]">
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="17" stroke="#e5e7eb" strokeWidth="3" />
            </svg>
            <svg className="w-10 h-10 absolute inset-0 animate-spin" viewBox="0 0 40 40" fill="none" style={{ animationDuration: '1.2s' }}>
              <path
                d="M20 3a17 17 0 0 1 12 5"
                stroke="#fe6781"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Progress Bar (linear) */}
        <div ref={progressBarRef} className="flex flex-col gap-2 items-center mt-[27px]">
          <div className="w-[301px] h-[6px] bg-[#e5e7eb] rounded-[15px] overflow-hidden">
            <div
              className="h-full rounded-[15px] transition-all duration-500"
              style={{
                width: `${Math.min(progress, 100)}%`,
                background: 'linear-gradient(90deg, #FE6781, #E5507A)',
              }}
            />
          </div>
          <p className="text-body font-body text-surface-muted text-center">
            {Math.round(progress)}% complete
          </p>
        </div>

        {/* Status Message */}
        <div className="flex flex-col gap-2.5 items-center text-center w-[230px] pt-6">
          <h1 className="text-a2 text-surface-foreground font-display text-center transition-opacity duration-500">
            {showFinalizing ? 'Finalizing your artwork...' : HEADLINES[headlineIndex]}
          </h1>
          <p className="text-body font-body text-surface-muted">
            Typical generation time: 30-45 seconds
          </p>
        </div>

        {/* Birth Chart Summary */}
        {chartData && (
          <div className="flex flex-col items-center w-full px-5">
            <img
              src={artistGif}
              alt="Artist painting"
              className="w-[160px] h-auto rounded-md mt-[27px]"
            />
            <h2 className="text-a3 text-surface-foreground font-display text-center mt-12">
              Your Birth Chart Summary
            </h2>

            <div className="flex flex-col items-center mt-5 w-full max-w-[350px]">
              {/* Big Three — horizontal row */}
              <div
                className="flex gap-[25px] items-center justify-center py-2.5 rounded-[2px] w-full"
                style={{
                  opacity: visibleSteps >= 1 ? 1 : 0,
                  transform: visibleSteps >= 1 ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                }}
              >
                {[
                  { icon: '☀️', label: `Sun in ${chartData.sun?.sign}`, sub: `House ${chartData.sun?.house}` },
                  { icon: '🌙', label: `Moon in ${chartData.moon?.sign}`, sub: `House ${chartData.moon?.house}` },
                  { icon: '⬆️', label: `${chartData.rising} Rising`, sub: 'Your Ascendant' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-px"
                    style={{
                      opacity: visibleSteps >= i + 1 ? 1 : 0,
                      transform: visibleSteps >= i + 1 ? 'translateY(0)' : 'translateY(12px)',
                      transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                    }}
                  >
                    <span className="text-a5 text-surface-foreground font-display">{item.icon}</span>
                    <span className="text-a5 text-surface-foreground font-display">{item.label}</span>
                    <span className="text-body font-body text-surface-muted text-center">{item.sub}</span>
                  </div>
                ))}
              </div>

              {/* Element Balance — single row of 4 */}
              <div
                className="flex items-start w-full"
                style={{
                  opacity: visibleSteps >= 4 ? 1 : 0,
                  transform: visibleSteps >= 4 ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                }}
              >
                {['Fire', 'Water', 'Earth', 'Air'].map((key) => (
                  <div
                    key={key}
                    className="flex-1 flex flex-col items-center justify-center h-[80px] rounded-[2px]"
                  >
                    <span className="text-a5 text-surface-foreground font-display mb-3">{ELEMENT_ICONS[key]}</span>
                    <span className="text-a5 text-surface-foreground font-display text-center">
                      {key}: {elements[key] || 0}
                    </span>
                  </div>
                ))}
              </div>

              {/* Dominant elements banner */}
              {dominantElements.length > 0 && (
                <div
                  className="rounded-[2px] flex items-center justify-center p-2 w-full"
                  style={{
                    opacity: visibleSteps >= 5 ? 1 : 0,
                    transform: visibleSteps >= 5 ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                  }}
                >
                  <p className="text-body font-body text-surface-muted opacity-70 text-center">
                    Your dominant elements: {dominantElements.join(' & ')} → Expect{' '}
                    {dominantElements.map(e => ELEMENT_DESCRIPTIONS[e]).filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {/* Rarity highlight banner */}
              <div
                className="rounded-[2px] flex flex-col gap-2.5 items-center justify-center p-2 w-full mt-4"
                style={{
                  backgroundColor: '#daeeff',
                  opacity: visibleSteps >= 6 ? 1 : 0,
                  transform: visibleSteps >= 6 ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                }}
              >
                <p className="text-[20px] mb-1">💡</p>
                <p className="text-a4 text-surface-foreground font-display opacity-70 text-center w-full">
                  Only {rarityPct}% of people share your Sun‑Moon‑Rising combination
                </p>
                <p className="text-body font-body text-surface-muted opacity-70 text-center w-full">
                  Out of 1,728 possible combinations, yours is truly one of a kind
                </p>
              </div>
            </div>

            {/* Cosmic Profile + Look For */}
            <div className="flex flex-col gap-[27px] items-center w-full max-w-[350px] mt-[27px]">
              {/* Cosmic Profile */}
              <div className="flex flex-col gap-4 items-start text-center w-full">
                <h2
                  className="text-a3 text-surface-foreground font-display w-full"
                  style={{
                    opacity: visibleProfileLines >= 1 ? 1 : 0,
                    transform: visibleProfileLines >= 1 ? 'translateY(0)' : 'translateY(12px)',
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                  }}
                >
                  Your Cosmic Profile
                </h2>
                <div className="text-body font-body text-surface-foreground opacity-70 w-full">
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
                        className={i < 3 ? 'mb-3' : ''}
                        style={{
                          opacity: visibleProfileLines >= i + 2 ? 1 : 0,
                          transform: visibleProfileLines >= i + 2 ? 'translateY(0)' : 'translateY(12px)',
                          transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                        }}
                      >
                        {line}
                      </p>
                    ))}
                </div>
              </div>

              {/* Look For */}
              <div className="flex flex-col gap-4 items-start text-center w-full">
                <h2
                  className="text-a3 text-surface-foreground font-display w-full"
                  style={{
                    opacity: visibleHints >= 1 ? 1 : 0,
                    transform: visibleHints >= 1 ? 'translateY(0)' : 'translateY(12px)',
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                  }}
                >
                  🔍 When your artwork appears, look for...
                </h2>
                <div className="text-body font-body text-surface-foreground opacity-70 w-full">
                  {(() => {
                    const ELEMENT_HINTS = {
                      Fire: "Bold, striking imagery — intense forms and dynamic shapes reflecting your fire energy",
                      Earth: "Rich, grounded textures — layered materials and organic forms from your earth placements",
                      Air: "Light, layered compositions — delicate structures and flowing movement echoing your air-dominant chart",
                      Water: "Fluid, flowing forms — deep currents and layered depths channeling your water energy",
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
                        className={i < hints.length - 1 ? 'mb-3' : ''}
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

              {/* Data points banner */}
              <div
                className="rounded-[2px] flex items-center justify-center p-2 w-full"
                style={{ backgroundColor: '#daeeff' }}
              >
                <p
                  className="text-body font-body text-surface-muted opacity-70 text-center w-full"
                  style={{
                    opacity: factFading ? 0 : 1,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  {FUN_FACTS[factIndex].startsWith('Fun fact') ? '💡 ' : ''}{FUN_FACTS[factIndex]}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Social proof ticker */}
        <div
          className="w-full py-3 text-center mt-[27px]"
          style={{ borderTop: '1px solid #EBEBEB', backgroundColor: '#FAFAFA' }}
        >
          <p
            className="text-body font-body text-surface-muted"
            style={{
              opacity: tickerFading ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            {tickerMessages[tickerIndex]}
          </p>
        </div>
      </div>

      {/* Floating progress bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out"
        style={{
          transform: showFloating ? 'translateY(0)' : 'translateY(100%)',
          opacity: showFloating ? 1 : 0,
        }}
      >
        <FloatingProgressBar
          progress={progress}
          statusText={tickerMessages[tickerIndex]}
        />
      </div>

      <Footer />
    </div>
  );
}
