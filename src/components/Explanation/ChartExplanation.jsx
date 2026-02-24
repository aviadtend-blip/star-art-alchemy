import { generateChartExplanation } from '@/lib/explanations/generateExplanation';
import { useState, useEffect } from 'react';
import BirthDataBar from '@/components/ui/BirthDataBar';
import ProgressBar from '@/components/ui/ProgressBar';

export function ChartExplanation({ chartData, selectedImage, onGetFramed, formData, onEditBirthData }) {
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
    <>
      <ProgressBar currentStep={3} />
      <BirthDataBar formData={formData} onEdit={onEditBirthData} />

      <div className="px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-a2 md:text-4xl text-foreground mb-4">
          Meet Your Cosmic <span className="text-primary text-glow">Masterpiece</span>
        </h2>
        <p className="text-body text-muted-foreground max-w-2xl mx-auto">
          Every symbol, color, and shape represents your exact planetary positions at birth.
        </p>
      </div>

      {/* CTA Banner */}
      <div className="max-w-lg mx-auto mb-12 bg-cosmic border border-primary/20 rounded-xl p-8 text-center space-y-4 border-glow">
        <h3 className="text-a2 text-foreground">Frame it. Hang it. Treasure it forever.</h3>
        <p className="text-body-sm text-muted-foreground">
          Gallery-quality printing. Museum-quality canvas. Ready to hang. Built to last 100 years.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onGetFramed}
            className="bg-primary text-primary-foreground text-a4 px-8 py-3 rounded-lg hover:opacity-90 transition-opacity tracking-wide border-glow"
          >
            Choose Your Size ($79 – $179)
          </button>
          <button
            onClick={handleDownload}
            className="border border-border text-muted-foreground text-a5 px-6 py-3 rounded-lg hover:border-primary hover:text-primary transition-colors"
          >
            Download Preview (Free)
          </button>
        </div>
        <p className="text-body-sm text-muted-foreground">
          ✓ Free shipping · 📦 30-day guarantee · 🔒 Secure checkout
        </p>
        <p className="text-body-sm text-primary">🚀 Order by 5pm for same-day processing</p>
      </div>

      {/* Quick Reference */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-amber-500/10 rounded-xl p-6 mb-12">
        <h3 className="text-a4 text-center text-foreground mb-4">Your Birth Chart Summary</h3>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-card/60 border border-border rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl mb-2">☀️</div>
            <div className="text-a5 text-foreground">Sun in {chartData.sun.sign}</div>
            <div className="text-body-sm text-muted-foreground">House {chartData.sun.house}</div>
          </div>
          <div className="bg-card/60 border border-border rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl mb-2">🌙</div>
            <div className="text-a5 text-foreground">Moon in {chartData.moon.sign}</div>
            <div className="text-body-sm text-muted-foreground">House {chartData.moon.house}</div>
          </div>
          <div className="bg-card/60 border border-border rounded-lg p-4 text-center shadow-sm">
            <div className="text-3xl mb-2">⬆️</div>
            <div className="text-a5 text-foreground">{chartData.rising} Rising</div>
            <div className="text-body-sm text-muted-foreground">Your Ascendant</div>
          </div>
        </div>

        {/* Element Balance */}
        <div className="mt-6 text-center">
          <p className="text-subtitle text-muted-foreground mb-2">Elemental Balance:</p>
          <div className="flex justify-center gap-4 text-body-sm text-foreground">
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
          <p className="text-body-sm text-muted-foreground mt-3 text-center italic">
            Generated with magical pink watercolor LoRA based on your unique natal chart
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="text-a4 text-amber-300 mb-4">
            How Your Chart Influenced This Artwork
          </h3>

          {explanation.elements.map((element, index) => (
            <div key={index} className="rounded-lg border border-amber-500/10 bg-card/50 backdrop-blur-sm p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{element.icon}</span>
                <div>
                  <h4 className="text-a5 text-foreground">{element.title}</h4>
                  <p className="text-body-sm text-muted-foreground">{element.subtitle}</p>
                </div>
              </div>
              <p className="text-body text-muted-foreground">{element.explanation}</p>
              <div className="space-y-1.5">
                <span className="text-subtitle text-amber-400 tracking-wider">Visual Cues</span>
                <ul className="space-y-1">
                  {element.visualCues.map((cue, i) => (
                    <li key={i} className="text-body-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{cue}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-body-sm italic text-amber-200/60 border-t border-amber-500/10 pt-2">{element.meaning}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-lg mx-auto mt-16 text-center space-y-4">
        <h3 className="text-a2 text-foreground">Ready to own this artwork?</h3>
        <button
          onClick={onGetFramed}
          className="bg-primary text-primary-foreground text-a4 px-10 py-4 rounded-lg hover:opacity-90 transition-opacity tracking-wide border-glow"
        >
          Choose Your Size ($79 – $179)
        </button>
      </div>

      {/* Testimonials */}
      <div className="mt-16 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-primary">⭐⭐⭐⭐⭐</span>
          <span className="text-body-sm text-foreground">4.9/5 from 287 customers</span>
        </div>
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { initials: "SJ", name: "Sarah J.", quote: "The symbolism is incredibly accurate. My Capricorn mountain is stunning!", badge: "Verified Buyer" },
            { initials: "MR", name: "Michael R.", quote: "Most meaningful piece of art I own. Everyone asks about it!", badge: "Verified Buyer" },
            { initials: "AL", name: "Amanda L.", quote: "Bought one for myself and immediately ordered two more as gifts.", badge: "Verified Buyer" },
          ].map((r) => (
            <div key={r.initials} className="bg-card border border-border rounded-xl p-4 text-left">
              <div className="text-primary text-xs mb-2">★★★★★</div>
              <p className="text-body-sm text-foreground/80 mb-3">"{r.quote}"</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary text-subtitle">{r.initials}</div>
                <div>
                  <p className="text-body-sm text-foreground">{r.name}</p>
                  <p className="text-subtitle text-primary">{r.badge}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
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
                <p className="text-body-sm text-foreground">Your Cosmic Masterpiece</p>
                <p className="text-body-sm text-muted-foreground">{chartData.sun.sign} Sun • {chartData.moon.sign} Moon</p>
              </div>
            </div>
            <button
              onClick={onGetFramed}
              className="bg-primary text-primary-foreground text-a5 px-6 py-2 rounded-lg hover:opacity-90 transition-opacity tracking-wide border-glow"
            >
              Choose Your Size →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
