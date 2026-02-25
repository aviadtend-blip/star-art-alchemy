import { useState } from 'react';
import StepProgressBar from '@/components/ui/StepProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';
import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import PopularTag from '@/components/ui/PopularTag';
import galaxyBg from '@/assets/galaxy-bg.jpg';

// 12x18 mockups
import mockup12x18_1 from '@/assets/mockups/12x18/mockup-1.png';
import mockup12x18_2 from '@/assets/mockups/12x18/mockup-2.png';
import mockup12x18_3 from '@/assets/mockups/12x18/mockup-3.png';
import mockup12x18_4 from '@/assets/mockups/12x18/mockup-4.png';
import mockup12x18_5 from '@/assets/mockups/12x18/mockup-5.png';
import mockup12x18_6 from '@/assets/mockups/12x18/mockup-6.png';
import mockup12x18_7 from '@/assets/mockups/12x18/mockup-7.png';
import mockup12x18_8 from '@/assets/mockups/12x18/mockup-8.png';

// 16x24 mockups
import mockup16x24_1 from '@/assets/mockups/16x24/mockup-1.png';
import mockup16x24_2 from '@/assets/mockups/16x24/mockup-2.png';
import mockup16x24_3 from '@/assets/mockups/16x24/mockup-3.png';
import mockup16x24_4 from '@/assets/mockups/16x24/mockup-4.png';
import mockup16x24_5 from '@/assets/mockups/16x24/mockup-5.png';
import mockup16x24_6 from '@/assets/mockups/16x24/mockup-6.png';
import mockup16x24_7 from '@/assets/mockups/16x24/mockup-7.png';
import mockup16x24_8 from '@/assets/mockups/16x24/mockup-8.png';

// 20x30 mockups
import mockup20x30_1 from '@/assets/mockups/20x30/mockup-1.png';
import mockup20x30_2 from '@/assets/mockups/20x30/mockup-2.png';
import mockup20x30_3 from '@/assets/mockups/20x30/mockup-3.png';
import mockup20x30_4 from '@/assets/mockups/20x30/mockup-4.png';
import mockup20x30_5 from '@/assets/mockups/20x30/mockup-5.png';
import mockup20x30_6 from '@/assets/mockups/20x30/mockup-6.png';

const SIZE_OPTIONS = [
  { id: '12x18', label: '12" × 18"', description: 'Perfect for combinations', price: 79 },
  { id: '16x24', label: '16" × 24"', description: 'Statement piece (34% choose this)', price: 119, popular: true },
  { id: '20x30', label: '20" × 30"', description: 'Gallery showpiece', price: 179 },
];

