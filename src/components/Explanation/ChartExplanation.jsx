import { generateChartExplanation } from '@/lib/explanations/generateExplanation';
import { useState, useEffect } from 'react';

export function ChartExplanation({ chartData, selectedImage, onGetFramed }) {
  const explanation = generateChartExplanation(chartData);
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = selectedImage;
    a.download = `birth-chart-${chartData.sun.sign.toLowerCase()}.png`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent mb-4">
          Your Personalized Birth Chart Artwork
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
          {explanation.overview}
        </p>
      </div>

      {/* Purchase CTA */}
      <div className="max-w-lg mx-auto mb-12 bg-card border border-primary/20 rounded-xl p-8 text-center space-y-4 border-glow">
        <h3 className="font-display text-2xl text-foreground">Own This Artwork</h3>
        <p className="text-muted-foreground font-body text-sm">
          Museum-quality prints on archival paper, hand-framed to perfection.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onGetFramed}
            className="bg-primary text-primary-foreground font-display text-lg px-8 py-3 rounded-lg hover:opacity-90 transition-opacity tracking-wide"
          >
            Get This Framed →
          </button>
          <button
            onClick={handleDownload}
            className="border border-border text-muted-foreground font-body text-sm px-6 py-3 rounded-lg hover:border-primary hover:text-primary transition-colors"
          >
            Download Preview (Free)
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-body">
          ✓ Free shipping • ↩️ 30-day guarantee • 🔒 Secure checkout
        </p>
      </div>

      {/* Quick Reference */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-amber-500/10 rounded-xl p-6 mb-12">
        <h3 className="text-center font-semibold text-foreground mb-4">Your Birth Chart Summary</h3>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-card/60 border border-border rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl mb-2">☀️</div>
            <div className="font-bold text-foreground">Sun in {chartData.sun.sign}</div>
            <div className="text-sm text-muted-foreground">House {chartData.sun.house}</div>
          </div>
          <div className="bg-card/60 border border-border rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl mb-2">🌙</div>
            <div className="font-bold text-foreground">Moon in {chartData.moon.sign}</div>
            <div className="text-sm text-muted-foreground">House {chartData.moon.house}</div>
          </div>
          <div className="bg-card/60 border border-border rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl mb-2">⬆️</div>
            <div className="font-bold text-foreground">{chartData.rising} Rising</div>
            <div className="text-sm text-muted-foreground">Your Ascendant</div>
          </div>
        </div>

        {/* Element Balance */}
        <div className="mt-6 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">Elemental Balance:</p>
          <div className="flex justify-center gap-4 text-sm text-foreground">
            <span>🔥 Fire: {chartData.element_balance.Fire}</span>
            <span>💧 Water: {chartData.element_balance.Water}</span>
            <span>🌍 Earth: {chartData.element_balance.Earth}</span>
            <span>💨 Air: {chartData.element_balance.Air}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Image + Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col items-center">
          <div className="rounded-xl overflow-hidden border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
            <img src={selectedImage} alt="Your natal chart artwork" className="w-full h-auto max-w-md" />
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center italic">
            Generated with magical pink watercolor LoRA based on your unique natal chart
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-amber-300 mb-4">
            How Your Chart Influenced This Artwork
          </h3>

          {explanation.elements.map((element, index) => (
            <div key={index} className="rounded-lg border border-amber-500/10 bg-card/50 backdrop-blur-sm p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{element.icon}</span>
                <div>
                  <h4 className="text-base font-semibold text-foreground">{element.title}</h4>
                  <p className="text-xs text-muted-foreground">{element.subtitle}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{element.explanation}</p>
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Visual Cues</span>
                <ul className="space-y-1">
                  {element.visualCues.map((cue, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{cue}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs italic text-amber-200/60 border-t border-amber-500/10 pt-2">{element.meaning}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-lg mx-auto mt-16 text-center space-y-4">
        <h3 className="font-display text-2xl text-foreground">Ready to own this artwork?</h3>
        <button
          onClick={onGetFramed}
          className="bg-primary text-primary-foreground font-display text-xl px-10 py-4 rounded-lg hover:opacity-90 transition-opacity tracking-wide border-glow"
        >
          Choose Size & Frame →
        </button>
      </div>

      {/* Sticky Bottom CTA */}
      {showStickyCTA && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border py-3 px-4 z-50 animate-fade-in">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedImage && (
                <img src={selectedImage} alt="" className="w-10 h-10 rounded object-cover" />
              )}
              <div>
                <p className="text-sm text-foreground font-body font-medium">Your Birth Chart Artwork</p>
                <p className="text-xs text-muted-foreground font-body">{chartData.sun.sign} Sun • {chartData.moon.sign} Moon</p>
              </div>
            </div>
            <button
              onClick={onGetFramed}
              className="bg-primary text-primary-foreground font-display px-6 py-2 rounded-lg hover:opacity-90 transition-opacity tracking-wide text-sm"
            >
              Choose Size & Frame →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
