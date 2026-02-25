import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import StepProgressBar from '@/components/ui/StepProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';
import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import PopularTag from '@/components/ui/PopularTag';
import ThumbnailStrip from '@/components/ui/ThumbnailStrip';
import useCompositedMockups from '@/hooks/useCompositedMockups';
import galaxyBg from '@/assets/galaxy-bg.jpg';
import canvasDetail from '@/assets/gallery/canvas-detail.jpg';
import womanHolding from '@/assets/gallery/woman-holding.jpg';

// 12x18 mockups
import mockup12x18_1 from '@/assets/mockups/12x18/mockup-1.webp';
import mockup12x18_2 from '@/assets/mockups/12x18/mockup-2.webp';
import mockup12x18_3 from '@/assets/mockups/12x18/mockup-3.webp';
import mockup12x18_4 from '@/assets/mockups/12x18/mockup-4.webp';
import mockup12x18_5 from '@/assets/mockups/12x18/mockup-5.webp';
import mockup12x18_6 from '@/assets/mockups/12x18/mockup-6.webp';
import mockup12x18_7 from '@/assets/mockups/12x18/mockup-7.webp';
import mockup12x18_8 from '@/assets/mockups/12x18/mockup-8.webp';

// 16x24 mockups
import mockup16x24_1 from '@/assets/mockups/16x24/mockup-1.webp';
import mockup16x24_2 from '@/assets/mockups/16x24/mockup-2.webp';
import mockup16x24_3 from '@/assets/mockups/16x24/mockup-3.webp';
import mockup16x24_4 from '@/assets/mockups/16x24/mockup-4.webp';
import mockup16x24_5 from '@/assets/mockups/16x24/mockup-5.webp';
import mockup16x24_6 from '@/assets/mockups/16x24/mockup-6.webp';
import mockup16x24_7 from '@/assets/mockups/16x24/mockup-7.webp';
import mockup16x24_8 from '@/assets/mockups/16x24/mockup-8.webp';