// Mockup images per size (for now only 16x24 has real mockups)
const MOCKUPS = {
  '12x18': [mockup12x18_1, mockup12x18_2, mockup12x18_3, mockup12x18_4, mockup12x18_5, mockup12x18_6, mockup12x18_7, mockup12x18_8],
  '16x24': [mockup16x24_1, mockup16x24_2, mockup16x24_3, mockup16x24_4, mockup16x24_5, mockup16x24_6, mockup16x24_7, mockup16x24_8],
  '20x30': [mockup20x30_1, mockup20x30_2, mockup20x30_3, mockup20x30_4, mockup20x30_5, mockup20x30_6],
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
    <div className="min-h-screen relative" style={{ backgroundColor: '#FFFFFF' }}>
      <div style={{ backgroundColor: '#121212' }}>
        <Header />
        <div className="pt-14">
          <StepProgressBar currentStep={4} />
        </div>
      </div>
      <BirthDataBar formData={formData} onEdit={onEditBirthData} />

      {/* Hero mockup area — light background */}
      <div style={{ backgroundColor: '#F5F5F5' }}>
        {/* Main mockup image — full width */}
        <div className="w-full">
          <img
            src={mockups[activeThumb]}
            alt={`Canvas mockup ${activeThumb + 1}`}
            className="w-full object-contain"
            loading={activeThumb === 0 ? 'eager' : 'lazy'}
          />
        </div>

        {/* Thumbnail strip — overlapping bottom of image */}
        <div className="flex gap-1.5 px-4 py-3 justify-center">
          {mockups.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveThumb(i)}
              className={`flex-shrink-0 rounded-sm overflow-hidden transition-all ${
                activeThumb === i
                  ? 'ring-1 ring-[#FFBF00] opacity-100'
                  : 'opacity-50 hover:opacity-75'
              }`}
              style={{ width: 30, height: 30 }}
            >
              <img
                src={src}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
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
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 pt-3">
          {SIZE_OPTIONS.map((size) => (
            <button
              key={size.id}
              onClick={() => { setSelectedSize(size.id); setActiveThumb(0); }}
              className={`relative flex-shrink-0 transition-all`}
              style={{
                display: 'flex',
                width: '180px',
                height: '74px',
                padding: '15px',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '4px',
                border: selectedSize === size.id ? '2px solid #333333' : '1px solid #E0E0E0',
                backgroundColor: '#FFFFFF',
              }}
            >
              {size.popular && (
                <div className="absolute" style={{ top: '-12px', right: '-4px' }}>
                  <PopularTag>Most popular</PopularTag>
                </div>
              )}
              <div className="text-left">
                <p className="text-a4" style={{ color: '#333333' }}>{size.label}</p>
                <p className="text-body-sm" style={{ color: '#888888', marginTop: '4px' }}>{size.description}</p>
              </div>
              <p className="text-a4 font-bold flex-shrink-0" style={{ color: '#333333', marginLeft: '16px' }}>${size.price}</p>
            </button>
          ))}
        </div>

        <p className="text-body-sm mt-3" style={{ color: '#888888' }}>
          💡 Not sure? We recommend 18"×24" for most spaces
        </p>
      </div>

      {/* Order Summary — galaxy background card */}
      <div className="px-4 pb-8" style={{ marginTop: '35px' }}>
        <div
          className="relative overflow-hidden p-5"
          style={{ borderRadius: '2px' }}
        >
          {/* Galaxy background */}
          <img src={galaxyBg} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
          <div className="absolute inset-0 bg-black/40" />

          {/* Content */}
          <div className="relative z-10 space-y-4">
            <h3 className="text-body-strong" style={{ color: '#FFFFFF' }}>Your Selection</h3>

            <div className="space-y-4 text-body-sm">
              <div className="flex justify-between" style={{ color: '#CCCCCC' }}>
                <span>Birth Chart Artwork — {chartData?.sun?.sign || 'Gemini'} Sun</span>
                <span>Included</span>
              </div>
              <div className="flex justify-between" style={{ color: '#CCCCCC' }}>
                <span>{sizeData?.label} Canvas</span>
                <span>${total}</span>
              </div>
            </div>

            <div className="pt-4 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex justify-between text-body-sm" style={{ color: '#CCCCCC' }}>
                <span>Subtotal</span>
                <span>${total}</span>
              </div>
              <div className="flex justify-between text-body-sm" style={{ color: '#CCCCCC' }}>
                <span>Shipping</span>
                <span>Free shipping unlocked</span>
              </div>
              <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-a4" style={{ color: '#FFFFFF' }}>TOTAL</span>
                <span className="font-body" style={{ color: '#FFFFFF', fontSize: '26px', fontWeight: 500 }}>${total}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="btn-base btn-primary w-full justify-center"
              style={{ borderRadius: '40px', height: '52px', fontSize: '14px' }}
            >
              Continue to Secure Checkout — ${total}
            </button>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <span style={{ fontSize: '18px' }}>🔄</span>
                <div>
                  <p className="text-a4" style={{ color: '#FFFFFF' }}>30-day money-back guarantee.</p>
                  <p className="text-body-sm" style={{ color: '#999999', marginTop: '4px' }}>Love it or your money back. No questions asked.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span style={{ fontSize: '18px' }}>📦</span>
                <div>
                  <p className="text-a4" style={{ color: '#FFFFFF' }}>Ships in 2-3 business days</p>
                  <p className="text-body-sm" style={{ color: '#999999', marginTop: '4px' }}>Order by 5pm EST for same-day processing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
