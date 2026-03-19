import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StepProgressBar from '@/components/ui/StepProgressBar';
import BirthDataBar from '@/components/ui/BirthDataBar';
import Footer from '@/components/Layout/Footer';
import Header from '@/components/Layout/Header';
import ThumbnailStrip from '@/components/ui/ThumbnailStrip';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import galaxyBg from '@/assets/galaxy-bg.jpg';
import ReviewsList from '@/components/ui/ReviewsList';
import { PHONE_CASE_MODELS, PHONE_CASE_MODEL_MAP } from '@/lib/phoneCaseSizes';

// Phone case carousel images (static — no chroma key compositing needed for gallery)
import caseMockup1 from '@/assets/mockups/phone-case/mockup-1.webp';
import caseMockup2 from '@/assets/mockups/phone-case/mockup-2.webp';
import caseMockup3 from '@/assets/mockups/phone-case/mockup-3.webp';
import caseMockup4 from '@/assets/mockups/phone-case/mockup-4.webp';
import caseMockup5 from '@/assets/mockups/phone-case/mockup-5.webp';

// Detail images reused from canvas page
import womanHolding from '@/assets/gallery/woman-holding.webp';

const CASE_IMAGES = [caseMockup1, caseMockup2, caseMockup3, caseMockup4, caseMockup5];

const MODEL_OPTIONS = PHONE_CASE_MODELS.map((m) => ({
  ...m,
  popular: m.id === 'iphone-15',
}));

/* ── Sub-components ── */

function CaseGallery({ displayImages, activeThumb, setEmblaApi, handleThumbSelect, className = '' }) {
  return (
    <div className={className}>
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
                  alt={`Phone case mockup ${i + 1}`}
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

import PopularTag from '@/components/ui/PopularTag';

function ModelCard({ model, selectedModel, onSelect, vertical = false }) {
  return (
    <button
      data-model-card={model.id}
      onClick={() => onSelect(model.id)}
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
        border: selectedModel === model.id ? '2px solid #333333' : '1px solid #E0E0E0',
        backgroundColor: '#FFFFFF',
      }}
    >
      {model.popular && (
        <div className="absolute z-10" style={{ top: '-12px', right: '-4px' }}>
          <PopularTag>Most popular</PopularTag>
        </div>
      )}
      <div className="text-left min-w-0 flex-1 pr-2">
        <p className="text-a4" style={{ color: '#333333' }}>{model.label}</p>
        <p className="text-body-sm" style={{ color: '#888888', marginTop: '2px' }}>{model.description}</p>
      </div>
      <p className="text-a4 font-bold flex-shrink-0 whitespace-nowrap" style={{ color: '#333333', marginLeft: '8px' }}>${model.price}</p>
    </button>
  );
}

function ModelSelector({ vertical = false, selectedModel, onModelChange, modelCarouselRef }) {
  return (
    <div>
      <h2 className="text-a2" style={{ color: '#333333', marginBottom: vertical ? '16px' : 0 }}>
        Choose Your Phone
      </h2>
      {vertical ? (
        <div className="flex flex-col" style={{ gap: 10 }}>
          {MODEL_OPTIONS.map((model) => (
            <ModelCard key={model.id} model={model} selectedModel={selectedModel} onSelect={onModelChange} vertical />
          ))}
        </div>
      ) : (
        <div className="-mx-4" style={{ overflow: 'clip visible' }}>
          <div ref={modelCarouselRef} className="overflow-x-auto scrollbar-hide" style={{ overflowY: 'visible', overflow: 'auto visible' }}>
            <div className="flex w-max pb-2 pt-4 pl-4 pr-4" style={{ gap: 8 }}>
              {MODEL_OPTIONS.map((model) => (
                <ModelCard key={model.id} model={model} selectedModel={selectedModel} onSelect={onModelChange} />
              ))}
            </div>
          </div>
        </div>
      )}
      <p className="text-body-sm" style={{ color: '#888888', marginTop: '4px' }}>
        🌱 Premium eco-friendly case · Biodegradable materials
      </p>
    </div>
  );
}

