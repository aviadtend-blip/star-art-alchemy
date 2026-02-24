import { useState } from 'react';
import StepProgressBar from '@/components/ui/StepProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';

const SIZE_OPTIONS = [
  { id: '12x18', label: '12" × 18"', description: 'Perfect for combinations', price: 79 },
  { id: '16x24', label: '16" × 24"', description: 'Statement piece (34% choose this)', price: 119, popular: true },
  { id: '20x30', label: '20" × 30"', description: 'Gallery showpiece', price: 179 },
];

export function ProductCustomization({ chartData, artworkImage, onCheckout, onBack, formData, onEditBirthData }) {
  const [selectedSize, setSelectedSize] = useState('16x24');

  const sizeData = SIZE_OPTIONS.find(s => s.id === selectedSize);
  const total = sizeData?.price || 119;

  const handleCheckout = () => {
    onCheckout({
      size: selectedSize,
      sizeLabel: sizeData?.label,
      frame: 'canvas',
      frameName: 'Canvas Print',
      addMatBoard: false,
      addCustomText: false,
      customText: '',
      total,
    });
  };

  return (
    <div className="min-h-screen bg-cosmic">
      <StepProgressBar currentStep={4} />
      <BirthDataBar formData={formData} onEdit={onEditBirthData} />

      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <button onClick={onBack} className="text-muted-foreground hover:text-primary transition-colors font-body text-sm mb-6 tracking-wide">
            ← Back to artwork
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* LEFT: Sticky Preview */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="rounded-lg overflow-hidden">
                  <img src={artworkImage} alt="Your natal chart artwork" className="w-full h-auto" />
                </div>
                <div className="text-center space-y-1">
                  <span className="font-display text-4xl text-primary text-glow">${total}</span>
                  <p className="text-xs text-muted-foreground font-body">Free shipping • 30-day guarantee</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-primary">⭐⭐⭐⭐⭐</span>
                    <span className="text-sm text-foreground font-body">4.9/5</span>
                  </div>
                  <p className="text-xs text-muted-foreground">287 reviews</p>
                </div>
              </div>
            </div>

            {/* RIGHT: Size Selection */}
            <div className="space-y-8">
              <h2 className="font-display text-3xl text-foreground tracking-wide">Choose Your Canvas Size</h2>

              <div className="space-y-4">
                <div className="space-y-3">
                  {SIZE_OPTIONS.map((size) => (
                    <label
                      key={size.id}
                      className={`relative block cursor-pointer rounded-lg border p-4 transition-all ${
                        selectedSize === size.id
                          ? 'border-primary bg-primary/5 border-glow'
                          : 'border-border bg-card hover:border-muted-foreground'
                      }`}
                    >
                      {size.popular && (
                        <span className="absolute -top-2 right-3 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-body font-medium">
                          Most popular
                        </span>
                      )}
                      <input type="radio" name="size" value={size.id} checked={selectedSize === size.id} onChange={() => setSelectedSize(size.id)} className="sr-only" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${selectedSize === size.id ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />
                          <div>
                            <p className="text-foreground font-body font-medium">{size.label}</p>
                            <p className="text-xs text-muted-foreground font-body">{size.description}</p>
                          </div>
                        </div>
                        <span className="text-foreground font-display text-lg">${size.price}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-body">💡 Not sure? We recommend 16"×24" for most spaces</p>
              </div>

              {/* ORDER SUMMARY */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h3 className="font-display text-lg text-foreground">Your Selection</h3>

                <div className="space-y-2 text-sm font-body">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Birth Chart Artwork — {chartData.sun.sign} Sun</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{sizeData?.label} Canvas</span>
                    <span>${total}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground font-body">
                    <span>Subtotal</span>
                    <span>${total}</span>
                  </div>
                  <div className="flex justify-between text-sm text-primary font-body">
                    <span>🎉 Free shipping unlocked</span>
                    <span>$0</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="font-display text-lg text-foreground">TOTAL</span>
                    <span className="font-display text-2xl text-primary text-glow">${total}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-primary text-primary-foreground font-display text-lg py-4 rounded-lg hover:opacity-90 transition-opacity tracking-wide border-glow"
                >
                  Continue to Secure Checkout — ${total}
                </button>

                <div className="space-y-2 text-xs text-muted-foreground font-body text-center">
                  <p>↩️ 30-day money-back guarantee. Love it or your money back. No questions asked.</p>
                  <p>🚀 Ships in 2-3 business days. Order by 5pm EST for same-day processing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