// 20x30 mockups
import mockup20x30_1 from '@/assets/mockups/20x30/mockup-1.webp';
import mockup20x30_2 from '@/assets/mockups/20x30/mockup-2.webp';
import mockup20x30_3 from '@/assets/mockups/20x30/mockup-3.webp';
import mockup20x30_4 from '@/assets/mockups/20x30/mockup-4.webp';
import mockup20x30_5 from '@/assets/mockups/20x30/mockup-5.webp';
import mockup20x30_6 from '@/assets/mockups/20x30/mockup-6.webp';

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

  // Pre-composite all sizes
  const composited12x18 = useCompositedMockups(MOCKUPS['12x18'], artworkImage);
  const composited16x24 = useCompositedMockups(MOCKUPS['16x24'], artworkImage);
  const composited20x30 = useCompositedMockups(MOCKUPS['20x30'], artworkImage);

  const allComposited = useMemo(() => ({
    '12x18': composited12x18,
    '16x24': composited16x24,
    '20x30': composited20x30,
  }), [composited12x18, composited16x24, composited20x30]);

  const compositedImages = allComposited[selectedSize] || [];
  const displayImages = compositedImages.length ? compositedImages : mockups;

  // Reset thumb when size changes
  const handleSizeChange = useCallback((sizeId) => {
    setSelectedSize(sizeId);
    setActiveThumb(0);
    setDragOffset(0);
    setIsTransitioning(false);
  }, []);

  // --- Drag carousel state ---
  const carouselRef = useRef(null);
  const dragState = useRef({ startX: 0, isDragging: false, offsetX: 0, startTime: 0, locked: null });
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const containerWidth = useRef(0);
  useEffect(() => {
    const measure = () => {
      const el = carouselRef.current;
      if (el) containerWidth.current = el.offsetWidth;
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Attach touch listeners with { passive: false } so preventDefault works
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onTouchStart = (e) => handlePointerDown(e);
    const onTouchMove = (e) => handlePointerMove(e);
    const onTouchEnd = (e) => handlePointerUp(e);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  const goTo = useCallback((index) => {
    const len = MOCKUPS[selectedSize]?.length || mockups.length;
    const clamped = Math.max(0, Math.min(len - 1, index));
    setDragOffset(0);
    setIsTransitioning(true);
    setActiveThumb(clamped);
    const tid = setTimeout(() => setIsTransitioning(false), 320);
    return () => clearTimeout(tid);
  }, [selectedSize, mockups.length]);

  const handlePointerDown = useCallback((e) => {
    if (isTransitioning) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragState.current = { startX: clientX, startY: clientY, isDragging: true, offsetX: 0, startTime: Date.now(), locked: null };
  }, [isTransitioning]);

  const handlePointerMove = useCallback((e) => {
    const ds = dragState.current;
    if (!ds.isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - ds.startX;
    const dy = clientY - ds.startY;

    // Lock direction on first significant move
    if (ds.locked === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      ds.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (ds.locked === 'y') return; // let browser handle vertical scroll
    if (ds.locked === 'x' && e.cancelable) e.preventDefault();

    // Rubberband at edges
    const atStart = activeThumb === 0 && dx > 0;
    const atEnd = activeThumb === displayImages.length - 1 && dx < 0;
    const finalDx = (atStart || atEnd) ? dx * 0.3 : dx;

    ds.offsetX = finalDx;
    setDragOffset(finalDx);
  }, [activeThumb, displayImages.length]);

  const handlePointerUp = useCallback(() => {
    const ds = dragState.current;
    if (!ds.isDragging) return;
    ds.isDragging = false;

    if (ds.locked !== 'x') {
      setDragOffset(0);
      return;
    }

    const dx = ds.offsetX;
    const dt = Date.now() - ds.startTime;
    const velocity = Math.abs(dx) / Math.max(dt, 1);
    const w = containerWidth.current || 300;

    if (Math.abs(dx) > w * 0.15 || velocity > 0.4) {
      goTo(activeThumb + (dx < 0 ? 1 : -1));
    } else {
      setIsTransitioning(true);
      setDragOffset(0);
      setTimeout(() => setIsTransitioning(false), 320);
    }
  }, [activeThumb, goTo]);

  const handleThumbSelect = useCallback((index) => {
    if (index === activeThumb) return;
    goTo(index);
  }, [activeThumb, goTo]);

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

  const scrollToOrder = () => {
    const el = document.getElementById('order-summary-mobile') || document.getElementById('order-summary-desktop');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

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
  const ArtworkPanel = ({ className = '' }) => {
    // Build the transform: base position + drag offset
    const baseX = -activeThumb * 100;
    const dragPx = dragOffset;

    return (
      <div className={className}>
        <div
          ref={carouselRef}
          className="relative overflow-hidden"
          style={{ backgroundColor: '#F5F5F5', touchAction: 'pan-y pinch-zoom' }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={() => { if (dragState.current.isDragging) handlePointerUp(); }}
        >
          <div
            className="flex"
            style={{
              transform: `translateX(calc(${baseX}% + ${dragPx}px))`,
              transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
              willChange: 'transform',
            }}
          >
            {displayImages.map((src, i) => (
              <div key={i} className="w-full flex-shrink-0">
                <img
                  src={src}
                  alt={`Canvas mockup ${i + 1}`}
                  className="w-full object-contain select-none pointer-events-none"
                  style={{ userSelect: 'none', WebkitUserDrag: 'none' }}
                />
              </div>
            ))}
          </div>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center px-4">
            <ThumbnailStrip
              images={displayImages}
              activeIndex={activeThumb}
              onSelect={handleThumbSelect}
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
  };

  const SizeSelector = ({ vertical = false }) => (
    <div>
      <h2 className="text-a4" style={{ color: '#333333' }}>
        Choose Your Size
      </h2>
      {vertical ? (
        <div className="flex flex-col gap-3">
          {SIZE_OPTIONS.map((size) => (
            <SizeCard key={size.id} size={size} vertical />
          ))}
        </div>
      ) : (
        <div className="-mx-4" style={{ overflow: 'clip visible' }}>
          <div ref={sizeCarouselRef} className="overflow-x-auto scrollbar-hide" style={{ overflowY: 'visible', overflow: 'auto visible' }}>
            <div className="flex w-max gap-3 pb-2 pt-4 pl-4 pr-4">
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
      onClick={() => handleSizeChange(size.id)}
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
        <div className="absolute z-10" style={{ top: '-12px', right: '-4px' }}>
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
      className="relative overflow-hidden"
      style={{ borderRadius: '2px', padding: '20px 20px 32px 20px' }}
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
        <div className="pt-4 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.25)' }}>
          <div className="flex justify-between text-body-sm" style={{ color: '#CCCCCC' }}>
            <span>Subtotal</span>
            <span>${total}</span>
          </div>
          <div className="flex justify-between text-body-sm" style={{ color: '#CCCCCC' }}>
            <span>Shipping</span>
            <span>Free shipping unlocked</span>
          </div>
          <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.25)' }}>
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
              <p className="text-a5" style={{ color: '#FFFFFF' }}>30-day money-back guarantee.</p>
              <p className="text-body-sm" style={{ color: '#999999', marginTop: '2px' }}>Love it or your money back. No questions asked.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span style={{ fontSize: '18px' }}>📦</span>
            <div>
              <p className="text-a5" style={{ color: '#FFFFFF' }}>Ships in 2-3 business days</p>
              <p className="text-body-sm" style={{ color: '#999999', marginTop: '2px' }}>Order by 5pm EST for same-day processing.</p>
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
          <StepProgressBar currentStep={3} />
        </div>
      </div>
      

      {/* Mobile layout */}
      <div className="md:hidden">
        <ArtworkPanel />

        <div className="pt-6 pb-4 px-4">
          <SizeSelector />
        </div>

        <div id="order-summary-mobile" className="px-4" style={{ paddingBottom: '32px', marginTop: '23px' }}>
          <OrderSummary />
        </div>
        {/* Mobile — Materials + Gift */}
        <div className="px-4 pb-16 flex flex-col gap-16" style={{ paddingTop: '48px' }}>
          <div>
            <img src={canvasDetail} alt="Close-up of museum-quality canvas print detail" className="w-full object-cover" style={{ borderRadius: 2, aspectRatio: '40/29' }} loading="lazy" />
            <div className="mt-4">
              <p className="text-subtitle text-surface-muted tracking-widest mb-2">MUSEUM-QUALITY MATERIALS</p>
              <h3 className="text-a2 text-surface-foreground mb-4">Materials So Good, Museums Use Them</h3>
              <p className="text-body text-surface-muted">
                Your artwork arrives ready to hang—printed on premium stretched canvas using a 12-color giclée process for stunning color depth and museum-grade archival quality. Built to last a lifetime.
              </p>
              <button onClick={scrollToOrder} className="link-a5 font-body text-surface-foreground mt-4">
                Continue to checkout
              </button>
            </div>
          </div>
          <div>
            <img src={womanHolding} alt="Happy customer holding her framed birth chart artwork" className="w-full object-cover" style={{ borderRadius: 2, aspectRatio: '40/29' }} loading="lazy" />
            <div className="mt-4">
              <p className="text-subtitle text-surface-muted tracking-widest mb-2">THE PERFECT GIFT</p>
              <h3 className="text-a2 text-surface-foreground mb-4">Impossible to Duplicate. Impossible to Forget.</h3>
              <p className="text-body text-surface-muted">
                Birthdays. Anniversaries. New homes. Give a gift that's impossible to buy anywhere else—because it's created from their exact birth moment. Every friend who sees it will ask.
              </p>
              <button onClick={scrollToOrder} className="link-a5 font-body text-surface-foreground mt-4">
                Continue to checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop layout — two columns, left sticky */}
      <div className="hidden md:block">
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="flex gap-12 items-start">
            {/* Left — artwork (sticky) */}
            <div className="w-1/2 flex-shrink-0 sticky top-8">
              <ArtworkPanel />
            </div>

            {/* Right — scrollable content */}
            <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
              <SizeSelector vertical />
              <div id="order-summary-desktop"><OrderSummary /></div>

              {/* Museum-Quality Materials */}
              <div>
                <img src={canvasDetail} alt="Close-up of museum-quality canvas print detail" className="w-full object-cover" style={{ borderRadius: 2, aspectRatio: '40/29' }} loading="lazy" />
                <div className="mt-4">
                  <p className="text-subtitle text-surface-muted tracking-widest mb-2">MUSEUM-QUALITY MATERIALS</p>
                  <h3 className="text-a2 text-surface-foreground mb-4">Materials So Good, Museums Use Them</h3>
                  <p className="text-body text-surface-muted">
                    Your artwork arrives ready to hang—printed on premium stretched canvas using a 12-color giclée process for stunning color depth and museum-grade archival quality. Built to last a lifetime.
                  </p>
                  <button onClick={scrollToOrder} className="link-a5 font-body text-surface-foreground mt-4">
                    Continue to checkout
                  </button>
                </div>
              </div>

              {/* The Perfect Gift */}
              <div>
                <img src={womanHolding} alt="Happy customer holding her framed birth chart artwork" className="w-full object-cover" style={{ borderRadius: 2, aspectRatio: '40/29' }} loading="lazy" />
                <div className="mt-4">
                  <p className="text-subtitle text-surface-muted tracking-widest mb-2">THE PERFECT GIFT</p>
                  <h3 className="text-a2 text-surface-foreground mb-4">Impossible to Duplicate. Impossible to Forget.</h3>
                  <p className="text-body text-surface-muted">
                    Birthdays. Anniversaries. New homes. Give a gift that's impossible to buy anywhere else—because it's created from their exact birth moment. Every friend who sees it will ask.
                  </p>
                  <button onClick={scrollToOrder} className="link-a5 font-body text-surface-foreground mt-4">
                    Continue to checkout
                  </button>
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
