import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';

const MOCK_ORDER = {
  firstName: 'Sarah',
  orderNumber: '#CA-02345',
  date: 'February 18, 2026',
  sun: 'Capricorn',
  moon: 'Moon',
  rising: 'Virgo',
  sizeLabel: '18" × 24"',
  frameName: 'Classic Black Frame',
  matBoard: 'White Mat Board',
  customText: '"Sarah\'s Cosmic Blueprint"',
  total: 194.00,
  paymentLast4: '4242',
  shippingAddress: 'Sarah Johnson, 123 Main Street San Francisco, CA 94102',
};

const TIMELINE_STEPS = [
  {
    label: 'STEP 1 · NOW',
    icon: '✅',
    title: 'Order Confirmed',
    desc: 'Your payment is processed and order is in our system.',
    active: true,
  },
  {
    label: 'STEP 2 · TODAY & TOMORROW (1-2 DAYS)',
    icon: '🎨',
    title: 'Creating Your Artwork',
    desc: 'Our system generates your unique cosmic blueprint based on your exact birth data. We review every artwork for quality.',
  },
  {
    label: 'STEP 3 · THIS WEEK (2-3 DAYS)',
    icon: '🖼️',
    title: 'Professional Framing',
    desc: 'Your artwork is printed on museum-grade archival paper, hand-framed with your selected frame and mat board.',
  },
  {
    label: 'STEP 4 · NEXT WEEK (5-7 DAYS)',
    icon: '📦',
    title: 'Shipped to You',
    desc: 'Free shipping with tracking to your door. Arrives ready to hang—no assembly required.',
  },
];

const FAQS = [
  {
    icon: '📝',
    q: 'NEED TO MAKE A CHANGE?',
    a: 'Contact us within 24 hours to modify your order:\nhello@celestialartworks.com',
  },
  {
    icon: '📦',
    q: 'WHEN WILL IT SHIP?',
    a: 'Within 5-7 days. You\'ll get tracking automatically.',
  },
  {
    icon: '👁️',
    q: 'CAN I SEE A PREVIEW BEFORE IT SHIPS?',
    a: 'We\'ll email you a preview within 1-2 days. Reply if you want any adjustments.',
  },
  {
    icon: '🏠',
    q: 'WORRIED IT WON\'T MATCH YOUR SPACE?',
    a: '30-day money-back guarantee. If you don\'t love it, return it for a full refund—no questions asked.',
  },
];

