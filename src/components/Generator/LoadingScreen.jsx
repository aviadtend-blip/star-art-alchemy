import { useState, useEffect } from 'react';
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
export default function LoadingScreen({ chartData, selectedStyle, generationProgress }) {
  const [factIndex, setFactIndex] = useState(0);
  const [headlineIndex, setHeadlineIndex] = useState(0);

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
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev < HEADLINES.length - 1 ? prev + 1 : prev));
    }, 3000);
    return () => clearInterval(interval);
  }, [HEADLINES.length]);

  const elements = chartData?.element_balance || {};
  const sortedElements = Object.entries(elements).sort(([, a], [, b]) => b - a);
  const dominantElements = sortedElements.filter(([, v]) => v === sortedElements[0]?.[1]).map(([k]) => k);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <nav className="flex items-center justify-between" style={{ backgroundColor: '#121212', padding: '26px 30px' }}>
        <div className="text-a4 text-white font-display">Celestial Artworks</div>
        <button className="text-white/70 hover:text-white transition">
          <div className="space-y-1.5">
            <div className="w-6 h-0.5 bg-current" />
            <div className="w-6 h-0.5 bg-current" />
          </div>
        </button>
      </nav>


      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 py-12 max-w-lg mx-auto w-full">
        {/* Headline */}
        <h2 className="text-a2 text-surface-foreground font-display text-center mb-2 transition-opacity duration-500">
          {HEADLINES[headlineIndex]}
        </h2>
        <p className="text-body font-body text-surface-muted mb-12">
          Typical generation time: 30-45 seconds
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
                { icon: '☀️', label: `Sun in ${chartData.sun?.sign}`, sub: `House ${chartData.sun?.house}` },
                { icon: '🌙', label: `Moon in ${chartData.moon?.sign}`, sub: `House ${chartData.moon?.house}` },
                { icon: '⬆️', label: `${chartData.rising} Rising`, sub: 'Your Ascendant' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center py-5 px-4"
                  style={{ backgroundColor: '#F9F5F0', borderRadius: '2px' }}
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="text-a5 text-surface-foreground font-display">{item.label}</span>
                  <span className="text-body font-body text-surface-muted">{item.sub}</span>
                </div>
              ))}
            </div>

            {/* Element Balance — 2×2 grid */}
            <div className="grid grid-cols-2 gap-3">
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
                style={{ backgroundColor: '#F0F0F0', borderRadius: '2px' }}
              >
                <p className="text-body-sm font-body text-surface-foreground">
                  Your dominant elements: {dominantElements.join(' & ')} → Expect{' '}
                  {dominantElements.map(e => ELEMENT_DESCRIPTIONS[e]).filter(Boolean).join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Rotating Fun Facts */}
        <div
          className="w-full py-4 px-5 text-center"
          style={{ backgroundColor: '#FFF5DD', borderRadius: '2px' }}
        >
          <p className="text-body-sm font-body" style={{ color: '#C99700' }}>
            {FUN_FACTS[factIndex].startsWith('Fun fact') ? '💡 ' : ''}{FUN_FACTS[factIndex]}
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