function CaseOrderSummary({ sunSign, modelLabel, total, onCheckout }) {
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
            <span>Birth Chart Phone Case — {sunSign} Sun</span>
            <span>Included</span>
          </div>
          <div className="flex justify-between" style={{ color: '#CCCCCC' }}>
            <span>{modelLabel} Eco Case</span>
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
            <span>Calculated at checkout</span>
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
              <p className="text-body-sm" style={{ color: '#999999', marginTop: '2px' }}>Damaged or defective? We'll replace or refund.</p>
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

export function PhoneCaseCustomization({ chartData, artworkImage, onCheckout, onBack, formData, onEditBirthData }) {
  const [selectedModel, setSelectedModel] = useState('iphone-15');
  const [activeThumb, setActiveThumb] = useState(0);
  const modelCarouselRef = useRef(null);
  const isFirstScroll = useRef(true);

  const modelData = PHONE_CASE_MODEL_MAP[selectedModel];
  const total = modelData?.price || 57;

  const [emblaApi, setEmblaApi] = useState(null);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveThumb(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi && emblaApi.selectedScrollSnap() !== activeThumb) {
      emblaApi.scrollTo(activeThumb, true);
    }
  }, [emblaApi, activeThumb]);

  const handleThumbSelect = useCallback((index) => {
    if (!emblaApi) return;
    emblaApi.scrollTo(index);
  }, [emblaApi]);

  const handleModelChange = useCallback((modelId) => {
    setSelectedModel(modelId);
  }, []);

  useEffect(() => {
    const carousel = modelCarouselRef.current;
    if (!carousel || window.innerWidth >= 768) return;
    if (!isFirstScroll.current) return;

    const selectedCard = carousel.querySelector(`[data-model-card="${selectedModel}"]`);
    if (!selectedCard) return;

    const targetLeft = Math.max(
      0,
      selectedCard.offsetLeft - (carousel.clientWidth - selectedCard.offsetWidth) / 2
    );
    carousel.scrollTo({ left: targetLeft, behavior: 'auto' });
    isFirstScroll.current = false;
  }, [selectedModel]);

  const scrollToOrder = () => {
    const el = document.getElementById('case-order-summary-mobile') || document.getElementById('case-order-summary-desktop');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleCheckout = () => {
    onCheckout({
      size: selectedModel,
      sizeLabel: modelData?.label,
      frame: 'phone-case',
      frameName: 'Eco Phone Case',
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
        <CaseGallery displayImages={CASE_IMAGES} activeThumb={activeThumb} setEmblaApi={setEmblaApi} handleThumbSelect={handleThumbSelect} />

        <div className="pt-6 pb-4 px-4">
          <ModelSelector selectedModel={selectedModel} onModelChange={handleModelChange} modelCarouselRef={modelCarouselRef} />
        </div>

        <div id="case-order-summary-mobile" className="px-4" style={{ paddingBottom: '32px', marginTop: '23px' }}>
          <CaseOrderSummary sunSign={chartData?.sun?.sign || 'Gemini'} modelLabel={modelData?.label} total={total} onCheckout={handleCheckout} />
        </div>

        {/* Mobile — Eco Materials + Gift */}
        <div className="px-4 pb-16 flex flex-col gap-16" style={{ paddingTop: '60px' }}>
          <div>
            <img src={caseMockup5} alt="Eco-friendly phone case material detail" className="w-full object-cover" style={{ borderRadius: 2, aspectRatio: '1/1' }} loading="lazy" />
            <div className="mt-4">
              <p className="text-subtitle text-surface-muted tracking-widest mb-2">ECO-FRIENDLY MATERIALS</p>
              <h3 className="text-a2 text-surface-foreground mb-4">Good for You. Good for the Planet.</h3>
              <p className="text-body text-surface-muted">
                Made from biodegradable plant-based materials with a premium matte finish. Slim profile with full-edge protection. Designed to protect your phone and the planet.
              </p>
              <button onClick={scrollToOrder} className="link-a5 font-body text-surface-foreground mt-4">
                Continue to checkout
              </button>
            </div>
          </div>
          <div>
            <img src={womanHolding} alt="Happy customer with their personalized phone case" className="w-full object-cover" style={{ borderRadius: 2, aspectRatio: '40/29' }} loading="lazy" />
            <div className="mt-4">
              <p className="text-subtitle text-surface-muted tracking-widest mb-2">THE PERFECT GIFT</p>
              <h3 className="text-a2 text-surface-foreground mb-4">Impossible to Duplicate. Impossible to Forget.</h3>
              <p className="text-body text-surface-muted">
                A phone case as unique as their birth chart. Created from their exact cosmic blueprint — no two are ever alike.
              </p>
              <button onClick={scrollToOrder} className="link-a5 font-body text-surface-foreground mt-4">
                Continue to checkout
              </button>
            </div>
          </div>
        </div>

        <ReviewsList theme="light" gap={5} py={5} className="px-4 pb-16" />
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block">
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="flex gap-12 items-start">
            {/* Left — gallery (sticky) */}
            <div className="w-1/2 flex-shrink-0 sticky top-8">
              <CaseGallery displayImages={CASE_IMAGES} activeThumb={activeThumb} setEmblaApi={setEmblaApi} handleThumbSelect={handleThumbSelect} />
            </div>

            {/* Right — scrollable content */}
            <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
              {/* Headline + description */}
              <div>
                <h1 className="text-a1-special text-surface-foreground" style={{ marginBottom: '16px' }}>
                  Built to Last, Designed to Decompose
                </h1>
                <p className="text-body text-surface-muted">
                  Your Cosmic Collage is printed directly onto a slim, matte-finish case made from bamboo fibre and biodegradable bioplastic. It's tough enough to survive a 5-foot drop, scratch-resistant, and slim enough to forget it's there — until someone asks about it (and they will).
                </p>
              </div>

              {/* Model selector dropdown */}
              <div>
                <h3 className="text-a3 text-surface-foreground" style={{ marginBottom: '12px' }}>Select Your Phone</h3>
                <Select value={selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger
                    className="w-full text-a4 [&>span]:flex-1 [&>span]:overflow-visible [&>span]:line-clamp-none gap-6"
                    style={{
                      display: 'flex',
                      height: '74px',
                      borderRadius: '2px',
                      border: '1px solid #E0E0E0',
                      backgroundColor: '#FFFFFF',
                      padding: '15px 20px',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      color: selectedModel ? '#333333' : '#999999',
                    }}
                  >
                    <SelectValue placeholder="Choose your model to see a preview">
                      {selectedModel && modelData && (
                        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch', width: '100%' }}>
                          <span className="text-a4" style={{ color: '#333333' }}>{modelData.label}</span>
                          <span className="text-a4 font-bold" style={{ color: '#333333' }}>${modelData.price}</span>
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <span className="flex items-center justify-between w-full">
                          <span>{model.label}</span>
                          <span className="font-bold ml-4">${model.price}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Feature bullets */}
              <div className="flex flex-col" style={{ gap: '12px' }}>
                <p className="text-body text-surface-foreground">🥊 5-ft drop tested — Shock-absorbing protection</p>
                <p className="text-body text-surface-foreground">🌿 100% biodegradable — Bamboo fibre &amp; bioplastic, zero BPA</p>
                <p className="text-body text-surface-foreground">📶 Wireless charging compatible</p>
                <p className="text-body text-surface-foreground">🎨 UV printed, matte finish — Vivid color that won't scratch off</p>
              </div>

              {/* CTA button */}
              <div id="case-order-summary-desktop" style={{ marginTop: '32px' }}>
                <button
                  onClick={handleCheckout}
                  className="btn-base btn-primary w-full justify-center"
                  style={{ borderRadius: '40px', height: '56px', fontSize: '16px' }}
                >
                  Add to Order — ${total}
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-col" style={{ gap: '16px', marginTop: '16px' }}>
                <div className="flex items-start gap-3">
                  <span style={{ fontSize: '24px' }}>🔄</span>
                  <div>
                    <p className="text-a5 text-surface-foreground">30-day money-back guarantee.</p>
                    <p className="text-body-sm text-surface-muted" style={{ marginTop: '2px' }}>Love it or your money back. No questions asked.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span style={{ fontSize: '24px' }}>📦</span>
                  <div>
                    <p className="text-a5 text-surface-foreground">Ships in 2-3 business days</p>
                    <p className="text-body-sm text-surface-muted" style={{ marginTop: '2px' }}>Order by 5pm EST for same-day processing.</p>
                  </div>
                </div>
              </div>

              <ReviewsList theme="light" gap={6} py={6} />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
