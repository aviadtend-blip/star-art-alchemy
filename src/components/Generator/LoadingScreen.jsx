import { useState, useEffect } from 'react';
import ProgressBar from '@/components/ui/ProgressBar';

const FUN_FACTS = [
  "Fun fact: Your chart has never been created as artwork before today.",
  "We're incorporating 12+ astrological data points into your design.",
  "Each element you see will have meaning tied to your birth moment.",
];

/**
 * Full-page loading screen shown between Step 2 and Step 3.
 * Displays chart summary, element balance, and rotating fun facts.
 */
export default function LoadingScreen({ chartData, selectedStyle, generationProgress }) {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Determine dominant elements
  const elements = chartData?.element_balance || {};
  const sortedElements = Object.entries(elements).sort(([, a], [, b]) => b - a);
  const dominantElements = sortedElements.filter(([, v]) => v === sortedElements[0]?.[1]).map(([k]) => k);

  const elementDescriptions = {
    Fire: 'warm, bold tones with dynamic energy',
    Water: 'deep blues and flowing, fluid forms',
    Earth: 'rich textures and grounded materials',
    Air: 'light, airy compositions with soft gradients',
  };

  return (
    <div className="min-h-screen bg-cosmic flex flex-col">
      <ProgressBar currentStep={2} />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Headline */}
        <h2 className="font-display text-3xl md:text-4xl text-foreground text-center mb-2">
          Calculating planetary positions...
        </h2>
        <p className="text-muted-foreground font-body text-sm mb-10">Typical generation time: 30-45 seconds</p>

        {/* Spinner */}
        <div className="relative w-20 h-20 mb-10">
          <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-3 border border-accent/30 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "2s" }} />
        </div>

        {/* Big Three Cards */}
        {chartData && (
          <div className="w-full max-w-3xl space-y-8 mb-10">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">☀️</div>
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-body">Sun</span>
                <span className="block text-lg text-foreground capitalize font-display mt-1">{chartData.sun.sign}</span>
                <span className="text-xs text-muted-foreground font-body">House {chartData.sun.house}</span>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">🌙</div>
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-body">Moon</span>
                <span className="block text-lg text-foreground capitalize font-display mt-1">{chartData.moon.sign}</span>
                <span className="text-xs text-muted-foreground font-body">House {chartData.moon.house}</span>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">⬆️</div>
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-body">Rising</span>
                <span className="block text-lg text-foreground capitalize font-display mt-1">{chartData.rising}</span>
                <span className="text-xs text-muted-foreground font-body">Ascendant</span>
              </div>
            </div>

            {/* Element Balance */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { key: 'Fire', icon: '🔥' },
                { key: 'Water', icon: '💧' },
                { key: 'Earth', icon: '🌍' },
                { key: 'Air', icon: '💨' },
              ].map(({ key, icon }) => (
                <div key={key} className="bg-card border border-border rounded-lg p-3 text-center">
                  <span className="text-lg">{icon}</span>
                  <span className="block text-xs text-muted-foreground font-body mt-1">{key}</span>
                  <span className="block text-lg text-foreground font-display">{elements[key] || 0}</span>
                </div>
              ))}
            </div>

            {/* Dominant Element Callout */}
            {dominantElements.length > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-sm text-foreground font-body">
                  Your dominant element{dominantElements.length > 1 ? 's' : ''}:{' '}
                  <span className="text-primary font-semibold">{dominantElements.join(' & ')}</span>
                </p>
                <p className="text-xs text-muted-foreground font-body mt-1">
                  Expect {dominantElements.map(e => elementDescriptions[e]).join(' blended with ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Progress text */}
        <p className="text-primary text-sm font-body mb-6">{generationProgress}</p>

        {/* Rotating Fun Facts */}
        <div className="bg-accent/10 border border-accent/20 rounded-xl px-6 py-3 max-w-lg transition-all">
          <p className="text-sm text-foreground/80 font-body text-center">
            💡 {FUN_FACTS[factIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
