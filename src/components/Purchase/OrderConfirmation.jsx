import { useSearchParams } from 'react-router-dom';

export function OrderConfirmation({ chartData, artworkImage, orderDetails, onNewChart }) {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const deliveryStart = new Date();
  deliveryStart.setDate(deliveryStart.getDate() + 10);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(deliveryEnd.getDate() + 14);
  const deliveryRange = `${deliveryStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — ${deliveryEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="min-h-screen bg-cosmic py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="text-6xl">✅</div>
          <h1 className="font-display text-4xl text-primary text-glow tracking-wide">
            Order Confirmed!
          </h1>
          <p className="text-muted-foreground font-body">
            Thank you{orderDetails?.firstName ? `, ${orderDetails.firstName}` : ''}! Your cosmic blueprint is coming to life.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          {sessionId && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">Order Reference</p>
                <p className="text-sm text-foreground font-body font-mono">{sessionId.slice(0, 20)}...</p>
              </div>
              <p className="text-xs text-muted-foreground font-body">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          )}

          {/* Artwork preview */}
          {artworkImage && (
            <div className="flex items-center gap-4 bg-secondary/30 rounded-lg p-4">
              <img src={artworkImage} alt="Your artwork" className="w-20 h-auto rounded" />
              <div>
                <p className="text-foreground font-body font-medium">
                  Birth Chart Artwork{chartData ? ` — ${chartData.sun.sign} Sun` : ''}
                </p>
                {chartData && (
                  <p className="text-xs text-muted-foreground font-body">
                    {chartData.sun.sign} Sun · {chartData.moon.sign} Moon · {chartData.rising} Rising
                  </p>
                )}
                {orderDetails && (
                  <p className="text-xs text-muted-foreground font-body">{orderDetails.sizeLabel} Canvas</p>
                )}
                {orderDetails && (
                  <p className="text-primary font-display text-lg">${orderDetails.total}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* What Happens Next — Two column on desktop */}
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
          {/* Left: Timeline */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <h3 className="font-display text-lg text-foreground flex items-center gap-2">📦 What Happens Next</h3>

            <div className="space-y-4">
              {[
                { label: 'NOW', icon: '✅', title: 'Order Confirmed', desc: 'Your order has been received', active: true },
                { label: 'TODAY & TOMORROW', icon: '🎨', title: 'Creating Your Artwork', desc: 'High-resolution artwork production (1-2 days)' },
                { label: 'THIS WEEK', icon: '🖼️', title: 'Professional Printing', desc: 'Museum-quality canvas printing (2-3 days)' },
                { label: 'NEXT WEEK', icon: '📦', title: 'Shipped to You', desc: 'Carefully packaged and shipped (5-7 days)' },
              ].map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step.active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {step.icon}
                    </div>
                    {i < 3 && <div className="w-px h-6 bg-border mt-1" />}
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">{step.label}</p>
                    <p className="text-sm text-foreground font-body font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground font-body">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <p className="text-sm text-foreground font-body font-medium">Expected Delivery</p>
              <p className="text-primary font-display text-lg">{deliveryRange}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">You'll receive tracking information via email</p>
            </div>
          </div>

          {/* Right: Referral + Download */}
          <div className="space-y-6">
            {/* Referral */}
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
              <h3 className="font-display text-lg text-foreground">🎁 Give $10, Get $10</h3>
              <p className="text-sm text-muted-foreground font-body">Share your personal code with friends</p>
              <div className="bg-secondary/50 rounded-lg p-3 font-mono text-foreground text-lg tracking-wider">
                {orderDetails?.firstName ? `${orderDetails.firstName.toUpperCase()}10` : 'COSMIC10'}
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => navigator.clipboard.writeText(orderDetails?.firstName ? `${orderDetails.firstName.toUpperCase()}10` : 'COSMIC10')}
                  className="text-xs bg-secondary text-foreground px-4 py-2 rounded-lg font-body hover:bg-secondary/80 transition"
                >
                  Copy Code
                </button>
                <button className="text-xs bg-secondary text-foreground px-4 py-2 rounded-lg font-body hover:bg-secondary/80 transition">
                  Share Link
                </button>
              </div>
            </div>

            {/* Digital Download */}
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
              <h3 className="font-display text-lg text-foreground">🌍 Your Free Digital Copy</h3>
              <p className="text-sm text-muted-foreground font-body">Use as wallpaper, social media, printing, or backup</p>
              {artworkImage && (
                <a
                  href={artworkImage}
                  download="celestial-artwork.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-primary text-primary-foreground font-body text-sm px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Download High-Resolution File
                </a>
              )}
              <p className="text-xs text-muted-foreground font-body">This file is yours forever.</p>
            </div>

            {/* Share */}
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
              <h3 className="font-display text-lg text-foreground">Share the excitement</h3>
              <div className="flex justify-center gap-4 text-muted-foreground text-lg">
                <a href="#" className="hover:text-foreground transition">𝕏</a>
                <a href="#" className="hover:text-foreground transition">📷</a>
                <a href="#" className="hover:text-foreground transition">in</a>
                <a href="#" className="hover:text-foreground transition">📘</a>
                <a href="#" className="hover:text-foreground transition">💬</a>
                <a href="#" className="hover:text-foreground transition">📧</a>
              </div>
            </div>
          </div>
        </div>

        {/* Post-purchase FAQ */}
        <div className="animate-fade-in" style={{ animationDelay: '600ms' }}>
          <h3 className="font-display text-xl text-foreground text-center mb-4">Questions?</h3>
          <div className="space-y-3">
            {[
              { q: "Need to make a change?", a: "You have a 24-hour window to modify your order. Email hello@celestialartworks.com and we'll help." },
              { q: "When will it ship?", a: "Your order will ship within 5-7 business days. You'll receive tracking information via email." },
              { q: "Can I see a preview before it ships?", a: "Yes! We'll send you a digital proof via email within 1-2 days." },
              { q: "Worried it won't match your space?", a: "We offer a 30-day money-back guarantee. If you're not satisfied, we'll issue a full refund." },
            ].map((faq) => (
              <details key={faq.q} className="bg-card border border-border rounded-lg p-4 cursor-pointer group">
                <summary className="font-body text-sm text-foreground font-medium list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="text-primary group-open:rotate-180 transition text-xs">▼</span>
                </summary>
                <p className="text-muted-foreground text-sm font-body mt-2">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Generate for a Friend CTA */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '800ms' }}>
          <button
            onClick={onNewChart}
            className="bg-primary text-primary-foreground font-display text-lg px-8 py-3 rounded-lg hover:opacity-90 transition-opacity tracking-wide border-glow"
          >
            Generate Chart for a Friend →
          </button>
        </div>
      </div>
    </div>
  );
}
