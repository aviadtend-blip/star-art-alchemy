import { useEffect, useRef, useState } from 'react';
import StepProgressBar from '@/components/ui/StepProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';
import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import PopularTag from '@/components/ui/PopularTag';
import ThumbnailStrip from '@/components/ui/ThumbnailStrip';
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
  const sizeCarouselRef = useRef(null);
  const isFirstSizeScroll = useRef(true);

  const sizeData = SIZE_OPTIONS.find(s => s.id === selectedSize);
  const total = sizeData?.price || 119;
  const mockups = MOCKUPS[selectedSize] || MOCKUPS['16x24'];

  useEffect(() => {
    const carousel = sizeCarouselRef.current;
    if (!carousel || window.innerWidth >= 768) return;

    const selectedCard = carousel.querySelector(`[data-size-card="${selectedSize}"]`);
    if (!selectedCard) return;

    const targetLeft = Math.max(
      0,
      selectedCard.offsetLeft - (carousel.clientWidth - selectedCard.offsetWidth) / 2
    );

    carousel.scrollTo({
      left: targetLeft,
      behavior: isFirstSizeScroll.current ? 'auto' : 'smooth',
    });

    isFirstSizeScroll.current = false;
  }, [selectedSize]);

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

  /* Shared sub-components */
  const ArtworkPanel = ({ className = '' }) => (
    <div className={className}>
      <div className="relative" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="w-full">
          <img
            src={mockups[activeThumb]}
            alt={`Canvas mockup ${activeThumb + 1}`}
            className="w-full object-contain"
            loading={activeThumb === 0 ? 'eager' : 'lazy'}
          />
        </div>
        <div className="absolute bottom-3 left-0 right-0 flex justify-center px-4">
          <ThumbnailStrip
            images={mockups}
            activeIndex={activeThumb}
            onSelect={setActiveThumb}
            size={30}
          />
        </div>
      </div>
      {/* Reviews — desktop only */}
      <div className="hidden md:flex items-center justify-center gap-1.5 mt-4">
        <div className="flex">
          {[1,2,3,4,5].map(s => (
            <span key={s} style={{ color: '#FFBF00', fontSize: '16px' }}>★</span>
          ))}
        </div>
        <span className="text-body-sm" style={{ color: '#333333' }}>4.9/5</span>
        <span className="text-body-sm" style={{ color: '#888888' }}>287 reviews</span>
      </div>
    </div>
  );

  const SizeSelector = ({ vertical = false }) => (
    <div>
      <h2 className="text-a4" style={{ color: '#333333', marginBottom: '8px' }}>
        🖼️ Choose Your Size
      </h2>
      {vertical ? (
        <div className="flex flex-col gap-3 pt-3">
          {SIZE_OPTIONS.map((size) => (
            <SizeCard key={size.id} size={size} vertical />
          ))}
        </div>
      ) : (
        <div className="pt-4 -mx-4">
          <div ref={sizeCarouselRef} className="overflow-x-auto scrollbar-hide">
            <div className="flex w-max gap-3 pb-2 pl-4 pr-4">
              {SIZE_OPTIONS.map((size) => (
                <SizeCard key={size.id} size={size} />
              ))}
            </div>
          </div>
        </div>
      )}
      <p className="text-body-sm" style={{ color: '#888888', marginTop: '4px' }}>
        💡 Not sure? We recommend 16"×24" for most spaces
      </p>
    </div>
  );

  const SizeCard = ({ size, vertical = false }) => (
    <button
      data-size-card={size.id}
      onClick={() => { setSelectedSize(size.id); setActiveThumb(0); }}
      className="relative flex-shrink-0 transition-all"
      style={{
        display: 'flex',
        width: vertical ? '100%' : '180px',
        minWidth: vertical ? '100%' : '180px',
        height: '74px',
        padding: '12px',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '4px',
        border: selectedSize === size.id ? '2px solid #333333' : '1px solid #E0E0E0',
        backgroundColor: '#FFFFFF',
      }}
    >
      {size.popular && (
        <div className="absolute z-10" style={{ top: '4px', right: '6px' }}>
          <PopularTag>Most popular</PopularTag>
        </div>
      )}
      <div className="text-left min-w-0 flex-1 pr-2">
        <p className="text-a4" style={{ color: '#333333' }}>{size.label}</p>
        <p className="text-body-sm" style={{ color: '#888888', marginTop: '2px' }}>{size.description}</p>
      </div>
      <p className="text-a4 font-bold flex-shrink-0 whitespace-nowrap" style={{ color: '#333333', marginLeft: '8px' }}>${size.price}</p>
    </button>
  );

  const OrderSummary = () => (
    <div
      className="relative overflow-hidden p-5"
      style={{ borderRadius: '2px' }}
    >
      <img src={galaxyBg} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 space-y-4">
        <h3 className="text-a2" style={{ color: '#FFFFFF' }}>Your Order</h3>
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
  );

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#FFFFFF' }}>
      <div style={{ backgroundColor: '#121212' }}>
        <Header />
        <div className="pt-14">
          <StepProgressBar currentStep={4} />
        </div>
      </div>
      <BirthDataBar formData={formData} onEdit={onEditBirthData} />

      {/* Mobile layout */}
      <div className="md:hidden">
        <ArtworkPanel />

        <div className="pt-6 pb-4 px-4">
          <SizeSelector />
        </div>

        <div className="px-4" style={{ paddingBottom: '32px', marginTop: '23px' }}>
          <OrderSummary />
        </div>
      </div>

      {/* Desktop layout — two columns */}
      <div className="hidden md:block">
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="flex gap-12">
            {/* Left — artwork */}
            <div className="w-1/2 flex-shrink-0">
              <ArtworkPanel />
            </div>

            {/* Right — size + order */}
            <div className="flex-1 space-y-8">
              <SizeSelector vertical />
              <OrderSummary />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
