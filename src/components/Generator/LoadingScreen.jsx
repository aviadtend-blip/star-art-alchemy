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
