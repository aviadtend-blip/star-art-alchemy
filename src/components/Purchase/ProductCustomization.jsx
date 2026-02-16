import { useState, useEffect } from 'react';

const SIZE_OPTIONS = [
  { id: '12x16', label: '12" × 16"', description: 'Perfect for desks', detail: 'Most affordable', price: 79 },
  { id: '18x24', label: '18" × 24"', description: 'Statement piece', detail: 'Best value — 34% choose this', price: 129, popular: true },
  { id: '24x32', label: '24" × 32"', description: 'Gallery showpiece', detail: 'Premium impact', price: 199 },
];

const FRAME_OPTIONS = [
  { id: 'none', label: 'No Frame (Print Only)', description: 'Frame it yourself', price: 0, colorClass: '' },
  { id: 'black', label: 'Classic Black Frame', description: 'Professional, versatile', price: 30, colorClass: 'border-foreground', popular: true },
  { id: 'wood', label: 'Natural Wood Frame', description: 'Warm, organic feel', price: 35, colorClass: 'border-primary' },
  { id: 'white', label: 'White Gallery Frame', description: 'Modern, minimalist', price: 30, colorClass: 'border-secondary-foreground' },
  { id: 'gold', label: 'Premium Gold Frame', description: 'Luxurious statement', price: 50, colorClass: 'border-primary' },
];

