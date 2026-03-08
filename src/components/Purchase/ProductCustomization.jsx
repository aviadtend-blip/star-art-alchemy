import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import StepProgressBar from '@/components/ui/StepProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';
import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import PopularTag from '@/components/ui/PopularTag';
import ThumbnailStrip from '@/components/ui/ThumbnailStrip';
import useCompositedMockups, { useBackgroundPreload } from '@/hooks/useCompositedMockups';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import galaxyBg from '@/assets/galaxy-bg.jpg';
import canvasDetail from '@/assets/gallery/canvas-detail.jpg';
import womanHolding from '@/assets/gallery/woman-holding.webp';
import ReviewsList from '@/components/ui/ReviewsList';

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

// 20x30 mockups (only 3–8 available)
import mockup20x30_3 from '@/assets/mockups/20x30/mockup-3.webp';
import mockup20x30_4 from '@/assets/mockups/20x30/mockup-4.webp';
import mockup20x30_5 from '@/assets/mockups/20x30/mockup-5.webp';
import mockup20x30_6 from '@/assets/mockups/20x30/mockup-6.webp';
import mockup20x30_7 from '@/assets/mockups/20x30/mockup-7.webp';
import mockup20x30_8 from '@/assets/mockups/20x30/mockup-8.webp';

const SIZE_OPTIONS = [
  { id: '12x18', label: '12" × 18"', description: 'Perfect for combinations', price: 79 },
  { id: '16x24', label: '16" × 24"', description: 'Statement piece (34% choose this)', price: 119, popular: true },
  { id: '20x30', label: '20" × 30"', description: 'Gallery showpiece', price: 179 },
];

// Each mockup has a numeric ID so we can match across sizes when switching
// Ordered low→high. When switching sizes, we try to keep the same mockup number.
const MOCKUPS_BY_NUMBER = {
  '12x18': [
    { num: 1, src: mockup12x18_1 }, { num: 2, src: mockup12x18_2 }, { num: 3, src: mockup12x18_3 },
    { num: 4, src: mockup12x18_4 }, { num: 5, src: mockup12x18_5 }, { num: 6, src: mockup12x18_6 },
    { num: 7, src: mockup12x18_7 }, { num: 8, src: mockup12x18_8 },
  ],
  '16x24': [
    { num: 1, src: mockup16x24_1 }, { num: 2, src: mockup16x24_2 }, { num: 3, src: mockup16x24_3 },
    { num: 4, src: mockup16x24_4 }, { num: 5, src: mockup16x24_5 }, { num: 6, src: mockup16x24_6 },
    { num: 7, src: mockup16x24_7 }, { num: 8, src: mockup16x24_8 },
  ],
  '20x30': [
    { num: 3, src: mockup20x30_3 }, { num: 4, src: mockup20x30_4 }, { num: 5, src: mockup20x30_5 },
    { num: 6, src: mockup20x30_6 }, { num: 7, src: mockup20x30_7 }, { num: 8, src: mockup20x30_8 },
  ],
};

// Helper: get flat src array for a size
const getMockupSrcs = (sizeId) => (MOCKUPS_BY_NUMBER[sizeId] || []).map(m => m.src);
const getMockupNums = (sizeId) => (MOCKUPS_BY_NUMBER[sizeId] || []).map(m => m.num);

/* ── Extracted sub-components (stable references, no re-creation per render) ── */

