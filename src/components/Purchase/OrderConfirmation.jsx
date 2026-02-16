import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function OrderConfirmation({ chartData, artworkImage, orderDetails, onNewChart }) {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-cosmic py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="text-6xl">✅</div>
          <h1 className="font-display text-4xl text-primary text-glow tracking-wide">
            Order Confirmed!
          </h1>
          <p className="text-muted-foreground font-body">
            Thank you for your purchase{orderDetails?.firstName ? `, ${orderDetails.firstName}` : ''}!
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          {sessionId && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">Order Reference</p>
              <p className="text-sm text-foreground font-body font-mono">{sessionId.slice(0, 20)}...</p>
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
                {orderDetails && (
                  <p className="text-sm text-muted-foreground font-body">
                    {orderDetails.sizeLabel} • {orderDetails.frameName}
                  </p>
                )}
                {orderDetails && (
                  <p className="text-primary font-display text-lg">${orderDetails.total}</p>
                )}
              </div>
            </div>
          )}

          {/* What's Next */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span>📦</span>
              <h3 className="font-display text-lg text-foreground">What Happens Next</h3>
            </div>

            <div className="space-y-3 pl-6">
              <div className="flex items-start gap-3">
                <span className="text-primary font-body font-bold">1.</span>
                <span className="text-sm text-muted-foreground font-body">We're creating your artwork (1-2 days)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary font-body font-bold">2.</span>
                <span className="text-sm text-muted-foreground font-body">Professional framing (2-3 days)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary font-body font-bold">3.</span>
                <span className="text-sm text-muted-foreground font-body">Shipping to you (5-7 days)</span>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <p className="text-sm text-foreground font-body font-medium">Expected Delivery</p>
              <p className="text-primary font-display text-lg">
                {(() => {
                  const d1 = new Date(); d1.setDate(d1.getDate() + 10);
                  const d2 = new Date(); d2.setDate(d2.getDate() + 14);
                  return `${d1.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — ${d2.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                })()}
              </p>
              <p className="text-xs text-muted-foreground font-body mt-1">You'll receive tracking information via email</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in" style={{ animationDelay: '400ms' }}>
          <button
            onClick={onNewChart}
            className="bg-primary text-primary-foreground font-display text-lg px-8 py-3 rounded-lg hover:opacity-90 transition-opacity tracking-wide"
          >
            Generate Chart for a Friend
          </button>
        </div>

        {/* Referral */}
        <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <h3 className="font-display text-lg text-foreground">📧 Gift This to Someone?</h3>
          <p className="text-sm text-muted-foreground font-body">Know someone who'd love their own birth chart artwork?</p>
          <p className="text-xs text-primary font-body">They get 10% off with code FRIEND10</p>
        </div>
      </div>
    </div>
  );
}