export function ProductCustomization({ chartData, artworkImage, onCheckout, onBack }) {
  const [selectedSize, setSelectedSize] = useState('18x24');
  const [selectedFrame, setSelectedFrame] = useState('black');
  const [addMatBoard, setAddMatBoard] = useState(false);
  const [addCustomText, setAddCustomText] = useState(false);
  const [customText, setCustomText] = useState('');

  const sizePrice = SIZE_OPTIONS.find(s => s.id === selectedSize)?.price || 0;
  const framePrice = FRAME_OPTIONS.find(f => f.id === selectedFrame)?.price || 0;
  const total = sizePrice + framePrice + (addMatBoard ? 20 : 0) + (addCustomText ? 15 : 0);

  const selectedFrameData = FRAME_OPTIONS.find(f => f.id === selectedFrame);

  const handleCheckout = () => {
    onCheckout({
      size: selectedSize,
      sizeLabel: SIZE_OPTIONS.find(s => s.id === selectedSize)?.label,
      frame: selectedFrame,
      frameName: selectedFrameData?.label || 'No Frame',
      addMatBoard,
      addCustomText,
      customText,
      total,
    });
  };

  return (
    <div className="min-h-screen bg-cosmic py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <button onClick={onBack} className="text-muted-foreground hover:text-primary transition-colors font-body text-sm mb-6 tracking-wide">
          ← Back to artwork
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* LEFT: Sticky Preview */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              {/* Artwork Preview with frame overlay */}
              <div className={`relative rounded-lg overflow-hidden ${selectedFrame !== 'none' ? 'p-3' : ''}`}
                style={selectedFrame !== 'none' ? {
                  borderWidth: '8px',
                  borderStyle: 'solid',
                  borderColor: selectedFrame === 'black' ? 'hsl(0 0% 10%)' :
                               selectedFrame === 'wood' ? 'hsl(30 50% 35%)' :
                               selectedFrame === 'white' ? 'hsl(0 0% 90%)' :
                               'hsl(45 70% 50%)',
                  borderRadius: '4px',
                } : {}}>
                {addMatBoard && selectedFrame !== 'none' && (
                  <div className="p-4 bg-white/90">
                    <img src={artworkImage} alt="Your natal chart artwork" className="w-full h-auto" />
                  </div>
                )}
                {!(addMatBoard && selectedFrame !== 'none') && (
                  <img src={artworkImage} alt="Your natal chart artwork" className="w-full h-auto" />
                )}
              </div>

              {/* Price */}
              <div className="text-center space-y-1">
                <span className="font-display text-4xl text-primary text-glow">${total}</span>
                <p className="text-xs text-muted-foreground font-body">Free shipping • 30-day guarantee</p>
              </div>

              {/* Reviews */}
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-primary">⭐⭐⭐⭐⭐</span>
                  <span className="text-sm text-foreground font-body">4.9/5</span>
                </div>
                <p className="text-xs text-muted-foreground">287 reviews</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Configuration */}
          <div className="space-y-8">
            <h2 className="font-display text-3xl text-foreground tracking-wide">Customize Your Artwork</h2>

            {/* SIZE SELECTION */}
            <div className="space-y-4">
              <h3 className="font-display text-lg text-foreground">📐 Choose Your Size</h3>
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
                        ⭐ POPULAR
                      </span>
                    )}
                    <input type="radio" name="size" value={size.id} checked={selectedSize === size.id} onChange={() => setSelectedSize(size.id)} className="sr-only" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${selectedSize === size.id ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />
                        <div>
                          <p className="text-foreground font-body font-medium">{size.label}</p>
                          <p className="text-xs text-muted-foreground font-body">{size.description}</p>
                          <p className="text-xs text-muted-foreground/70 font-body">{size.detail}</p>
                        </div>
                      </div>
                      <span className="text-foreground font-display text-lg">${size.price}</span>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-body">💡 Not sure? We recommend 18"×24" for most spaces</p>
            </div>

            {/* FRAME SELECTION */}
            <div className="space-y-4">
              <h3 className="font-display text-lg text-foreground">🖼️ Choose Your Frame</h3>
              <div className="space-y-3">
                {FRAME_OPTIONS.map((frame) => (
                  <label
                    key={frame.id}
                    className={`relative block cursor-pointer rounded-lg border p-4 transition-all ${
                      selectedFrame === frame.id
                        ? 'border-primary bg-primary/5 border-glow'
                        : 'border-border bg-card hover:border-muted-foreground'
                    }`}
                  >
                    {frame.popular && (
                      <span className="absolute -top-2 right-3 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-body font-medium">
                        ⭐ POPULAR
                      </span>
                    )}
                    <input type="radio" name="frame" value={frame.id} checked={selectedFrame === frame.id} onChange={() => setSelectedFrame(frame.id)} className="sr-only" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${selectedFrame === frame.id ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />
                        <div>
                          <p className="text-foreground font-body font-medium">{frame.label}</p>
                          <p className="text-xs text-muted-foreground font-body">{frame.description}</p>
                        </div>
                      </div>
                      <span className="text-foreground font-display text-lg">+${frame.price}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* MAT BOARD */}
            <div className="space-y-3">
              <h3 className="font-display text-lg text-foreground">✨ Add a Mat Board (Optional)</h3>
              <label className={`flex items-center justify-between cursor-pointer rounded-lg border p-4 transition-all ${addMatBoard ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={addMatBoard} onChange={(e) => setAddMatBoard(e.target.checked)} className="w-5 h-5 accent-primary" />
                  <div>
                    <p className="text-foreground font-body font-medium">Add White Mat Board</p>
                    <p className="text-xs text-muted-foreground font-body">Professional gallery presentation</p>
                  </div>
                </div>
                <span className="text-foreground font-display text-lg">+$20</span>
              </label>
            </div>

            {/* CUSTOM TEXT */}
            <div className="space-y-3">
              <h3 className="font-display text-lg text-foreground">💬 Add Personal Touch (Optional)</h3>
              <label className={`flex items-center justify-between cursor-pointer rounded-lg border p-4 transition-all ${addCustomText ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={addCustomText} onChange={(e) => setAddCustomText(e.target.checked)} className="w-5 h-5 accent-primary" />
                  <div>
                    <p className="text-foreground font-body font-medium">Add custom text below artwork</p>
                    <p className="text-xs text-muted-foreground font-body">Personalized inscription</p>
                  </div>
                </div>
                <span className="text-foreground font-display text-lg">+$15</span>
              </label>
              {addCustomText && (
                <div className="pl-8 space-y-1">
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    maxLength={50}
                    placeholder="Sarah's Cosmic Blueprint"
                    className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground font-body text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-muted-foreground text-right">{customText.length}/50 characters</p>
                </div>
              )}
            </div>

            {/* SUMMARY & CTA */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-display text-lg text-foreground">Your Selection</h3>

              <div className="space-y-2 text-sm font-body">
                <div className="flex justify-between text-muted-foreground">
                  <span>Birth Chart Artwork — {chartData.sun.sign} Sun</span>
                  <span>${sizePrice}</span>
                </div>
                {selectedFrame !== 'none' && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>{selectedFrameData?.label} Frame</span>
                    <span>+${framePrice}</span>
                  </div>
                )}
                {addMatBoard && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>White Mat Board</span>
                    <span>+$20</span>
                  </div>
                )}
                {addCustomText && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Custom Text</span>
                    <span>+$15</span>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-3 flex justify-between items-center">
                <span className="font-display text-lg text-foreground">TOTAL</span>
                <span className="font-display text-2xl text-primary text-glow">${total}</span>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground font-body">
                <div className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>Free shipping</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>↩️</span>
                  <span>30-day money-back guarantee</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-primary text-primary-foreground font-display text-lg py-4 rounded-lg hover:opacity-90 transition-opacity tracking-wide"
              >
                Proceed to Checkout — ${total}
              </button>

              <p className="text-xs text-muted-foreground text-center font-body">
                🔒 Secure checkout • 💳 Multiple payment options
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