function ArtworkPanel({ className = '', compositingLoading, displayImages, activeThumb, setEmblaApi, handleThumbSelect }) {
  return (
    <div className={className}>
      {compositingLoading ? (
        <div className="w-full flex items-center justify-center" style={{ aspectRatio: '4/5', backgroundColor: '#F5F5F5' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#E0E0E0', borderTopColor: 'transparent' }} />
            <span className="text-body-sm" style={{ color: '#999' }}>Preparing your mockups…</span>
          </div>
        </div>
      ) : (
        <div className="relative" style={{ backgroundColor: '#F5F5F5' }}>
          <Carousel
            opts={{ align: 'start', loop: false, startIndex: activeThumb }}
            setApi={setEmblaApi}
            className="w-full"
          >
            <CarouselContent className="-ml-0">
              {displayImages.map((src, i) => (
                <CarouselItem key={i} className="pl-0 basis-full">
                  <img
                    src={src}
                    alt={`Canvas mockup ${i + 1}`}
                    className="w-full object-contain select-none pointer-events-none"
                    style={{ userSelect: 'none', WebkitUserDrag: 'none' }}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center px-4">
            <ThumbnailStrip
              images={displayImages}
              activeIndex={activeThumb}
              onSelect={handleThumbSelect}
              size={30}
            />
          </div>
        </div>
      )}
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
}

function SizeCard({ size, selectedSize, onSelect, vertical = false }) {
  return (
    <button
      data-size-card={size.id}
      onClick={() => onSelect(size.id)}
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
}

function SizeSelector({ vertical = false, selectedSize, onSizeChange, sizeCarouselRef }) {
  return (
    <div>
      <h2 className="text-a2" style={{ color: '#333333', marginBottom: vertical ? '16px' : 0 }}>
        Choose Your Size
      </h2>
      {vertical ? (
        <div className="flex flex-col" style={{ gap: 10 }}>
          {SIZE_OPTIONS.map((size) => (
            <SizeCard key={size.id} size={size} selectedSize={selectedSize} onSelect={onSizeChange} vertical />
          ))}
        </div>
      ) : (
        <div className="-mx-4" style={{ overflow: 'clip visible' }}>
          <div ref={sizeCarouselRef} className="overflow-x-auto scrollbar-hide" style={{ overflowY: 'visible', overflow: 'auto visible' }}>
            <div className="flex w-max pb-2 pt-4 pl-4 pr-4" style={{ gap: 8 }}>
              {SIZE_OPTIONS.map((size) => (
                <SizeCard key={size.id} size={size} selectedSize={selectedSize} onSelect={onSizeChange} />
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
}

function OrderSummary({ sunSign, sizeLabel, total, onCheckout }) {
  return (
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
            <span>Birth Chart Artwork — {sunSign} Sun</span>
            <span>Included</span>
          </div>
          <div className="flex justify-between" style={{ color: '#CCCCCC' }}>
            <span>{sizeLabel} Canvas</span>
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
          onClick={onCheckout}
          className="btn-base btn-primary w-full justify-center"
          style={{ borderRadius: '40px', height: '52px', fontSize: '14px' }}
        >
          Continue to Secure Checkout — ${total}
        </button>
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3">
            <span style={{ fontSize: '18px' }}>🔄</span>
            <div>
              <p className="text-a5" style={{ color: '#FFFFFF' }}>30-day quality guarantee.</p>
              <p className="text-body-sm" style={{ color: '#999999', marginTop: '2px' }}>Damaged or defective? We'll reprint or refund.</p>
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
}

export function ProductCustomization({ chartData, artworkImage, onCheckout, onBack, formData, onEditBirthData }) {
  const [selectedSize, setSelectedSize] = useState('12x18');
  const [activeThumb, setActiveThumb] = useState(0);
  const sizeCarouselRef = useRef(null);
  const isFirstSizeScroll = useRef(true);

  const sizeData = SIZE_OPTIONS.find(s => s.id === selectedSize);
  const total = sizeData?.price || 119;
  const mockups = useMemo(() => getMockupSrcs(selectedSize), [selectedSize]);
  const mockupNums = useMemo(() => getMockupNums(selectedSize), [selectedSize]);

  // Composite selected size (shows spinner if not cached yet)
  const { composited: compositedImages, loading: compositingLoading } = useCompositedMockups(mockups, artworkImage);
  const displayImages = compositedImages.length ? compositedImages : mockups;

  // Background-preload the other two sizes so switching is instant
  const otherMockupSets = useMemo(() => {
    const allSizes = ['12x18', '16x24', '20x30'];
    return allSizes.filter(s => s !== selectedSize).map(getMockupSrcs);
  }, [selectedSize]);
  useBackgroundPreload(otherMockupSets, artworkImage);

  // When switching sizes, try to keep the same mockup number; fall back to index 0
  const handleSizeChange = useCallback((sizeId) => {
    const savedScroll = sizeCarouselRef.current?.scrollLeft;
    const currentNum = getMockupNums(selectedSize)[activeThumb];
    const newNums = getMockupNums(sizeId);
    const matchIndex = newNums.indexOf(currentNum);
    setSelectedSize(sizeId);
    const newIndex = matchIndex >= 0 ? matchIndex : 0;
    setActiveThumb(newIndex);
    // Restore scroll position after React re-renders
    if (savedScroll != null) {
      requestAnimationFrame(() => {
        if (sizeCarouselRef.current) {
          sizeCarouselRef.current.scrollLeft = savedScroll;
        }
      });
    }
  }, [selectedSize, activeThumb]);

  // --- Embla carousel state ---
  const [emblaApi, setEmblaApi] = useState(null);

  // Sync activeThumb when Embla settles on a new slide
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveThumb(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi]);

  // When activeThumb changes externally (e.g. size switch), scroll Embla to match
  useEffect(() => {
    if (emblaApi && emblaApi.selectedScrollSnap() !== activeThumb) {
      emblaApi.scrollTo(activeThumb, true); // instant jump
    }
  }, [emblaApi, activeThumb]);

  const handleThumbSelect = useCallback((index) => {
    if (!emblaApi) return;
    emblaApi.scrollTo(index);
  }, [emblaApi]);

  // On first mount only, scroll to the selected card on mobile
  useEffect(() => {
    const carousel = sizeCarouselRef.current;
    if (!carousel || window.innerWidth >= 768) return;
    if (!isFirstSizeScroll.current) return;

    const selectedCard = carousel.querySelector(`[data-size-card="${selectedSize}"]`);
    if (!selectedCard) return;

    const targetLeft = Math.max(
      0,
      selectedCard.offsetLeft - (carousel.clientWidth - selectedCard.offsetWidth) / 2
    );

    carousel.scrollTo({ left: targetLeft, behavior: 'auto' });
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

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#FFFFFF' }}>
      <div>
        <Header variant="dark" />
        <StepProgressBar currentStep={3} />
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
        <div className="px-4 pb-16 flex flex-col gap-16" style={{ paddingTop: '60px' }}>
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
        {/* Reviews — light theme */}
        <ReviewsList theme="light" gap={5} py={5} className="px-4 pb-16" />
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
            <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
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

              {/* Reviews — light theme */}
              <ReviewsList theme="light" gap={6} py={6} />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