export function OrderConfirmation({ chartData, artworkImage, orderDetails, onNewChart }) {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  // Use real data if available, otherwise mock for preview
  const order = orderDetails || MOCK_ORDER;
  const sunSign = chartData?.sun?.sign || order.sun || 'Capricorn';
  const moonSign = chartData?.moon?.sign || order.moon || 'Moon';
  const risingSign = chartData?.rising || order.rising || 'Virgo';

  const deliveryStart = new Date();
  deliveryStart.setDate(deliveryStart.getDate() + 10);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(deliveryEnd.getDate() + 14);
  const deliveryRange = `${deliveryStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — ${deliveryEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  const referralCode = order.firstName ? `${order.firstName.toUpperCase()}10` : 'COSMIC10';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#121212' }}>
        <Header />
        <div className="pt-14" />
      </div>

      {/* Success Header */}
      <div className="text-center px-4 pt-8 pb-6">
        <div className="text-4xl mb-3">✅</div>
        <h1 className="text-a1" style={{ color: '#333333' }}>Order Confirmed!</h1>
        <p className="text-body mt-2" style={{ color: '#888888' }}>
          Thank you, {order.firstName || 'there'}!
        </p>
        <p className="text-body-sm" style={{ color: '#888888' }}>
          Your cosmic blueprint is coming to life.
        </p>
        <div className="mt-4 space-y-1">
          <p className="text-body-sm" style={{ color: '#888888' }}>
            Your Order Order {order.orderNumber || sessionId?.slice(0, 12) || '#CA-02345'}
          </p>
          <p className="text-body-sm" style={{ color: '#888888' }}>
            Placed: {order.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Order Details Card */}
      <div className="px-4 pb-6">
        <div className="border rounded-sm p-4" style={{ borderColor: '#E0E0E0' }}>
          {/* Artwork preview */}
          <div className="flex gap-4 items-start">
            {artworkImage ? (
              <img src={artworkImage} alt="Your artwork" className="w-24 h-auto rounded-sm" />
            ) : (
              <div className="w-24 h-32 rounded-sm" style={{ backgroundColor: '#F0F0F0' }} />
            )}
            <div className="flex-1 space-y-1">
              <p className="text-body-sm" style={{ color: '#333333' }}>
                {sunSign} Sun · {moonSign} Moon · {risingSign} Rising
              </p>
              <p className="text-body-sm" style={{ color: '#888888' }}>
                {order.sizeLabel} {order.frameName}, {order.matBoard}
              </p>
              {order.customText && (
                <p className="text-body-sm" style={{ color: '#888888' }}>
                  Text: {order.customText}
                </p>
              )}
              <div className="pt-2 space-y-0.5">
                <p className="text-body-sm" style={{ color: '#888888' }}>
                  Total Paid: ${order.total?.toFixed(2)}
                </p>
                <p className="text-body-sm" style={{ color: '#888888' }}>
                  Payment Method: ···· {order.paymentLast4 || '4242'}
                </p>
                <p className="text-body-sm" style={{ color: '#888888' }}>
                  Shipping To: {order.shippingAddress || 'Your address'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What Happens Next */}
      <div className="px-4 pb-8">
        <h2 className="text-a2 text-center mb-2" style={{ color: '#333333' }}>What Happens Next</h2>
        <p className="text-body-sm text-center mb-6" style={{ color: '#888888' }}>
          Your artwork journey from creation to your door.
        </p>

        <div className="space-y-5">
          {TIMELINE_STEPS.map((step, i) => (
            <div key={i}>
              <p className="text-subtitle tracking-wider mb-1" style={{ color: step.active ? '#333333' : '#888888' }}>
                {step.label}
              </p>
              <div className="flex items-start gap-2">
                <span style={{ fontSize: '16px' }}>{step.icon}</span>
                <div>
                  <p className="text-a4" style={{ color: '#333333' }}>{step.title}</p>
                  <p className="text-body-sm" style={{ color: '#888888', marginTop: '2px' }}>{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Expected Delivery */}
        <div className="mt-6 rounded-sm p-4 text-center" style={{ backgroundColor: '#F5F5F5' }}>
          <p className="text-subtitle tracking-wider" style={{ color: '#888888' }}>Expected Delivery</p>
          <p className="text-a4 mt-1" style={{ color: '#333333' }}>{deliveryRange}</p>
          <p className="text-body-sm mt-1" style={{ color: '#888888' }}>
            You'll receive tracking information via email
          </p>
        </div>
      </div>

      {/* Give $10, Get $10 */}
      <div className="px-4 pb-8 text-center">
        <h2 className="text-a2 mb-2" style={{ color: '#333333' }}>Give $10, Get $10</h2>
        <p className="text-body-sm mb-1" style={{ color: '#888888' }}>
          Love your artwork? Share it with friends!
        </p>
        <p className="text-body-sm mb-4" style={{ color: '#888888' }}>
          When they order using your code, they get $10 off and you get $10 credit toward your next order.
        </p>
        <p className="text-subtitle tracking-wider mb-1" style={{ color: '#888888' }}>
          Your Personal Referral Code:
        </p>
        <div
          className="inline-block font-display text-a3 tracking-widest px-6 py-2 mb-4"
          style={{ color: '#333333' }}
        >
          {referralCode}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigator.clipboard.writeText(referralCode)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border text-a5 transition-colors"
            style={{ borderColor: '#333333', color: '#333333' }}
          >
            📋 Copy Code
          </button>
          <button
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border text-a5 transition-colors"
            style={{ borderColor: '#333333', color: '#333333' }}
          >
            🔗 Share Link
          </button>
        </div>
      </div>

      {/* Free Digital Copy */}
      <div className="px-4 pb-8 text-center">
        <h2 className="text-a2 mb-2" style={{ color: '#333333' }}>
          Your Free Digital Copy 🌍
        </h2>
        <p className="text-body-sm mb-4" style={{ color: '#888888' }}>
          While you wait for your framed print, enjoy your artwork digitally!
        </p>
        <a
          href={artworkImage || '#'}
          download="celestial-artwork.png"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block btn-base btn-primary px-8 justify-center"
          style={{ borderRadius: '40px', height: '48px' }}
        >
          Download High-Resolution File
        </a>
        <div className="mt-4 text-left max-w-xs mx-auto">
          <p className="text-body-sm mb-1" style={{ color: '#888888' }}>Perfect for:</p>
          <ul className="text-body-sm space-y-0.5" style={{ color: '#888888' }}>
            <li>- Phone or desktop wallpaper</li>
            <li>- Sharing on social media</li>
            <li>- Printing your own copies</li>
            <li>- Keeping a backup</li>
          </ul>
        </div>
        <p className="text-body-sm mt-3 italic" style={{ color: '#888888' }}>
          This file is yours forever.
        </p>
      </div>

      {/* Share the excitement */}
      <div className="px-4 pb-8 text-center">
        <h2 className="text-a2 mb-2" style={{ color: '#333333' }}>Share the excitement!</h2>
        <p className="text-body-sm mb-4" style={{ color: '#888888' }}>
          Show your friends your one-of-a-kind cosmic blueprint
        </p>
        <div className="flex justify-center gap-5">
          {['𝕏', '📷', 'in', 'f', '💬', '📧'].map((icon, i) => (
            <a
              key={i}
              href="#"
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              style={{ color: '#333333', fontSize: '18px' }}
            >
              {icon}
            </a>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="px-4 pb-8">
        <h2 className="text-a2 mb-4" style={{ color: '#333333' }}>Frequently asked questions</h2>
        <div className="divide-y" style={{ borderColor: '#E0E0E0' }}>
          {FAQS.map((faq) => (
            <details key={faq.q} className="group">
              <summary className="text-a5 uppercase tracking-wide list-none flex items-center justify-between py-5 cursor-pointer" style={{ color: '#333333' }}>
                <span className="flex items-center gap-2">
                  <span>{faq.icon}</span>
                  <span>{faq.q}</span>
                </span>
                <ChevronUp className="w-5 h-5 transition-transform duration-300 group-open:rotate-0 rotate-180" style={{ color: '#888888' }} />
              </summary>
              <p className="text-body-sm pb-5 -mt-1" style={{ color: '#888888', whiteSpace: 'pre-line' }}>{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
