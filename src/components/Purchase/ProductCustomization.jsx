import { useState } from 'react';
import ProgressBar from '@/components/ui/ProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';
import Footer from '@/components/Layout/Footer';

// 16x24 mockups
import mockup16x24_1 from '@/assets/mockups/16x24/mockup-1.png';
import mockup16x24_2 from '@/assets/mockups/16x24/mockup-2.png';
import mockup16x24_3 from '@/assets/mockups/16x24/mockup-3.png';
import mockup16x24_4 from '@/assets/mockups/16x24/mockup-4.png';
import mockup16x24_5 from '@/assets/mockups/16x24/mockup-5.png';
import mockup16x24_6 from '@/assets/mockups/16x24/mockup-6.png';
import mockup16x24_7 from '@/assets/mockups/16x24/mockup-7.png';
import mockup16x24_8 from '@/assets/mockups/16x24/mockup-8.png';

const SIZE_OPTIONS = [
  { id: '12x18', label: '12" × 18"', description: 'Perfect for combinations', price: 79 },
  { id: '16x24', label: '16" × 24"', description: 'Statement piece (34% choose this)', price: 119, popular: true },
  { id: '20x30', label: '20" × 30"', description: 'Gallery showpiece', price: 179 },
];

// Mockup images per size (for now only 16x24 has real mockups)
const MOCKUPS = {
  '12x18': [mockup16x24_1, mockup16x24_2, mockup16x24_3, mockup16x24_4, mockup16x24_5, mockup16x24_6, mockup16x24_7, mockup16x24_8],
  '16x24': [mockup16x24_1, mockup16x24_2, mockup16x24_3, mockup16x24_4, mockup16x24_5, mockup16x24_6, mockup16x24_7, mockup16x24_8],
  '20x30': [mockup16x24_1, mockup16x24_2, mockup16x24_3, mockup16x24_4, mockup16x24_5, mockup16x24_6, mockup16x24_7, mockup16x24_8],
};

export function ProductCustomization({ chartData, artworkImage, onCheckout, onBack, formData, onEditBirthData }) {
  const [selectedSize, setSelectedSize] = useState('16x24');
  const [activeThumb, setActiveThumb] = useState(0);

  const sizeData = SIZE_OPTIONS.find(s => s.id === selectedSize);
  const total = sizeData?.price || 119;
  const mockups = MOCKUPS[selectedSize] || MOCKUPS['16x24'];

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
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <ProgressBar currentStep={4} />
      <BirthDataBar formData={formData} onEdit={onEditBirthData} />

      {/* Hero mockup area — dark background */}
      <div style={{ backgroundColor: '#1A1A1A' }} className="pb-2">
        {/* Main mockup image */}
        <div className="flex items-center justify-center px-4 pt-6 pb-4">
          <img
            src={mockups[activeThumb]}
            alt={`Canvas mockup ${activeThumb + 1}`}
            className="max-h-[420px] w-auto object-contain rounded"
            loading={activeThumb === 0 ? 'eager' : 'lazy'}
          />
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
          {mockups.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveThumb(i)}
              className={`flex-shrink-0 rounded overflow-hidden transition-all ${
                activeThumb === i
                  ? 'ring-2 ring-white opacity-100'
                  : 'opacity-50 hover:opacity-75'
              }`}
            >
              <img
                src={src}
                alt={`Thumbnail ${i + 1}`}
                className="w-12 h-12 object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Choose frame Size — white background */}
      <div className="px-4 pt-6 pb-4">
        <h2 className="text-a4 mb-4" style={{ color: '#333333' }}>
          🖼️ Choose frame Size
        </h2>

        {/* Horizontal scrollable size cards */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {SIZE_OPTIONS.map((size) => (
            <button
              key={size.id}
              onClick={() => { setSelectedSize(size.id); setActiveThumb(0); }}
              className={`relative flex-shrink-0 rounded-lg border p-4 text-left transition-all ${
                selectedSize === size.id
                  ? 'border-2'
                  : 'border hover:border-gray-400'
              }`}
              style={{
                minWidth: '140px',
                borderColor: selectedSize === size.id ? '#333333' : '#E0E0E0',
                backgroundColor: '#FFFFFF',
              }}
            >
              {size.popular && (
                <span
                  className="absolute -top-2 right-2 text-subtitle px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#FE6781', color: '#FFFFFF', fontSize: '10px' }}
                >
                  Most popular
                </span>
              )}
              <p className="text-a4" style={{ color: '#333333' }}>{size.label}</p>
              <p className="text-body-sm mt-1" style={{ color: '#888888', fontSize: '12px' }}>{size.description}</p>
              <p className="text-a4 mt-2" style={{ color: '#333333' }}>${size.price}</p>
            </button>
          ))}
        </div>

        <p className="text-body-sm mt-3" style={{ color: '#888888' }}>
          💡 Not sure? We recommend 18"×24" for most spaces
        </p>
      </div>

      {/* Order Summary — dark card */}
      <div className="px-4 pb-8">
        <div className="rounded-2xl p-6 space-y-4" style={{ backgroundColor: '#1A1A2E' }}>
          <h3 className="text-a4" style={{ color: '#FFFFFF' }}>Your Selection</h3>

          <div className="space-y-2 text-body-sm">
            <div className="flex justify-between" style={{ color: '#CCCCCC' }}>
              <span>Birth Chart Artwork — {chartData?.sun?.sign || 'Gemini'} Sun</span>
              <span>Included</span>
            </div>
            <div className="flex justify-between" style={{ color: '#CCCCCC' }}>
              <span>{sizeData?.label} Canvas</span>
              <span>${total}</span>
            </div>
          </div>

          <div className="pt-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex justify-between text-body-sm" style={{ color: '#CCCCCC' }}>
              <span>Subtotal</span>
              <span>${total}</span>
            </div>
            <div className="flex justify-between text-body-sm" style={{ color: '#CCCCCC' }}>
              <span>Shipping</span>
              <span>Free shipping unlocked</span>
            </div>
            <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-a4" style={{ color: '#FFFFFF' }}>TOTAL</span>
              <span className="text-a2" style={{ color: '#FFFFFF' }}>${total}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="btn-base btn-primary w-full justify-center"
            style={{ borderRadius: '40px', height: '52px', fontSize: '14px' }}
          >
            Continue to Secure Checkout — ${total}
          </button>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <span style={{ fontSize: '18px' }}>🔄</span>
              <div>
                <p className="text-body-sm font-semibold" style={{ color: '#FFFFFF' }}>30-day money-back guarantee</p>
                <p className="text-body-sm" style={{ color: '#999999', fontSize: '12px' }}>Love it or your money back. No questions asked.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span style={{ fontSize: '18px' }}>📦</span>
              <div>
                <p className="text-body-sm font-semibold" style={{ color: '#FFFFFF' }}>Ships in 2-3 business days</p>
                <p className="text-body-sm" style={{ color: '#999999', fontSize: '12px' }}>Order by 5pm EST for same-day processing.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
